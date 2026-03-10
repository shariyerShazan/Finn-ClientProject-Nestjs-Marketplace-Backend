import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
// import { ChatModule } from 'src/chat/chat.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ChatGateway } from 'src/chat/chat.gateway';
import { TranslationService } from 'src/translation/translation.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  imports: [PrismaModule],
  providers: [
    CommentService,
    ChatGateway,
    TranslationService,
    PrismaService,
    NotificationService,
  ],
  controllers: [CommentController],
})
export class CommentModule {}
