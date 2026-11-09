import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  otpCode: string;

  // Optional guest session to support cart merging (UC-32 step 9.0)
  @IsOptional()
  @IsString()
  guestSessionId?: string;
}

