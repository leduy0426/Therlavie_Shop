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
var GuestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
let GuestService = GuestService_1 = class GuestService {
    constructor(prisma, notificationService, configService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.configService = configService;
        this.logger = new common_1.Logger(GuestService_1.name);
    }
    async requestCheckoutOtp(dto) {
        const phoneNumber = dto.phoneNumber.trim();
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentRequests = await this.prisma.otpVerification.count({
            where: {
                targetIdentifier: phoneNumber,
                otpType: client_1.OtpType.GUEST_CHECKOUT,
                createdAt: { gte: oneHourAgo },
            },
        });
        if (recentRequests >= 3) {
            throw new common_1.ForbiddenException('Exceeded maximum OTP requests (3 requests/hour). Please retry later (BR-03).');
        }
        const latestOtp = await this.prisma.otpVerification.findFirst({
            where: {
                targetIdentifier: phoneNumber,
                otpType: client_1.OtpType.GUEST_CHECKOUT,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (latestOtp && latestOtp.resendCooldownUntil > new Date()) {
            const waitSeconds = Math.ceil((latestOtp.resendCooldownUntil.getTime() - Date.now()) / 1000);
            throw new common_1.BadRequestException(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
        }
        const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
        const ttlSeconds = this.configService.get('AUTH_OTP_TTL_SECONDS') || 300;
        const cooldownSeconds = this.configService.get('AUTH_OTP_COOLDOWN_SECONDS') || 60;
        await this.prisma.otpVerification.updateMany({
            where: {
                targetIdentifier: phoneNumber,
                otpType: client_1.OtpType.GUEST_CHECKOUT,
                isConsumed: false,
            },
            data: { isConsumed: true },
        });
        await this.prisma.otpVerification.create({
            data: {
                targetIdentifier: phoneNumber,
                otpCodeHash: otpHash,
                otpType: client_1.OtpType.GUEST_CHECKOUT,
                expiresAt: new Date(Date.now() + ttlSeconds * 1000),
                resendCooldownUntil: new Date(Date.now() + cooldownSeconds * 1000),
            },
        });
        const dispatchResult = await this.notificationService.sendGuestCheckoutSmsOtp(phoneNumber, rawOtp, dto.email);
        return {
            message: `Verification code sent via ${dispatchResult.channel}.`,
            phoneNumber,
            expiresInSeconds: ttlSeconds,
            cooldownSeconds,
        };
    }
    async verifyCheckoutOtp(dto) {
        const phoneNumber = dto.phoneNumber.trim();
        const latestOtp = await this.prisma.otpVerification.findFirst({
            where: {
                targetIdentifier: phoneNumber,
                otpType: client_1.OtpType.GUEST_CHECKOUT,
                isConsumed: false,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!latestOtp) {
            throw new common_1.BadRequestException('No pending verification code found. Please request a new code.');
        }
        if (latestOtp.expiresAt < new Date()) {
            throw new common_1.BadRequestException('OTP expired. Please request a new code.');
        }
        if (latestOtp.attempts >= 5) {
            throw new common_1.ForbiddenException('Phone number verification locked for 15 minutes due to 5 failed attempts (BR-03, NFR-03).');
        }
        const hashedInput = crypto.createHash('sha256').update(dto.otpCode).digest('hex');
        if (hashedInput !== latestOtp.otpCodeHash) {
            const updatedAttempts = latestOtp.attempts + 1;
            await this.prisma.otpVerification.update({
                where: { id: latestOtp.id },
                data: { attempts: updatedAttempts },
            });
            const remaining = 5 - updatedAttempts;
            throw new common_1.BadRequestException(`Invalid OTP code. ${remaining} attempts remaining.`);
        }
        await this.prisma.otpVerification.update({
            where: { id: latestOtp.id },
            data: { isConsumed: true },
        });
        const verificationToken = 'gvt_' + crypto.randomBytes(32).toString('hex');
        const tokenTtlMinutes = this.configService.get('GUEST_CHECKOUT_TOKEN_TTL_MINUTES') || 15;
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
};
exports.GuestService = GuestService;
exports.GuestService = GuestService = GuestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService,
        config_1.ConfigService])
], GuestService);
//# sourceMappingURL=guest.service.js.map