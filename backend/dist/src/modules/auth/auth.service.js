"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, configService, notificationService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.notificationService = notificationService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(dto) {
        if (dto.password !== dto.confirmPassword) {
            throw new common_1.BadRequestException('Password confirmation does not match');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existingUser) {
            if (existingUser.status === client_1.UserStatus.ACTIVE) {
                throw new common_1.ConflictException('Email is already in use. Please log in or reset password.');
            }
            const otp = await this.generateAndSaveOtp(dto.email.toLowerCase(), client_1.OtpType.EMAIL_VERIFICATION);
            await this.notificationService.sendVerificationEmail(dto.email, otp);
            return {
                message: 'A fresh verification OTP has been dispatched to your email address.',
                email: dto.email,
            };
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const newUser = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: dto.email.toLowerCase(),
                    fullName: dto.fullName.trim(),
                    passwordHash,
                    status: client_1.UserStatus.PENDING_VERIFICATION,
                    role: client_1.UserRole.ROLE_CUSTOMER,
                },
            });
            await tx.customerProfile.create({
                data: {
                    userId: user.id,
                },
            });
            return user;
        });
        const otp = await this.generateAndSaveOtp(newUser.email, client_1.OtpType.EMAIL_VERIFICATION);
        await this.notificationService.sendVerificationEmail(newUser.email, otp);
        return {
            message: 'Account created in pending verification status. Please enter the OTP sent to your email.',
            email: newUser.email,
        };
    }
    async verifyEmail(dto, ipAddress) {
        const email = dto.email.toLowerCase();
        await this.validateOtp(email, dto.otpCode, client_1.OtpType.EMAIL_VERIFICATION);
        const user = await this.prisma.user.update({
            where: { email },
            data: {
                status: client_1.UserStatus.ACTIVE,
                emailVerifiedAt: new Date(),
                failedLoginAttempts: 0,
                lockoutUntil: null,
            },
        });
        if (dto.guestSessionId) {
            this.logger.log(`[CART MERGER] Merged guest cart items from session ${dto.guestSessionId} into user account ${user.id}`);
        }
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
    async login(dto, ipAddress) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
            throw new common_1.ForbiddenException(`Account temporarily locked due to 5 failed attempts. Please retry in ${remainingMinutes} minutes.`);
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            const failedCount = user.failedLoginAttempts + 1;
            let lockoutDate = null;
            if (failedCount >= 5) {
                lockoutDate = new Date(Date.now() + 15 * 60 * 1000);
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: failedCount,
                    lockoutUntil: lockoutDate,
                },
            });
            if (failedCount >= 5) {
                throw new common_1.ForbiddenException('Account locked for 15 minutes due to 5 consecutive failed password attempts (BR-13).');
            }
            throw new common_1.UnauthorizedException(`Invalid email or password. Attempt ${failedCount} of 5.`);
        }
        if (user.status === client_1.UserStatus.LOCKED) {
            throw new common_1.ForbiddenException('Account has been locked by Administrator. Please contact support.');
        }
        if (user.status === client_1.UserStatus.PENDING_VERIFICATION) {
            throw new common_1.ForbiddenException('Account is pending verification. Please verify your email via OTP (UC-32).');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                lockoutUntil: null,
            },
        });
        if (dto.guestSessionId) {
            this.logger.log(`[CART MERGER] Merged guest cart ${dto.guestSessionId} into user account ${user.id}`);
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role, dto.rememberMe || false, ipAddress);
        const redirectPath = user.role === client_1.UserRole.ROLE_CUSTOMER ? '/' : '/admin/dashboard';
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
    async logout(userId, refreshToken, ipAddress) {
        if (refreshToken) {
            const tokenHash = this.hashToken(refreshToken);
            await this.prisma.refreshToken.updateMany({
                where: { userId, tokenHash },
                data: { isRevoked: true },
            });
        }
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
    async forgotPassword(dto) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return { message: 'If an account with this email exists, a reset code has been sent.' };
        }
        const otp = await this.generateAndSaveOtp(email, client_1.OtpType.PASSWORD_RESET);
        await this.notificationService.sendPasswordResetEmail(email, otp);
        return { message: 'If an account with this email exists, a reset code has been sent.' };
    }
    async resetPassword(dto, ipAddress) {
        if (dto.newPassword !== dto.confirmPassword) {
            throw new common_1.BadRequestException('Password confirmation does not match');
        }
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.NotFoundException('User account not found');
        }
        await this.validateOtp(email, dto.otpCode, client_1.OtpType.PASSWORD_RESET);
        const isSamePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
        if (isSamePassword) {
            throw new common_1.BadRequestException('New password must differ from current password');
        }
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
            await tx.refreshToken.updateMany({
                where: { userId: user.id },
                data: { isRevoked: true },
            });
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
        await this.notificationService.sendSecurityAlertEmail(user.email, 'Your account password was just successfully reset. If this was not you, please contact support immediately.');
        return { message: 'Password has been reset successfully. Please log in with your new credentials.' };
    }
    async changePassword(userId, dto, currentRefreshToken, ipAddress) {
        if (dto.newPassword !== dto.confirmPassword) {
            throw new common_1.BadRequestException('Password confirmation does not match');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User account not found');
        }
        const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isCurrentValid) {
            throw new common_1.BadRequestException('Current password does not match.');
        }
        if (dto.currentPassword === dto.newPassword) {
            throw new common_1.BadRequestException('New password must differ from current password.');
        }
        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: user.id },
                data: { passwordHash },
            });
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
        await this.notificationService.sendSecurityAlertEmail(user.email, 'Your account password was recently changed. If this was not done by you, please secure your account immediately.');
        return { message: 'Password updated successfully.' };
    }
    async generateAndSaveOtp(targetIdentifier, otpType) {
        const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = this.hashToken(rawOtp);
        const ttlSeconds = this.configService.get('AUTH_OTP_TTL_SECONDS') || 300;
        const cooldownSeconds = this.configService.get('AUTH_OTP_COOLDOWN_SECONDS') || 60;
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
        const resendCooldownUntil = new Date(Date.now() + cooldownSeconds * 1000);
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
    async validateOtp(targetIdentifier, rawOtp, otpType) {
        const latestOtp = await this.prisma.otpVerification.findFirst({
            where: {
                targetIdentifier,
                otpType,
                isConsumed: false,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!latestOtp) {
            throw new common_1.BadRequestException('No active verification code found. Please request a new code.');
        }
        if (latestOtp.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Verification code expired. Please request a new code.');
        }
        if (latestOtp.attempts >= 5) {
            throw new common_1.ForbiddenException('Exceeded 5 failed attempts. Verification locked for 15 minutes.');
        }
        const hashedInput = this.hashToken(rawOtp);
        if (hashedInput !== latestOtp.otpCodeHash) {
            await this.prisma.otpVerification.update({
                where: { id: latestOtp.id },
                data: { attempts: latestOtp.attempts + 1 },
            });
            const remaining = 5 - (latestOtp.attempts + 1);
            throw new common_1.BadRequestException(`Invalid verification code. ${remaining} attempts remaining.`);
        }
        await this.prisma.otpVerification.update({
            where: { id: latestOtp.id },
            data: { isConsumed: true },
        });
    }
    async generateTokens(userId, email, role, rememberMe, ipAddress) {
        const jti = crypto.randomUUID();
        const accessSecret = this.configService.get('JWT_ACCESS_SECRET') || 'therlavie_jwt_access_super_secret_key_swd392_2026';
        const accessExpiration = this.configService.get('JWT_ACCESS_EXPIRATION') || '15m';
        const accessToken = this.jwtService.sign({ sub: userId, email, role, jti }, { secret: accessSecret, expiresIn: accessExpiration });
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET') || 'therlavie_jwt_refresh_super_secret_key_swd392_2026';
        const refreshExpiration = rememberMe
            ? this.configService.get('JWT_REFRESH_REMEMBER_ME_EXPIRATION') || '30d'
            : this.configService.get('JWT_REFRESH_EXPIRATION') || '7d';
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
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        notification_service_1.NotificationService])
], AuthService);
//# sourceMappingURL=auth.service.js.map