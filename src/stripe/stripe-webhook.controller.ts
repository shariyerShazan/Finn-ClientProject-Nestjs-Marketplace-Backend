/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// import {
//   Controller,
//   Post,
//   Headers,
//   Req,
//   BadRequestException,
//   HttpCode,
//   HttpStatus,
// } from '@nestjs/common';
// import { StripeWebhookService } from './stripe-webhook.service';
// import { ApiTags, ApiOperation } from '@nestjs/swagger';
// import express from 'express';

// @ApiTags('Stripe Webhooks')
// @Controller('webhooks/stripe')
// export class StripeWebhookController {
//   constructor(private readonly webhookService: StripeWebhookService) {}

//   @Post()
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Handle Stripe Webhook events' })
//   async handle(
//     @Req() req: express.Request,
//     @Headers('stripe-signature') signature: string,
//   ) {
//     if (!signature) {
//       throw new BadRequestException('Missing Stripe signature');
//     }

//     const rawBody = (req as any).rawBody;
//     if (!rawBody) {
//       throw new BadRequestException('Raw body missing for Stripe webhook');
//     }

//     return this.webhookService.handleWebhook(rawBody, signature);
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StripeWebhookService } from './stripe-webhook.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { type Request } from 'express';

@ApiTags('Stripe Webhooks')
@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly webhookService: StripeWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe Webhook events for Subscriptions' })
  @ApiResponse({ status: 200, description: 'Webhook received and processed' })
  async handle(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const rawBody = (req as any).rawBody;

    if (!rawBody) {
      throw new BadRequestException(
        'Raw body missing. Ensure body-parser is configured to keep raw body.',
      );
    }

    return await this.webhookService.handleWebhook(rawBody, signature);
  }
}
