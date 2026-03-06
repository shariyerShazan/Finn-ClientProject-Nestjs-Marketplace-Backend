/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsObject,
  IsArray,
  // IsBoolean,
} from 'class-validator';
import { AdType, PropertyFor } from 'prisma/generated/prisma/enums';

// ✅ Boolean parser helper (DTO এর বাইরে রাখতে হবে)
// const toBoolean = (value: any): boolean => {
//   if (value === true || value === 'true' || value === 1 || value === '1') {
//     return true;
//   }

//   if (value === false || value === 'false' || value === 0 || value === '0') {
//     return false;
//   }

//   return false;
// };

export class CreateAdDto {
  @ApiProperty({ example: 'MacBook Pro M2' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Brand new condition with 16GB RAM' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: AdType, example: AdType.FIXED })
  @IsEnum(AdType)
  type: AdType;

  @ApiProperty({ example: 120000 })
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiProperty({ enum: PropertyFor, example: PropertyFor.SALE })
  @IsEnum(PropertyFor)
  propertyFor: PropertyFor;

  @ApiPropertyOptional({ example: 23.7757 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 90.4013 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 'Gulshan' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: '1212' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ example: 'Bangladesh' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 'cat-uuid-here' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'subcat-uuid-here' })
  @IsString()
  subCategoryId: string;

  @ApiPropertyOptional({
    example: { brand: 'Apple', processor: 'M2' },
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return value;
  })
  @IsObject()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  showAddress?: string; // string হিসেবে নিলাম

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  allowPhone?: string; // string হিসেবে নিলাম

  @ApiPropertyOptional({ example: 'false' })
  @IsOptional()
  @IsString()
  allowEmail?: string; // string হিসেবে নিলাম

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  @IsOptional()
  images?: Express.Multer.File[];
}

export class UpdateAddDto extends PartialType(CreateAdDto) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  imagesToDelete?: string[];
}
