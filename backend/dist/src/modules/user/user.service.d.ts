import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: number): Promise<{
        fullName: string;
        email: string;
        phoneNumber: string;
        id: number;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        profile: {
            updatedAt: Date;
            avatarUrl: string;
            preferredFit: string;
            favoriteColor: string;
            heightCm: number;
            weightKg: number;
        };
    }>;
    updateProfile(userId: number, dto: UpdateProfileDto): Promise<{
        id: number;
        email: string;
        fullName: string;
        phoneNumber: string;
        role: import("@prisma/client").$Enums.UserRole;
        profile: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            avatarUrl: string | null;
            preferredFit: string | null;
            favoriteColor: string | null;
            heightCm: number | null;
            weightKg: number | null;
        };
        message: string;
    }>;
    updateAvatar(userId: number, avatarUrl: string): Promise<{
        message: string;
        avatarUrl: string;
    }>;
    removeAvatar(userId: number): Promise<{
        message: string;
        avatarUrl: any;
    }>;
}
