/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { PaymentService } from 'src/payment/payment.service';
import { CreatePaymentDto } from './dto/payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe Payment Intent' })
  @ApiBody({
    type: CreatePaymentDto,
    description: 'Payment creation details containing adId and stripe token',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment intent created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Ad not found' })
  async createIntent(@Req() req: any, @Body() dto: CreatePaymentDto) {
    return await this.paymentService.createPaymentIntent(req.user.id, dto);
  }

  @Get('onboarding-link')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Stripe Onboarding link for Sellers' })
  @ApiResponse({
    status: 200,
    description: 'Returns a URL for Stripe account onboarding',
  })
  async getOnboardingLink(@Req() req: any) {
    return await this.paymentService.generateOnboardingLink(req.user.id);
  }
}
