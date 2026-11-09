import { UserRole, UserStatus } from '@prisma/client';
export declare class AdminUpdateUserDto {
    newRole?: UserRole;
    newStatus?: UserStatus;
    justificationReason?: string;
}
