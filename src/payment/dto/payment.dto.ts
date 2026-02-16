import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({
    description:
      'The source token from Stripe (e.g., tok_visa, tok_mastercard)',
    example: 'tok_visa',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'The unique UUID of the advertisement being purchased',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  adId: string;
}
