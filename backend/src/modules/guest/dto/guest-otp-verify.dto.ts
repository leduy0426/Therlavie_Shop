import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class GuestOtpVerifyDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^(0[3|5|7|8|9])[0-9]{8}$/, {
    message: 'Invalid Vietnamese phone number format (must be 10 digits starting with 03, 05, 07, 08, 09)',
  })
  phoneNumber: string;

  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  otpCode: string;
}

