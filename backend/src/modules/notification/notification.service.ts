import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendVerificationEmail(email: string, otpCode: string): Promise<boolean> {
    this.logger.log(`[EMAIL DISPATCH] To: ${email} | Subject: Verify Your Thierlavier Account | OTP Code: ${otpCode} (Valid 5m)`);
    // In production, integrate Nodemailer / SendGrid / AWS SES
    return true;
  }

  async sendPasswordResetEmail(email: string, otpCode: string): Promise<boolean> {
    this.logger.log(`[EMAIL DISPATCH] To: ${email} | Subject: Password Reset Code | OTP Code: ${otpCode} (Valid 5m)`);
    return true;
  }

  async sendSecurityAlertEmail(email: string, message: string): Promise<boolean> {
    this.logger.log(`[SECURITY ALERT EMAIL] To: ${email} | Subject: Security Notice - Thierlavier Shop | Detail: ${message}`);
    return true;
  }

  async sendGuestCheckoutSmsOtp(phoneNumber: string, otpCode: string, fallbackEmail?: string): Promise<{ success: boolean; channel: 'SMS' | 'EMAIL' }> {
    try {
      this.logger.log(`[SMS GATEWAY DISPATCH] To: ${phoneNumber} | Message: [Thierlavier] Ma xac thuc checkout cua ban la ${otpCode}. Co han trong 5 phut.`);
      return { success: true, channel: 'SMS' };
    } catch (error) {
      if (fallbackEmail) {
        this.logger.warn(`[SMS GATEWAY TIMEOUT] Falling back to email for guest checkout OTP: ${fallbackEmail}`);
        await this.sendVerificationEmail(fallbackEmail, otpCode);
        return { success: true, channel: 'EMAIL' };
      }
      throw error;
    }
  }
}

