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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let UserService = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                phoneNumber: true,
                role: true,
                status: true,
                createdAt: true,
                profile: {
                    select: {
                        avatarUrl: true,
                        preferredFit: true,
                        favoriteColor: true,
                        heightCm: true,
                        weightKg: true,
                        updatedAt: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User profile not found.');
        }
        return user;
    }
    async updateProfile(userId, dto) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        if (!existing) {
            throw new common_1.NotFoundException('User account not found.');
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    fullName: dto.fullName !== undefined ? dto.fullName.trim() : undefined,
                    phoneNumber: dto.phoneNumber !== undefined ? dto.phoneNumber.trim() : undefined,
                },
            });
            const updatedProfile = await tx.customerProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    preferredFit: dto.preferredFit,
                    favoriteColor: dto.favoriteColor,
                    heightCm: dto.heightCm,
                    weightKg: dto.weightKg,
                },
                update: {
                    preferredFit: dto.preferredFit !== undefined ? dto.preferredFit : undefined,
                    favoriteColor: dto.favoriteColor !== undefined ? dto.favoriteColor : undefined,
                    heightCm: dto.heightCm !== undefined ? dto.heightCm : undefined,
                    weightKg: dto.weightKg !== undefined ? dto.weightKg : undefined,
                },
            });
            return {
                id: updatedUser.id,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                phoneNumber: updatedUser.phoneNumber,
                role: updatedUser.role,
                profile: updatedProfile,
                message: 'Profile updated successfully.',
            };
        });
    }
    async updateAvatar(userId, avatarUrl) {
        await this.prisma.customerProfile.upsert({
            where: { userId },
            create: { userId, avatarUrl },
            update: { avatarUrl },
        });
        return {
            message: 'Avatar uploaded and updated successfully.',
            avatarUrl,
        };
    }
    async removeAvatar(userId) {
        await this.prisma.customerProfile.updateMany({
            where: { userId },
            data: { avatarUrl: null },
        });
        return {
            message: 'Avatar removed. Reverted to default silhouette.',
            avatarUrl: null,
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map