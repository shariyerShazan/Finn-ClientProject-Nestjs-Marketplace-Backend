/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
  UploadedFiles,
  Patch,
  Delete,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
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

  @ApiConsumes('multipart/form-data')
  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start or get a conversation with a Seller' })
  async startChat(@Req() req: any, @Body() dto: StartChatDto) {
    return await this.chatService.getOrCreateConversation(
      req.user.id,
      dto.targetUserId,
    );
  }

  @Post('message')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 1))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message (Text + Optional Image)' })
  async sendMessage(
    @Req() req: any,
    @Body() dto: SendMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    let fileUrl = dto.fileUrl;
    let fileType = dto.fileType;

    if (files && files.length > 0) {
      const uploadedUrls = await this.cloudinaryService.uploadImages(files);
      fileUrl = uploadedUrls[0];
      fileType = files[0].mimetype;
    }

    const result = await this.chatService.sendMessage(req.user.id, {
      ...dto,
      fileUrl,
      fileType,
    });

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
  @ApiOperation({ summary: 'Get list of all my conversations' })
  async getMyConversations(@Req() req: any) {
    return await this.chatService.getMyConversations(req.user.id);
  }

  @Get('messages/:conversationId')
  @ApiOperation({ summary: 'Get message history for a conversation' })
  async getMessages(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    return await this.chatService.getMessages(conversationId, req.user.id);
  }

  @ApiConsumes('multipart/form-data')
  @Patch('block/:conversationId')
  async block(@Req() req: any, @Param('conversationId') cid: string) {
    const result = await this.chatService.blockConversation(cid, req.user.id);
    this.chatGateway.sendToRoom(cid, 'conversation.blocked', {
      conversationId: cid,
      blockedBy: req.user.id,
    });
    return result;
  }

  @ApiConsumes('multipart/form-data')
  @Patch('unblock/:conversationId')
  @ApiOperation({ summary: 'Unblock a chat' })
  async unblock(@Req() req: any, @Param('conversationId') cid: string) {
    const result = await this.chatService.unblockConversation(cid, req.user.id);
    this.chatGateway.sendToRoom(cid, 'conversation.unblocked', {
      conversationId: cid,
      blockedBy: req.user.id,
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':conversationId')
  @ApiOperation({ summary: 'Delete chat history forever' })
  async delete(@Req() req: any, @Param('conversationId') cid: string) {
    return await this.chatService.deleteConversation(cid, req.user.id);
  }

  @Get('online-users')
  @ApiOperation({ summary: 'Get all online user IDs' })
  getOnlineUsers() {
    const onlineUsers = Array.from(
      ChatGateway.activeUsers.keys() as IterableIterator<string>,
    );
    if (onlineUsers.length === 0) {
      return 'No user active';
    }
    return {
      success: true,
      count: onlineUsers.length,
      users: onlineUsers,
    };
  }
}
