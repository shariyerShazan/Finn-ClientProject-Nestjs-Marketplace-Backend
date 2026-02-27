import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReportReason {
  FRAUD = 'FRAUD',
  SPAM = 'SPAM',
  INAPPROPRIATE = 'INAPPROPRIATE',
  MISLEADING = 'MISLEADING',
  OTHER = 'OTHER',
}

export class CreateReportDto {
  @ApiProperty({ enum: ReportReason, example: ReportReason.FRAUD })
  @IsEnum(ReportReason)
  @IsNotEmpty()
  reason: ReportReason;

  @ApiProperty({
    example: 'This seller is asking for money upfront.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
