import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsInt,
  MinLength,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSellerProfileDto {
  @ApiProperty({ example: 'Shazan Tech Ltd' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  companyName: string;

  @ApiProperty({ example: 'https://shazantech.com' })
  @IsUrl({}, { message: 'Invalid website URL' })
  @IsNotEmpty()
  companyWebSite: string;

  @ApiProperty({ example: '123 Business Avenue' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Dhaka Division' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 1212 })
  @IsInt()
  @IsNotEmpty()
  zip: number;

  @ApiProperty({ example: 'US' }) // Example change kore BD den
  @IsString()
  @IsNotEmpty()
  @Length(2, 2, {
    message: 'Country must be a 2-letter ISO code (e.g., BD, US)',
  })
  country: string;
}
