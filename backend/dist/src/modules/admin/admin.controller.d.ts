import { AdminService } from './admin.service';
import { AdminQueryUsersDto } from './dto/admin-query-users.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
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
    updateUser(adminId: number, targetUserId: number, dto: AdminUpdateUserDto, ip: string): Promise<{
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
            oldValue: import("@prisma/client/runtime/library").JsonValue | null;
            newValue: import("@prisma/client/runtime/library").JsonValue | null;
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
