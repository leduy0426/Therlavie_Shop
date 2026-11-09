import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
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
    uploadAvatar(userId: number, file: MulterFile): Promise<{
        message: string;
        avatarUrl: string;
    }>;
    removeAvatar(userId: number): Promise<{
        message: string;
        avatarUrl: any;
    }>;
}
export {};
