import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TranslationService } from 'src/translation/translation.service';

@Module({
  providers: [SubscriptionService, PrismaService, TranslationService],
  controllers: [SubscriptionController],
})
export class SubscriptionModule {}
