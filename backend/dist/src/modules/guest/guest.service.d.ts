import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { GuestOtpRequestDto } from './dto/guest-otp-request.dto';
import { GuestOtpVerifyDto } from './dto/guest-otp-verify.dto';
export declare class GuestService {
    private readonly prisma;
    private readonly notificationService;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationService: NotificationService, configService: ConfigService);
    requestCheckoutOtp(dto: GuestOtpRequestDto): Promise<{
        message: string;
        phoneNumber: string;
        expiresInSeconds: number;
        cooldownSeconds: number;
    }>;
    verifyCheckoutOtp(dto: GuestOtpVerifyDto): Promise<{
        verified: boolean;
        phoneNumber: string;
        guestVerificationToken: string;
        expiresInSeconds: number;
        message: string;
    }>;
}
