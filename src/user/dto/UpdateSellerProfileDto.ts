import {
  IsString,
  IsUrl,
  IsInt,
  Length,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSellerProfileDto {
  @ApiPropertyOptional({ example: 'Shazan Tech Ltd' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  companyName?: string;

  @ApiPropertyOptional({ example: 'https://shazantech.com' })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid website URL' })
  companyWebSite?: string;

  @ApiPropertyOptional({ example: '123 Business Avenue' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Dhaka' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Dhaka Division' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 1212 })
  @IsOptional()
  @IsInt()
  zip?: number;

  @ApiPropertyOptional({ example: 'BD' })
  @IsOptional()
  @IsString()
  @Length(2, 2, {
    message: 'Country must be a 2-letter ISO code (e.g., BD, US)',
  })
  country?: string;
}
