import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminQueryUsersDto } from './dto/admin-query-users.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // UC-40: Paginated & Filtered User List
  async getUsers(query: AdminQueryUsersDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          role: true,
          status: true,
          createdAt: true,
          emailVerifiedAt: true,
          profile: {
            select: {
              avatarUrl: true,
              preferredFit: true,
              favoriteColor: true,
            },
          },
        },
      }),
    ]);

    return {
      content: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // UC-40: Modify Role or Toggle Status (Lock / Unlock)
  async updateUser(
    adminId: number,
    targetUserId: number,
    dto: AdminUpdateUserDto,
    ipAddress?: string,
  ) {
    // 1. Safety Rule: Administrator cannot lock their own account or revoke their own Admin privileges (BR-11 / Safety Policy)
    if (adminId === targetUserId) {
      if (dto.newStatus === UserStatus.LOCKED) {
        throw new BadRequestException('Cannot modify your own administrative access: You cannot lock your own account (BR-11).');
      }
      if (dto.newRole && dto.newRole !== UserRole.ROLE_ADMIN) {
        throw new BadRequestException('Cannot modify your own administrative access: You cannot revoke your own Admin role (BR-11).');
      }
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user record not found.');
    }

    const oldRole = targetUser.role;
    const oldStatus = targetUser.status;

    return this.prisma.$transaction(async (tx) => {
      // 2. Update Role / Status
      const updatedUser = await tx.user.update({
        where: { id: targetUserId },
        data: {
          role: dto.newRole ?? undefined,
          status: dto.newStatus ?? undefined,
          // Reset lockout timer if unlocked
          failedLoginAttempts: dto.newStatus === UserStatus.ACTIVE ? 0 : undefined,
          lockoutUntil: dto.newStatus === UserStatus.ACTIVE ? null : undefined,
        },
      });

      // 3. Invalidate active sessions if user was locked or role changed
      const isLocked = dto.newStatus === UserStatus.LOCKED;
      const isRoleChanged = dto.newRole && dto.newRole !== oldRole;

      if (isLocked || isRoleChanged) {
        await tx.refreshToken.updateMany({
          where: { userId: targetUserId },
          data: { isRevoked: true },
        });
      }

      // 4. Record Immutable Audit Log (NFR-11)
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          targetEntity: 'USER',
          targetId: targetUserId,
          action: isLocked ? 'ADMIN_LOCK_USER' : isRoleChanged ? 'ADMIN_CHANGE_ROLE' : 'ADMIN_UPDATE_USER',
          oldValue: { role: oldRole, status: oldStatus },
          newValue: { role: updatedUser.role, status: updatedUser.status },
          justificationReason: dto.justificationReason || 'Administrative update',
          ipAddress: ipAddress || '127.0.0.1',
        },
      });

      return {
        message: 'User updated successfully and audit log recorded.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          status: updatedUser.status,
        },
      };
    });
  }

  // UC-40: Get Audit Logs History
  async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, email: true, fullName: true, role: true } },
          target: { select: { id: true, email: true, fullName: true } },
        },
      }),
    ]);

    return {
      content: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

