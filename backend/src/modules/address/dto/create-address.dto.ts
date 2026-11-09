import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsNotEmpty({ message: 'Recipient name is required' })
  @IsString()
  @MaxLength(150)
  recipientName: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^(0[3|5|7|8|9])[0-9]{8}$/, {
    message: 'Invalid Vietnamese mobile phone number (10 digits starting with 03, 05, 07, 08, 09)',
  })
  phoneNumber: string;

  @IsNotEmpty({ message: 'Province/City is required' })
  @IsString()
  provinceCity: string;

  @IsNotEmpty({ message: 'District is required' })
  @IsString()
  district: string;

  @IsNotEmpty({ message: 'Ward is required' })
  @IsString()
  ward: string;

  @IsNotEmpty({ message: 'Detailed address is required' })
  @IsString()
  @MaxLength(255)
  detailedAddress: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

