import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  fullName: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number (BR-11)',
  })
  password: string;

  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;

  @IsOptional()
  @IsString()
  @Matches(/^0\d{9}$/, { message: 'Phone number must be a 10-digit Vietnamese number starting with 0' })
  phoneNumber?: string;
}

