import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: {
        sub: number;
        email: string;
        role: string;
        jti: string;
    }): Promise<{
        id: number;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        fullName: string;
    }>;
}
export {};
