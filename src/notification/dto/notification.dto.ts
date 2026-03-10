import { IsString, IsEnum, IsOptional, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// নোটিফিকেশন টাইপ এনাম (আপনার প্রিজমা স্কিমা অনুযায়ী)
export enum NotificationType {
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_REPLY = 'NEW_REPLY',
  NEW_MESSAGE = 'NEW_MESSAGE',
}

export class CreateNotificationDto {
  @ApiProperty({ example: 'uuid-user-123' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'New Message' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'You have received a new message' })
  @IsString()
  message: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: 'NEW_COMMENT' | 'NEW_REPLY' | 'NEW_MESSAGE';

  @ApiPropertyOptional({ example: 'uuid-ad-123' })
  @IsOptional()
  @IsUUID()
  adId?: string;

  @ApiPropertyOptional({ example: 'uuid-conv-123' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'no', 'se', 'dk', 'is'])
  lang?: string = 'en';
}
