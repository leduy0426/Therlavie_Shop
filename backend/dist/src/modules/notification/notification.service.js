"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor() {
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async sendVerificationEmail(email, otpCode) {
        this.logger.log(`[EMAIL DISPATCH] To: ${email} | Subject: Verify Your Thierlavier Account | OTP Code: ${otpCode} (Valid 5m)`);
        return true;
    }
    async sendPasswordResetEmail(email, otpCode) {
        this.logger.log(`[EMAIL DISPATCH] To: ${email} | Subject: Password Reset Code | OTP Code: ${otpCode} (Valid 5m)`);
        return true;
    }
    async sendSecurityAlertEmail(email, message) {
        this.logger.log(`[SECURITY ALERT EMAIL] To: ${email} | Subject: Security Notice - Thierlavier Shop | Detail: ${message}`);
        return true;
    }
    async sendGuestCheckoutSmsOtp(phoneNumber, otpCode, fallbackEmail) {
        try {
            this.logger.log(`[SMS GATEWAY DISPATCH] To: ${phoneNumber} | Message: [Thierlavier] Ma xac thuc checkout cua ban la ${otpCode}. Co han trong 5 phut.`);
            return { success: true, channel: 'SMS' };
        }
        catch (error) {
            if (fallbackEmail) {
                this.logger.warn(`[SMS GATEWAY TIMEOUT] Falling back to email for guest checkout OTP: ${fallbackEmail}`);
                await this.sendVerificationEmail(fallbackEmail, otpCode);
                return { success: true, channel: 'EMAIL' };
            }
            throw error;
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationService);
//# sourceMappingURL=notification.service.js.map