import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { AllMailService } from './all-mail.service';
import { MailController } from './mail.controller';
import { TranslationService } from 'src/translation/translation.service';

@Module({
  providers: [MailService, AllMailService, TranslationService],
  exports: [AllMailService],
  controllers: [MailController],
})
export class MailModule {}
