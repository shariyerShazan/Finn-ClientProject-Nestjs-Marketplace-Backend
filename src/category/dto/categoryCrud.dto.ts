import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

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
}

export class UpdateSubCategoryDto extends PartialType(CreateSubCategoryDto) {}
