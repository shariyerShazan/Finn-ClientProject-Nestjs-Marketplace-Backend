import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 'tok_visa' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'ad-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  adId: string;
}
