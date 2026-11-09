import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminQueryUsersDto } from './dto/admin-query-users.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUsers(query: AdminQueryUsersDto): Promise<{
        content: {
            fullName: string;
            email: string;
            phoneNumber: string;
            id: number;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
            emailVerifiedAt: Date;
            createdAt: Date;
            profile: {
                avatarUrl: string;
                preferredFit: string;
                favoriteColor: string;
            };
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateUser(adminId: number, targetUserId: number, dto: AdminUpdateUserDto, ipAddress?: string): Promise<{
        message: string;
        user: {
            id: number;
            email: string;
            fullName: string;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
        };
    }>;
    getAuditLogs(page?: number, limit?: number): Promise<{
        content: ({
            actor: {
                fullName: string;
                email: string;
                id: number;
                role: import("@prisma/client").$Enums.UserRole;
            };
            target: {
                fullName: string;
                email: string;
                id: number;
            };
        } & {
            id: number;
            createdAt: Date;
            ipAddress: string | null;
            targetEntity: string;
            action: string;
            oldValue: Prisma.JsonValue | null;
            newValue: Prisma.JsonValue | null;
            justificationReason: string | null;
            actorId: number | null;
            targetId: number | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
