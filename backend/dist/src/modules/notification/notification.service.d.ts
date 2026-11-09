export declare class NotificationService {
    private readonly logger;
    sendVerificationEmail(email: string, otpCode: string): Promise<boolean>;
    sendPasswordResetEmail(email: string, otpCode: string): Promise<boolean>;
    sendSecurityAlertEmail(email: string, message: string): Promise<boolean>;
    sendGuestCheckoutSmsOtp(phoneNumber: string, otpCode: string, fallbackEmail?: string): Promise<{
        success: boolean;
        channel: 'SMS' | 'EMAIL';
    }>;
}
