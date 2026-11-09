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
exports.AddressService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AddressService = class AddressService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAddresses(userId) {
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
    async createAddress(userId, dto) {
        const activeAddressCount = await this.prisma.deliveryAddress.count({
            where: {
                userId,
                isDeleted: false,
            },
        });
        if (activeAddressCount >= 5) {
            throw new common_1.BadRequestException('Address limit reached. A user can store a maximum of 5 delivery addresses (BR-14).');
        }
        const isFirstAddress = activeAddressCount === 0;
        const shouldBeDefault = isFirstAddress || (dto.isDefault ?? false);
        return this.prisma.$transaction(async (tx) => {
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
    async updateAddress(userId, addressId, dto) {
        const address = await this.prisma.deliveryAddress.findFirst({
            where: { id: addressId, userId, isDeleted: false },
        });
        if (!address) {
            throw new common_1.NotFoundException('Delivery address record not found.');
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
    async setDefault(userId, addressId) {
        const address = await this.prisma.deliveryAddress.findFirst({
            where: { id: addressId, userId, isDeleted: false },
        });
        if (!address) {
            throw new common_1.NotFoundException('Delivery address not found.');
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
    async deleteAddress(userId, addressId) {
        const address = await this.prisma.deliveryAddress.findFirst({
            where: { id: addressId, userId, isDeleted: false },
        });
        if (!address) {
            throw new common_1.NotFoundException('Delivery address not found.');
        }
        const totalActive = await this.prisma.deliveryAddress.count({
            where: { userId, isDeleted: false },
        });
        if (address.isDefault && totalActive > 1) {
            throw new common_1.BadRequestException('Cannot delete default address when multiple addresses exist. Please designate another default address first.');
        }
        await this.prisma.deliveryAddress.update({
            where: { id: addressId },
            data: { isDeleted: true, isDefault: false },
        });
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
};
exports.AddressService = AddressService;
exports.AddressService = AddressService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AddressService);
//# sourceMappingURL=address.service.js.map