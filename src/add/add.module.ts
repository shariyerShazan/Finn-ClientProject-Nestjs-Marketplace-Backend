import { Module } from '@nestjs/common';
// import { AddService } from './add.service';
import { AddController } from './add.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
// import { PrismaService } from 'src/prisma/prisma.service';
import { AddService } from './add.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TranslationService } from 'src/translation/translation.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [CloudinaryModule, PrismaModule],
  providers: [AddService, TranslationService, PrismaService],
  controllers: [AddController],
})
export class AddModule {}
