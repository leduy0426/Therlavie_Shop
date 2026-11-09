import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly notificationService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, notificationService: NotificationService);
    register(dto: RegisterDto): Promise<{
        message: string;
        email: string;
    }>;
    verifyEmail(dto: VerifyEmailDto, ipAddress?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
        message: string;
    }>;
    login(dto: LoginDto, ipAddress?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
        redirectPath: string;
    }>;
    logout(userId: number, refreshToken: string, ipAddress?: string): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto, ipAddress?: string): Promise<{
        message: string;
    }>;
    changePassword(userId: number, dto: ChangePasswordDto, currentRefreshToken?: string, ipAddress?: string): Promise<{
        message: string;
    }>;
    private generateAndSaveOtp;
    private validateOtp;
    private generateTokens;
    private hashToken;
}
