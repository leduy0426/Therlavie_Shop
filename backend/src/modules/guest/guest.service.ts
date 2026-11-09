import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpType } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { GuestOtpRequestDto } from './dto/guest-otp-request.dto';
import { GuestOtpVerifyDto } from './dto/guest-otp-verify.dto';

@Injectable()
export class GuestService {
  private readonly logger = new Logger(GuestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  // UC-39: Request SMS OTP for Guest Checkout
  async requestCheckoutOtp(dto: GuestOtpRequestDto) {
    const phoneNumber = dto.phoneNumber.trim();

    // BR-03: Maximum 3 OTP requests per hour per phone number
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await this.prisma.otpVerification.count({
      where: {
        targetIdentifier: phoneNumber,
        otpType: OtpType.GUEST_CHECKOUT,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentRequests >= 3) {
      throw new ForbiddenException('Exceeded maximum OTP requests (3 requests/hour). Please retry later (BR-03).');
    }

    // Check resend cooldown (60 seconds)
    const latestOtp = await this.prisma.otpVerification.findFirst({
      where: {
        targetIdentifier: phoneNumber,
        otpType: OtpType.GUEST_CHECKOUT,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp && latestOtp.resendCooldownUntil > new Date()) {
      const waitSeconds = Math.ceil((latestOtp.resendCooldownUntil.getTime() - Date.now()) / 1000);
      throw new BadRequestException(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
    }

    // Generate 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
    const ttlSeconds = this.configService.get<number>('AUTH_OTP_TTL_SECONDS') || 300;
    const cooldownSeconds = this.configService.get<number>('AUTH_OTP_COOLDOWN_SECONDS') || 60;

    // Invalidate existing unconsumed OTPs
    await this.prisma.otpVerification.updateMany({
      where: {
        targetIdentifier: phoneNumber,
        otpType: OtpType.GUEST_CHECKOUT,
        isConsumed: false,
      },
      data: { isConsumed: true },
    });

    await this.prisma.otpVerification.create({
      data: {
        targetIdentifier: phoneNumber,
        otpCodeHash: otpHash,
        otpType: OtpType.GUEST_CHECKOUT,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        resendCooldownUntil: new Date(Date.now() + cooldownSeconds * 1000),
      },
    });

    // Send SMS via NotificationService with fallback
    const dispatchResult = await this.notificationService.sendGuestCheckoutSmsOtp(
      phoneNumber,
      rawOtp,
      dto.email,
    );

    return {
      message: `Verification code sent via ${dispatchResult.channel}.`,
      phoneNumber,
      expiresInSeconds: ttlSeconds,
      cooldownSeconds,
    };
  }

  // UC-39: Verify SMS OTP & Issue Guest Checkout Token
  async verifyCheckoutOtp(dto: GuestOtpVerifyDto) {
    const phoneNumber = dto.phoneNumber.trim();

    const latestOtp = await this.prisma.otpVerification.findFirst({
      where: {
        targetIdentifier: phoneNumber,
        otpType: OtpType.GUEST_CHECKOUT,
        isConsumed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp) {
      throw new BadRequestException('No pending verification code found. Please request a new code.');
    }

    if (latestOtp.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired. Please request a new code.');
    }

    if (latestOtp.attempts >= 5) {
      throw new ForbiddenException('Phone number verification locked for 15 minutes due to 5 failed attempts (BR-03, NFR-03).');
    }

    const hashedInput = crypto.createHash('sha256').update(dto.otpCode).digest('hex');
    if (hashedInput !== latestOtp.otpCodeHash) {
      const updatedAttempts = latestOtp.attempts + 1;
      await this.prisma.otpVerification.update({
        where: { id: latestOtp.id },
        data: { attempts: updatedAttempts },
      });
      const remaining = 5 - updatedAttempts;
      throw new BadRequestException(`Invalid OTP code. ${remaining} attempts remaining.`);
    }

    // Mark OTP consumed
    await this.prisma.otpVerification.update({
      where: { id: latestOtp.id },
      data: { isConsumed: true },
    });

    // Issue Guest Checkout Verification Token valid for 15 minutes (to unlock UC-08 Place Order)
    const verificationToken = 'gvt_' + crypto.randomBytes(32).toString('hex');
    const tokenTtlMinutes = this.configService.get<number>('GUEST_CHECKOUT_TOKEN_TTL_MINUTES') || 15;
    const expiresAt = new Date(Date.now() + tokenTtlMinutes * 60 * 1000);

    await this.prisma.guestCheckoutVerification.create({
      data: {
        phoneNumber,
        verificationToken,
        isVerified: true,
        expiresAt,
      },
    });

    return {
      verified: true,
      phoneNumber,
      guestVerificationToken: verificationToken,
      expiresInSeconds: tokenTtlMinutes * 60,
      message: 'Phone number verified successfully. You may now proceed with order placement (UC-08).',
    };
  }
}

