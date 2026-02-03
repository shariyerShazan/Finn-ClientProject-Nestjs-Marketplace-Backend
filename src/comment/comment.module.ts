import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
// import { ChatModule } from 'src/chat/chat.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ChatGateway } from 'src/chat/chat.gateway';

@Module({
  imports: [PrismaModule],
  providers: [CommentService, ChatGateway],
  controllers: [CommentController],
})
export class CommentModule {}
