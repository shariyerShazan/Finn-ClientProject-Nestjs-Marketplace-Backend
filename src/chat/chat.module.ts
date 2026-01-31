import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [CloudinaryModule],
  providers: [ChatService, CloudinaryService, PrismaService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
