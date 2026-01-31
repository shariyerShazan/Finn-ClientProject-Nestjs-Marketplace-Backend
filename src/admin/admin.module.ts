import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MailModule } from 'src/mail/mail.module';
// import { AllMailService } from 'src/mail/all-mail.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [MailModule],
  providers: [AdminService, PrismaService],
  controllers: [AdminController],
})
export class AdminModule {}
