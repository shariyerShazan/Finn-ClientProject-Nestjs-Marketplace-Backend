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
  Query,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

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
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async createComment(
    @Req() req: any,
    @Body() dto: CreateCommentDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.commentService.createComment(req.user.id, dto, lang);
  }

  @Get('ad/:adId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all comments and nested replies' })
  async getCommentsByAd(@Param('adId') adId: string) {
    // সাধারণত লিস্ট দেখার সময় ট্রান্সলেশন লাগে না কারণ মেসেজ ইউজার জেনারেটেড
    return await this.commentService.getCommentsByAd(adId);
  }

  @Patch(':commentId')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Update an existing comment' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async updateComment(
    @Req() req: any,
    @Param('commentId') id: string,
    @Body() dto: UpdateCommentDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.commentService.updateComment(req.user.id, id, dto, lang);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async deleteComment(
    @Req() req: any,
    @Param('commentId') id: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.commentService.deleteComment(req.user.id, id, lang);
  }
}
