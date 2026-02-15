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
  IsBoolean,
} from 'class-validator';
import { AdType, PropertyFor } from 'prisma/generated/prisma/enums';

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

  // ---------------- LOCATION ----------------

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

  // ---------------- CATEGORY ----------------

  @ApiProperty({ example: 'cat-uuid-here' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'subcat-uuid-here' })
  @IsString()
  subCategoryId: string;

  // ---------------- SPECIFICATIONS ----------------

  @ApiPropertyOptional({
    example: { brand: 'Apple', processor: 'M2' },
    description: 'Object or JSON string',
  })
  @IsOptional()
  @IsObject()
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
  specifications?: Record<string, any>;

  // ---------------- PRIVACY FLAGS ----------------

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  showAddress?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  allowPhone?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  allowEmail?: boolean;

  // ---------------- IMAGES ----------------

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    isArray: true,
    description: 'Upload multiple images',
  })
  @IsOptional()
  images?: Express.Multer.File[];
}

export class UpdateAddDto extends PartialType(CreateAdDto) {
  @ApiPropertyOptional({
    example: ['img-id-1', 'img-id-2'],
    description: 'Image IDs to delete',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  imagesToDelete?: string[];
}
