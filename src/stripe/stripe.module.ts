// src/stripe/stripe.module.ts
import { Module } from '@nestjs/common';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';
import { PrismaModule } from '../prisma/prisma.module';
// import { PaymentModule } from '../payment/payment.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentService } from 'src/payment/payment.service';
import { TranslationService } from 'src/translation/translation.service';

@Module({
  imports: [PrismaModule],
  controllers: [StripeWebhookController],
  providers: [
    StripeWebhookService,
    PrismaService,
    PaymentService,
    TranslationService,
  ],
})
export class StripeModule {}
