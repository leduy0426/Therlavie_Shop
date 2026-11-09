"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUsers(query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const where = {};
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
    async updateUser(adminId, targetUserId, dto, ipAddress) {
        if (adminId === targetUserId) {
            if (dto.newStatus === client_1.UserStatus.LOCKED) {
                throw new common_1.BadRequestException('Cannot modify your own administrative access: You cannot lock your own account (BR-11).');
            }
            if (dto.newRole && dto.newRole !== client_1.UserRole.ROLE_ADMIN) {
                throw new common_1.BadRequestException('Cannot modify your own administrative access: You cannot revoke your own Admin role (BR-11).');
            }
        }
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('Target user record not found.');
        }
        const oldRole = targetUser.role;
        const oldStatus = targetUser.status;
        return this.prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id: targetUserId },
                data: {
                    role: dto.newRole ?? undefined,
                    status: dto.newStatus ?? undefined,
                    failedLoginAttempts: dto.newStatus === client_1.UserStatus.ACTIVE ? 0 : undefined,
                    lockoutUntil: dto.newStatus === client_1.UserStatus.ACTIVE ? null : undefined,
                },
            });
            const isLocked = dto.newStatus === client_1.UserStatus.LOCKED;
            const isRoleChanged = dto.newRole && dto.newRole !== oldRole;
            if (isLocked || isRoleChanged) {
                await tx.refreshToken.updateMany({
                    where: { userId: targetUserId },
                    data: { isRevoked: true },
                });
            }
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map