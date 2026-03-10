import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { TranslationService } from 'src/translation/translation.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [PrismaModule],
  providers: [
    UserService,
    CloudinaryService,
    TranslationService,
    PrismaService,
  ],
  controllers: [UserController],
})
export class UserModule {}
