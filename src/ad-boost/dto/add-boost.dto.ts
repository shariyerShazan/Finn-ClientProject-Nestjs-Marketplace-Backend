/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BoostType } from 'prisma/generated/prisma/enums';

// 1. DTO for Admin to create the Package template
export class CreateBoostPackageDto {
  @ApiProperty({
    example: 'Home Page Feature',
    description: 'The name of the boost package',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Your ad will appear at the top for 7 days',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 49.99, description: 'Price in USD' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 7,
    description: 'Number of days the boost remains active',
  })
  @IsNumber()
  @Min(1)
  durationDays: number;

  @ApiProperty({ enum: BoostType, example: BoostType.PREMIUM })
  @IsEnum(BoostType)
  type: BoostType;
}

// 2. DTO for Seller to apply a package to their Ad
export class ApplyBoostDto {
  @ApiProperty({
    example: 'ad-uuid-here',
    description: 'The ID of the ad to be boosted',
  })
  @IsUUID()
  adId: string;

  @ApiProperty({
    example: 'package-uuid-here',
    description: 'The ID of the package being purchased',
  })
  @IsUUID()
  packageId: string;
}

// 3. Update DTO for Admin
export class UpdateBoostPackageDto extends PartialType(CreateBoostPackageDto) {}
