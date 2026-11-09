import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class GuestOtpRequestDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^(0[3|5|7|8|9])[0-9]{8}$/, {
    message: 'Invalid Vietnamese phone number format (must be 10 digits starting with 03, 05, 07, 08, 09)',
  })
  phoneNumber: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;
}

