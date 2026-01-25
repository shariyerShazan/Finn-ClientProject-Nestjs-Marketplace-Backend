import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { RegisterDto } from './auth.register-dto';
import {
  IsOptional,
  IsString,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateSellerProfileDto } from './UpdateSellerProfileDto';

export class UpdateProfileDto extends PartialType(
  OmitType(RegisterDto, ['email', 'role'] as const),
) {
  @ApiProperty({ example: 'https://image.com/profile.jpg', required: false })
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @ApiProperty({ type: UpdateSellerProfileDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateSellerProfileDto)
  sellerData?: UpdateSellerProfileDto;
}
