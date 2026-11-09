import { IsNumber, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Full name must have at least 2 characters' })
  @MaxLength(150, { message: 'Full name must not exceed 150 characters' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0[3|5|7|8|9])[0-9]{8}$/, {
    message: 'Invalid Vietnamese phone number format (must be 10 digits starting with 03, 05, 07, 08, 09)',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  preferredFit?: string; // Oversize, Regular, Slim-fit

  @IsOptional()
  @IsString()
  favoriteColor?: string; // Pastel, Earth-tone, Vibrant, Monochrome

  @IsOptional()
  @IsNumber()
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  weightKg?: number;
}

