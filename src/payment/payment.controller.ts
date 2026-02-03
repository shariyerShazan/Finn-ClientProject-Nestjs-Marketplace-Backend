/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from 'src/payment/payment.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe Payment Intent' })
  async createIntent(@Req() req: any, @Body() dto: { adId: string }) {
    return await this.paymentService.createPaymentIntent(req.user.id, dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe Webhook for payment confirmation' })
  async webhook(@Req() req: any, @Headers('stripe-signature') sig: string) {
    if (!sig) throw new BadRequestException('Missing stripe-signature');
    return await this.paymentService.handleWebhook(req.rawBody, sig);
  }
}
