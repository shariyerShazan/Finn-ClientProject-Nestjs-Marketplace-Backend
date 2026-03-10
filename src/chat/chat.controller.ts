/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  UploadedFiles,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { SendMessageDto, StartChatDto } from './dto/chat.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { ChatGateway } from './chat.gateway';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start or get a conversation' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async startChat(
    @Req() req: any,
    @Body() dto: StartChatDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.chatService.getOrCreateConversation(
      req.user.id,
      dto.targetUserId,
      lang,
    );
  }

  @Post('message')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 1))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async sendMessage(
    @Req() req: any,
    @Body() dto: SendMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Query('lang') lang: string = 'en',
  ) {
    let fileUrl = dto.fileUrl;
    let fileType = dto.fileType;

    if (files && files.length > 0) {
      const uploadedUrls = await this.cloudinaryService.uploadImages(files);
      fileUrl = uploadedUrls[0];
      fileType = files[0].mimetype;
    }

    const result = await this.chatService.sendMessage(
      req.user.id,
      { ...dto, fileUrl, fileType },
      lang,
    );

    if (result.success) {
      this.chatGateway.sendToRoom(
        dto.conversationId,
        'message.send',
        result.message,
      );
      return result;
    }
  }

  @Get('conversations')
  async getMyConversations(@Req() req: any) {
    return await this.chatService.getMyConversations(req.user.id);
  }

  @Get('messages/:conversationId')
  async getMessages(@Req() req: any, @Param('conversationId') cid: string) {
    return await this.chatService.getMessages(cid, req.user.id);
  }

  @Patch('block/:conversationId')
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async block(
    @Req() req: any,
    @Param('conversationId') cid: string,
    @Query('lang') lang: string = 'en',
  ) {
    const result = await this.chatService.blockConversation(
      cid,
      req.user.id,
      lang,
    );
    this.chatGateway.sendToRoom(cid, 'conversation.blocked', {
      conversationId: cid,
      blockedBy: req.user.id,
    });
    return result;
  }

  @Patch('unblock/:conversationId')
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async unblock(
    @Req() req: any,
    @Param('conversationId') cid: string,
    @Query('lang') lang: string = 'en',
  ) {
    const result = await this.chatService.unblockConversation(
      cid,
      req.user.id,
      lang,
    );
    this.chatGateway.sendToRoom(cid, 'conversation.unblocked', {
      conversationId: cid,
      unblockedBy: req.user.id,
    });
    return result;
  }

  @Delete(':conversationId')
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async delete(
    @Req() req: any,
    @Param('conversationId') cid: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.chatService.deleteConversation(cid, req.user.id, lang);
  }

  @Get('online-users')
  getOnlineUsers() {
    const onlineUsers = Array.from(ChatGateway.activeUsers.keys());
    return onlineUsers.length === 0
      ? 'No user active'
      : { success: true, count: onlineUsers.length, users: onlineUsers };
  }
}
