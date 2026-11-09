import { GuestOtpRequestDto } from './dto/guest-otp-request.dto';
import { GuestOtpVerifyDto } from './dto/guest-otp-verify.dto';
import { GuestService } from './guest.service';
export declare class GuestController {
    private readonly guestService;
    constructor(guestService: GuestService);
    requestOtp(dto: GuestOtpRequestDto): Promise<{
        message: string;
        phoneNumber: string;
        expiresInSeconds: number;
        cooldownSeconds: number;
    }>;
    verifyOtp(dto: GuestOtpVerifyDto): Promise<{
        verified: boolean;
        phoneNumber: string;
        guestVerificationToken: string;
        expiresInSeconds: number;
        message: string;
    }>;
}
