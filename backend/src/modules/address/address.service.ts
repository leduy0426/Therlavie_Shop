import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  // UC-38: Get all saved addresses
  async getAddresses(userId: number) {
    return this.prisma.deliveryAddress.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // UC-38: Create new address (Enforces BR-14: Max 5 addresses)
  async createAddress(userId: number, dto: CreateAddressDto) {
    const activeAddressCount = await this.prisma.deliveryAddress.count({
      where: {
        userId,
        isDeleted: false,
      },
    });

    if (activeAddressCount >= 5) {
      throw new BadRequestException('Address limit reached. A user can store a maximum of 5 delivery addresses (BR-14).');
    }

    const isFirstAddress = activeAddressCount === 0;
    const shouldBeDefault = isFirstAddress || (dto.isDefault ?? false);

    return this.prisma.$transaction(async (tx) => {
      // Clear default flag on existing addresses if new one is set as default
      if (shouldBeDefault) {
        await tx.deliveryAddress.updateMany({
          where: { userId, isDeleted: false },
          data: { isDefault: false },
        });
      }

      const address = await tx.deliveryAddress.create({
        data: {
          userId,
          recipientName: dto.recipientName.trim(),
          phoneNumber: dto.phoneNumber.trim(),
          provinceCity: dto.provinceCity.trim(),
          district: dto.district.trim(),
          ward: dto.ward.trim(),
          detailedAddress: dto.detailedAddress.trim(),
          isDefault: shouldBeDefault,
        },
      });

      return {
        message: 'Delivery address saved successfully.',
        address,
      };
    });
  }

  // UC-38: Update existing address
  async updateAddress(userId: number, addressId: number, dto: UpdateAddressDto) {
    const address = await this.prisma.deliveryAddress.findFirst({
      where: { id: addressId, userId, isDeleted: false },
    });

    if (!address) {
      throw new NotFoundException('Delivery address record not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.deliveryAddress.updateMany({
          where: { userId, isDeleted: false, id: { not: addressId } },
          data: { isDefault: false },
        });
      }

      const updated = await tx.deliveryAddress.update({
        where: { id: addressId },
        data: {
          recipientName: dto.recipientName?.trim(),
          phoneNumber: dto.phoneNumber?.trim(),
          provinceCity: dto.provinceCity?.trim(),
          district: dto.district?.trim(),
          ward: dto.ward?.trim(),
          detailedAddress: dto.detailedAddress?.trim(),
          isDefault: dto.isDefault !== undefined ? dto.isDefault : undefined,
        },
      });

      return {
        message: 'Delivery address updated successfully.',
        address: updated,
      };
    });
  }

  // UC-38 Alt Flow 1.2: Set address as default
  async setDefault(userId: number, addressId: number) {
    const address = await this.prisma.deliveryAddress.findFirst({
      where: { id: addressId, userId, isDeleted: false },
    });

    if (!address) {
      throw new NotFoundException('Delivery address not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.deliveryAddress.updateMany({
        where: { userId, isDeleted: false },
        data: { isDefault: false },
      });

      const updated = await tx.deliveryAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });

      return {
        message: 'Default address updated.',
        address: updated,
      };
    });
  }

  // UC-38 Alt Flow 1.1: Soft Delete address
  async deleteAddress(userId: number, addressId: number) {
    const address = await this.prisma.deliveryAddress.findFirst({
      where: { id: addressId, userId, isDeleted: false },
    });

    if (!address) {
      throw new NotFoundException('Delivery address not found.');
    }

    const totalActive = await this.prisma.deliveryAddress.count({
      where: { userId, isDeleted: false },
    });

    // Exception 1.0.E3: Trying to delete default address when multiple exist
    if (address.isDefault && totalActive > 1) {
      throw new BadRequestException('Cannot delete default address when multiple addresses exist. Please designate another default address first.');
    }

    // In a full system, verify if this address is tied to an active transit order (READY_TO_SHIP, DELIVERING)

    await this.prisma.deliveryAddress.update({
      where: { id: addressId },
      data: { isDeleted: true, isDefault: false },
    });

    // If we deleted the only address, or deleted default when only 1 remained, handle gracefully
    if (totalActive > 1 && address.isDefault) {
      const remaining = await this.prisma.deliveryAddress.findFirst({
        where: { userId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
      });
      if (remaining) {
        await this.prisma.deliveryAddress.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Address removed successfully.' };
  }
}

