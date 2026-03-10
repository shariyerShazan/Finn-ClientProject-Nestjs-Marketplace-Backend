import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatGateway } from 'src/chat/chat.gateway';
import { TranslationService } from 'src/translation/translation.service';

@Module({
  providers: [
    NotificationService,
    PrismaService,
    ChatGateway,
    TranslationService,
  ],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
