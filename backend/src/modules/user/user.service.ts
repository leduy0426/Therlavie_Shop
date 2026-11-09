import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // UC-37: Fetch Profile
  async getProfile(userId: number) {
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
      throw new NotFoundException('User profile not found.');
    }

    return user;
  }

  // UC-37: Update Profile (Syncs both User and CustomerProfile entities)
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!existing) {
      throw new NotFoundException('User account not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update core User entity (fullName, phoneNumber)
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          fullName: dto.fullName !== undefined ? dto.fullName.trim() : undefined,
          phoneNumber: dto.phoneNumber !== undefined ? dto.phoneNumber.trim() : undefined,
        },
      });

      // 2. Update or upsert CustomerProfile entity
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

  // UC-37: Update Avatar Image URL
  async updateAvatar(userId: number, avatarUrl: string) {
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

  // UC-37 Alt Flow 1.1: Remove Avatar (Revert to silhouette)
  async removeAvatar(userId: number) {
    await this.prisma.customerProfile.updateMany({
      where: { userId },
      data: { avatarUrl: null },
    });

    return {
      message: 'Avatar removed. Reverted to default silhouette.',
      avatarUrl: null,
    };
  }
}

