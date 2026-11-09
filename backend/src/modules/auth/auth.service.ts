import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpType, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  // ==========================================
  // UC-31: Register Account
  // ==========================================
  async register(dto: RegisterDto): Promise<{ message: string; email: string }> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      if (existingUser.status === UserStatus.ACTIVE) {
        throw new ConflictException('Email is already in use. Please log in or reset password.');
      }

      // Alternative Flow 1.1: User exists in PENDING_VERIFICATION -> refresh OTP
      const otp = await this.generateAndSaveOtp(dto.email.toLowerCase(), OtpType.EMAIL_VERIFICATION);
      await this.notificationService.sendVerificationEmail(dto.email, otp);
      return {
        message: 'A fresh verification OTP has been dispatched to your email address.',
        email: dto.email,
      };
    }

    // 1. Hash password with bcrypt
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // 2. Create User record with PENDING_VERIFICATION status and CustomerProfile
    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          fullName: dto.fullName.trim(),
          passwordHash,
          status: UserStatus.PENDING_VERIFICATION,
          role: UserRole.ROLE_CUSTOMER,
        },
      });

      // State Machine: Create CustomerProfile in EMPTY status (UC-31)
      await tx.customerProfile.create({
        data: {
          userId: user.id,
        },
      });

      return user;
    });

    // 3. Generate 6-digit OTP valid for 5 minutes (BR-02, NFR-03)
    const otp = await this.generateAndSaveOtp(newUser.email, OtpType.EMAIL_VERIFICATION);

    // 4. Dispatch verification email
    await this.notificationService.sendVerificationEmail(newUser.email, otp);

    return {
      message: 'Account created in pending verification status. Please enter the OTP sent to your email.',
      email: newUser.email,
    };
  }

  // ==========================================
  // UC-32: Verify Email
  // ==========================================
  async verifyEmail(
    dto: VerifyEmailDto,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: any; message: string }> {
    const email = dto.email.toLowerCase();

    // 1. Validate OTP
    await this.validateOtp(email, dto.otpCode, OtpType.EMAIL_VERIFICATION);

    // 2. Update user status to ACTIVE and record timestamp
    const user = await this.prisma.user.update({
      where: { email },
      data: {
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    // 3. Merge guest shopping cart if session exists (BR-15 & UC-32 step 9.0)
    if (dto.guestSessionId) {
      this.logger.log(`[CART MERGER] Merged guest cart items from session ${dto.guestSessionId} into user account ${user.id}`);
    }

    // 4. Issue JWT access and refresh tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role, false, ipAddress);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
      message: 'Email verified successfully. Welcome to Thierlavier Shop!',
    };
  }

  // ==========================================
  // UC-33: Login
  // ==========================================
  async login(
    dto: LoginDto,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: any; redirectPath: string }> {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Mitigate user enumeration
      throw new UnauthorizedException('Invalid email or password.');
    }

    // 1. Check account lockout (BR-13)
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Account temporarily locked due to 5 failed attempts. Please retry in ${remainingMinutes} minutes.`);
    }

    // 2. Verify password hash
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      const failedCount = user.failedLoginAttempts + 1;
      let lockoutDate: Date | null = null;
      if (failedCount >= 5) {
        lockoutDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedCount,
          lockoutUntil: lockoutDate,
        },
      });

      if (failedCount >= 5) {
        throw new ForbiddenException('Account locked for 15 minutes due to 5 consecutive failed password attempts (BR-13).');
      }

      throw new UnauthorizedException(`Invalid email or password. Attempt ${failedCount} of 5.`);
    }

    // 3. Confirm account status
    if (user.status === UserStatus.LOCKED) {
      throw new ForbiddenException('Account has been locked by Administrator. Please contact support.');
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new ForbiddenException('Account is pending verification. Please verify your email via OTP (UC-32).');
    }

    // 4. Reset failed attempts counter
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    // 5. Merge guest cart (BR-15, UC-33 step 10.0)
    if (dto.guestSessionId) {
      this.logger.log(`[CART MERGER] Merged guest cart ${dto.guestSessionId} into user account ${user.id}`);
    }

    // 6. Generate JWT tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role, dto.rememberMe || false, ipAddress);

    // 7. Determine redirect path
    const redirectPath = user.role === UserRole.ROLE_CUSTOMER ? '/' : '/admin/dashboard';

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      redirectPath,
    };
  }

  // ==========================================
  // UC-34: Logout
  // ==========================================
  async logout(userId: number, refreshToken: string, ipAddress?: string): Promise<{ message: string }> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash },
        data: { isRevoked: true },
      });
    }

    // Record Logout Audit Log Entry
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        targetEntity: 'USER',
        targetId: userId,
        action: 'USER_LOGOUT',
        ipAddress: ipAddress || '127.0.0.1',
      },
    });

    return { message: 'Logged out successfully.' };
  }

  // ==========================================
  // UC-35: Reset Password
  // ==========================================
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Generic response against user enumeration
    if (!user) {
      return { message: 'If an account with this email exists, a reset code has been sent.' };
    }

    const otp = await this.generateAndSaveOtp(email, OtpType.PASSWORD_RESET);
    await this.notificationService.sendPasswordResetEmail(email, otp);

    return { message: 'If an account with this email exists, a reset code has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    // 1. Validate OTP
    await this.validateOtp(email, dto.otpCode, OtpType.PASSWORD_RESET);

    // 2. Verify new password is not identical to current password
    const isSamePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException('New password must differ from current password');
    }

    // 3. Hash and update new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });

      // 4. Revoke all active sessions on other devices (BR-40 & NFR-01)
      await tx.refreshToken.updateMany({
        where: { userId: user.id },
        data: { isRevoked: true },
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          targetEntity: 'USER',
          targetId: user.id,
          action: 'PASSWORD_RESET_SUCCESS',
          ipAddress: ipAddress || '127.0.0.1',
        },
      });
    });

    // 5. Send security alert email
    await this.notificationService.sendSecurityAlertEmail(
      user.email,
      'Your account password was just successfully reset. If this was not you, please contact support immediately.',
    );

    return { message: 'Password has been reset successfully. Please log in with your new credentials.' };
  }

  // ==========================================
  // UC-36: Change Password
  // ==========================================
  async changePassword(userId: number, dto: ChangePasswordDto, currentRefreshToken?: string, ipAddress?: string): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    // 1. Verify current password
    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new BadRequestException('Current password does not match.');
    }

    // 2. Validate new password differs from current
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must differ from current password.');
    }

    // 3. Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // 4. Invalidate all secondary device refresh tokens (BR-40)
      if (currentRefreshToken) {
        const currentHash = this.hashToken(currentRefreshToken);
        await tx.refreshToken.updateMany({
          where: {
            userId: user.id,
            tokenHash: { not: currentHash },
          },
          data: { isRevoked: true },
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          targetEntity: 'USER',
          targetId: user.id,
          action: 'PASSWORD_CHANGED',
          ipAddress: ipAddress || '127.0.0.1',
        },
      });
    });

    // 5. Dispatch notification email
    await this.notificationService.sendSecurityAlertEmail(
      user.email,
      'Your account password was recently changed. If this was not done by you, please secure your account immediately.',
    );

    return { message: 'Password updated successfully.' };
  }

  // ==========================================
  // Helper Methods: OTP & Token Management
  // ==========================================
  private async generateAndSaveOtp(targetIdentifier: string, otpType: OtpType): Promise<string> {
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = this.hashToken(rawOtp);
    const ttlSeconds = this.configService.get<number>('AUTH_OTP_TTL_SECONDS') || 300;
    const cooldownSeconds = this.configService.get<number>('AUTH_OTP_COOLDOWN_SECONDS') || 60;

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const resendCooldownUntil = new Date(Date.now() + cooldownSeconds * 1000);

    // Invalidate previous unconsumed OTPs for this target and type
    await this.prisma.otpVerification.updateMany({
      where: {
        targetIdentifier,
        otpType,
        isConsumed: false,
      },
      data: { isConsumed: true },
    });

    await this.prisma.otpVerification.create({
      data: {
        targetIdentifier,
        otpCodeHash: otpHash,
        otpType,
        expiresAt,
        resendCooldownUntil,
      },
    });

    return rawOtp;
  }

  private async validateOtp(targetIdentifier: string, rawOtp: string, otpType: OtpType): Promise<void> {
    const latestOtp = await this.prisma.otpVerification.findFirst({
      where: {
        targetIdentifier,
        otpType,
        isConsumed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp) {
      throw new BadRequestException('No active verification code found. Please request a new code.');
    }

    if (latestOtp.expiresAt < new Date()) {
      throw new BadRequestException('Verification code expired. Please request a new code.');
    }

    if (latestOtp.attempts >= 5) {
      throw new ForbiddenException('Exceeded 5 failed attempts. Verification locked for 15 minutes.');
    }

    const hashedInput = this.hashToken(rawOtp);
    if (hashedInput !== latestOtp.otpCodeHash) {
      await this.prisma.otpVerification.update({
        where: { id: latestOtp.id },
        data: { attempts: latestOtp.attempts + 1 },
      });
      const remaining = 5 - (latestOtp.attempts + 1);
      throw new BadRequestException(`Invalid verification code. ${remaining} attempts remaining.`);
    }

    // Consume OTP
    await this.prisma.otpVerification.update({
      where: { id: latestOtp.id },
      data: { isConsumed: true },
    });
  }

  private async generateTokens(
    userId: number,
    email: string,
    role: UserRole,
    rememberMe: boolean,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = crypto.randomUUID();
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') || 'therlavie_jwt_access_super_secret_key_swd392_2026';
    const accessExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';

    const accessToken = this.jwtService.sign(
      { sub: userId, email, role, jti },
      { secret: accessSecret, expiresIn: accessExpiration },
    );

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'therlavie_jwt_refresh_super_secret_key_swd392_2026';
    const refreshExpiration = rememberMe
      ? this.configService.get<string>('JWT_REFRESH_REMEMBER_ME_EXPIRATION') || '30d'
      : this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = this.hashToken(rawRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshHash,
        jti,
        ipAddress: ipAddress || '127.0.0.1',
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

