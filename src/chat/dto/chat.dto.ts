import { IsString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartChatDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  targetUserId: string;
}
export class SendMessageDto {
  @ApiProperty({ example: 'conv-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({ example: 'Check this image!', required: false })
  @IsString()
  @IsOptional()
  text?: string;

  // --- SWAGGER FILE UPLOAD SECTION ---
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Only 1 image file allowed',
    required: false,
  })
  @IsOptional()
  images?: any;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileType?: string;
}
