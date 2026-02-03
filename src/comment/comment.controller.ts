/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Patch,
  Delete,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

@ApiConsumes('multipart/form-data')
@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Create a new comment or reply to an Ad' })
  async createComment(@Req() req: any, @Body() dto: CreateCommentDto) {
    return await this.commentService.createComment(req.user.id, dto);
  }

  @Get('ad/:adId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all comments and nested replies' })
  async getCommentsByAd(@Param('adId') adId: string) {
    return await this.commentService.getCommentsByAd(adId);
  }

  @Patch(':commentId')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Update an existing comment' })
  async updateComment(
    @Req() req: any,
    @Param('commentId') id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return await this.commentService.updateComment(req.user.id, id, dto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(@Req() req: any, @Param('commentId') id: string) {
    return await this.commentService.deleteComment(req.user.id, id);
  }
}
