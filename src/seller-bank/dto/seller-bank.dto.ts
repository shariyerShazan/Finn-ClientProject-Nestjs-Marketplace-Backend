import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSellerBankDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  accountHolder: string;

  @ApiProperty({ example: 'JPMorgan Chase', required: false })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: '987654321', required: false })
  @IsString()
  @IsOptional()
  routingNumber?: string;
}
