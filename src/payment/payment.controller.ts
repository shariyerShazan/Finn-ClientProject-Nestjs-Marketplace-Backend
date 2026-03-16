/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import {
//   Body,
//   Controller,
//   Post,
//   UseGuards,
//   Req,
//   HttpCode,
//   HttpStatus,
//   Get,
// } from '@nestjs/common';

// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiBearerAuth,
//   ApiBody,
//   ApiResponse,
// } from '@nestjs/swagger';
// import { PaymentService } from 'src/payment/payment.service';
// import { CreatePaymentDto } from './dto/payment.dto';

// @ApiTags('Payments')
// @ApiBearerAuth()
// @Controller('payments')
// export class PaymentController {
//   constructor(private readonly paymentService: PaymentService) {}

//   @Post('create-intent')
//   @UseGuards(JwtAuthGuard)
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Create Stripe Payment Intent' })
//   @ApiBody({
//     type: CreatePaymentDto,
//     description: 'Payment creation details containing adId and stripe token',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Payment intent created successfully',
//   })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiResponse({ status: 404, description: 'Ad not found' })
//   async createIntent(@Req() req: any, @Body() dto: CreatePaymentDto) {
//     return await this.paymentService.createPaymentIntent(req.user.id, dto);
//   }

//   @Get('onboarding-link')
//   @UseGuards(JwtAuthGuard)
//   @ApiOperation({ summary: 'Get Stripe Onboarding link for Sellers' })
//   @ApiResponse({
//     status: 200,
//     description: 'Returns a URL for Stripe account onboarding',
//   })
//   async getOnboardingLink(@Req() req: any) {
//     return await this.paymentService.generateOnboardingLink(req.user.id);
//   }
// }

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'prisma/generated/prisma/enums';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-checkout-session')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create Stripe Checkout Session for Subscription' })
  async createCheckout(@Req() req: any, @Body('planId') planId: string) {
    const userId = req.user.id;
    return await this.paymentService.createCheckoutSession(userId, planId);
  }

  @Post('create-boost-session')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create Stripe Checkout Session for Ad Boost' })
  async createBoostCheckout(
    @Req() req: any,
    @Body() dto: { adId: string; packageId: string },
  ) {
    return await this.paymentService.createBoostCheckoutSession(
      req.user.id,
      dto.adId,
      dto.packageId,
    );
  }

  @Get('boost-history')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get personal boost history (Seller)' })
  async getMyBoosts(@Req() req: any) {
    return await this.paymentService.getUserBoostHistory(req.user.id);
  }

  // --- Admin History ---
  @Get('all-boost-history')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Get all boost history (Admin Only)' })
  async getAllBoosts() {
    return await this.paymentService.getAllBoostHistory();
  }

  @Get('all-sub-history')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Get all payment history (Admin Only)' })
  async getAll() {
    return await this.paymentService.getAllSubscriptions();
  }

  @Get('sub-history/:id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOperation({ summary: 'Get single payment details' })
  async getOne(@Param('id') id: string) {
    return await this.paymentService.getSingleSubscription(id);
  }
}
