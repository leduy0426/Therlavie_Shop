import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be ROLE_CUSTOMER, ROLE_STAFF, or ROLE_ADMIN' })
  newRole?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status must be PENDING_VERIFICATION, ACTIVE, or LOCKED' })
  newStatus?: UserStatus;

  @IsOptional()
  @IsString()
  justificationReason?: string;
}

