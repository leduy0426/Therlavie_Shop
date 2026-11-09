import { UserRole, UserStatus } from '@prisma/client';
export declare class AdminQueryUsersDto {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    status?: UserStatus;
}
