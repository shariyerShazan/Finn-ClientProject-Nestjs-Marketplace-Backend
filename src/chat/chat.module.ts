import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ChatGateway } from './chat.gateway';
import { TranslationService } from 'src/translation/translation.service';

@Module({
  imports: [CloudinaryModule],
  providers: [
    ChatService,
    CloudinaryService,
    PrismaService,
    ChatGateway,
    TranslationService,
  ],
  controllers: [ChatController],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
