import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { GuestOtpRequestDto } from './dto/guest-otp-request.dto';
import { GuestOtpVerifyDto } from './dto/guest-otp-verify.dto';
import { GuestService } from './guest.service';

@Controller('api/v1/guest/checkout-otp')
export class GuestController {
  constructor(private readonly guestService: GuestService) {}

  // UC-39: Request SMS OTP
  @Public()
  @Post('request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: GuestOtpRequestDto) {
    return this.guestService.requestCheckoutOtp(dto);
  }

  // UC-39: Verify SMS OTP
  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: GuestOtpVerifyDto) {
    return this.guestService.verifyCheckoutOtp(dto);
  }
}

