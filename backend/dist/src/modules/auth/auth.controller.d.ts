import { Request, Response } from 'express';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        message: string;
        email: string;
    }>;
    verifyEmail(dto: VerifyEmailDto, ip: string, res: Response): Promise<{
        message: string;
        accessToken: string;
        user: any;
    }>;
    login(dto: LoginDto, ip: string, res: Response): Promise<{
        message: string;
        accessToken: string;
        user: any;
        redirectPath: string;
    }>;
    logout(user: CurrentUserData, req: Request, res: Response, ip: string): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto, ip: string): Promise<{
        message: string;
    }>;
    changePassword(userId: number, dto: ChangePasswordDto, req: Request, ip: string): Promise<{
        message: string;
    }>;
}
