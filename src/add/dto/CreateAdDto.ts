/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  @ApiProperty({ example: 'Modern Villa' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'A beautiful luxury villa' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: AdType, example: AdType.FIXED })
  @IsEnum(AdType)
  type: AdType;

  @ApiProperty({ example: 50000, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @ApiProperty({ enum: PropertyFor, example: PropertyFor.SALE })
  @IsEnum(PropertyFor)
  propertyFor: PropertyFor;

  @ApiProperty({ example: 23.8103, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @ApiProperty({ example: 90.4125, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @ApiProperty({ example: 'Dhaka', required: true })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 'Dhaka City', required: true })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: '1212', required: true })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({ example: 'Bangladesh', required: false })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 'category_id_here' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'sub_category_id_here' })
  @IsString()
  @IsNotEmpty()
  subCategoryId: string;

  @ApiProperty({ example: { beds: 3, baths: 2 }, required: false })
  @IsObject()
  @IsOptional()
  specifications?: any;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean) // "true" string ke true boolean korbe
  showAddress?: boolean;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  allowPhone?: boolean;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  allowEmail?: boolean;

  // Swagger-er jonno images field-ti controller-e handle kora hobe
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Upload images',
  })
  images: any[];
}

export class UpdateAddDto extends PartialType(CreateAdDto) {
  @ApiProperty({
    example: ['image_uuid_1', 'image_uuid_2'],
    required: false,
    description: 'Array of AdImage IDs to delete',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  imagesToDelete?: string[];
}
