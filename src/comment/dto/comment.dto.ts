import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'ad-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  adId: string;

  @ApiProperty({ example: 'This is a great property!' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: 'parent-comment-uuid', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated message content' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
