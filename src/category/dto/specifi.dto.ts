import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  BOOLEAN = 'boolean',
  TEXTAREA = 'textarea',
}

export class SpecFieldDto {
  @ApiProperty({ example: 'RAM' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'ram' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ enum: FieldType, example: 'select' })
  @IsEnum(FieldType)
  type: FieldType;

  @ApiProperty({ example: true })
  @IsBoolean()
  required: boolean;

  @ApiProperty({ example: ['8GB', '16GB'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}
