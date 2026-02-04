import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { SpecFieldDto } from './specifi.dto';
import { Type } from 'class-transformer';

// --- Category DTOs ---
export class CreateCategoryDto {
  @ApiProperty({ example: 'Vehicles' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'vehicles' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase and hyphenated' })
  slug: string;

  @ApiProperty({ example: 'https://cdn.com/icon.png', required: false })
  @IsString()
  @IsOptional()
  image?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

// --- Sub-Category DTOs ---

export class CreateSubCategoryDto {
  @ApiProperty({ example: 'Cars' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'vehicles-cars' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'category-uuid-here' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    type: [SpecFieldDto],
    description: 'List of dynamic specification fields',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecFieldDto)
  specFields?: SpecFieldDto[];
}

export class UpdateSubCategoryDto extends PartialType(CreateSubCategoryDto) {}
