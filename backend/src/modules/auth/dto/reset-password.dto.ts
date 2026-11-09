import { IsEmail, IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  otpCode: string;

  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number (BR-11)',
  })
  newPassword: string;

  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;
}

