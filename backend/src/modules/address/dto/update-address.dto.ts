import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  recipientName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0[3|5|7|8|9])[0-9]{8}$/, {
    message: 'Invalid Vietnamese mobile phone number (10 digits starting with 03, 05, 07, 08, 09)',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  provinceCity?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  detailedAddress?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

