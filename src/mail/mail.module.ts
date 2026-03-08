import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { AllMailService } from './all-mail.service';
import { MailController } from './mail.controller';

@Module({
  providers: [MailService, AllMailService],
  exports: [AllMailService],
  controllers: [MailController],
})
export class MailModule {}
