import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
export declare class AddressController {
    private readonly addressService;
    constructor(addressService: AddressService);
    getAddresses(userId: number): Promise<{
        phoneNumber: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        recipientName: string;
        provinceCity: string;
        district: string;
        ward: string;
        detailedAddress: string;
        isDefault: boolean;
        isDeleted: boolean;
    }[]>;
    createAddress(userId: number, dto: CreateAddressDto): Promise<{
        message: string;
        address: {
            phoneNumber: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            recipientName: string;
            provinceCity: string;
            district: string;
            ward: string;
            detailedAddress: string;
            isDefault: boolean;
            isDeleted: boolean;
        };
    }>;
    updateAddress(userId: number, addressId: number, dto: UpdateAddressDto): Promise<{
        message: string;
        address: {
            phoneNumber: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            recipientName: string;
            provinceCity: string;
            district: string;
            ward: string;
            detailedAddress: string;
            isDefault: boolean;
            isDeleted: boolean;
        };
    }>;
    setDefault(userId: number, addressId: number): Promise<{
        message: string;
        address: {
            phoneNumber: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            userId: number;
            recipientName: string;
            provinceCity: string;
            district: string;
            ward: string;
            detailedAddress: string;
            isDefault: boolean;
            isDeleted: boolean;
        };
    }>;
    deleteAddress(userId: number, addressId: number): Promise<{
        message: string;
    }>;
}
