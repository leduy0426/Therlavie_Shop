import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  // UC-38: Get all delivery addresses
  @Get()
  async getAddresses(@CurrentUser('id') userId: number) {
    return this.addressService.getAddresses(userId);
  }

  // UC-38: Add new delivery address
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAddress(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressService.createAddress(userId, dto);
  }

  // UC-38: Update existing delivery address
  @Put(':id')
  async updateAddress(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) addressId: number,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.updateAddress(userId, addressId, dto);
  }

  // UC-38 Alt Flow 1.2: Set address as default
  @Patch(':id/default')
  async setDefault(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) addressId: number,
  ) {
    return this.addressService.setDefault(userId, addressId);
  }

  // UC-38 Alt Flow 1.1: Delete address
  @Delete(':id')
  async deleteAddress(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) addressId: number,
  ) {
    return this.addressService.deleteAddress(userId, addressId);
  }
}

