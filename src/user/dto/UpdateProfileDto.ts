/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { RegisterDto } from 'src/auth/dto/auth.register-dto';
import { UpdateSellerProfileDto } from './UpdateSellerProfileDto';

export class UpdateProfileDto extends PartialType(
  OmitType(RegisterDto, ['email', 'role'] as const),
) {
  @ApiPropertyOptional({ type: UpdateSellerProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSellerProfileDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    }
    return value;
  })
  sellerData?: UpdateSellerProfileDto;
}
