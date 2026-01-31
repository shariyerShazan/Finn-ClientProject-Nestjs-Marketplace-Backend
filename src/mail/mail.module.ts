import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { AllMailService } from './all-mail.service';

@Module({
  providers: [MailService, AllMailService],
  exports: [AllMailService],
})
export class MailModule {}
