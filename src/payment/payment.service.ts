/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  // ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? 10);

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  async createPaymentIntent(
    userId: string,
    dto: { adId: string; token: string },
  ) {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: { id: dto.adId },
        include: {
          seller: {
            include: { sellerProfile: true },
          },
        },
      });

      if (!ad) throw new NotFoundException('Ad not found');
      if (ad.isSold) throw new BadRequestException('Ad already sold');

      const sellerProfile = ad.seller.sellerProfile;
      if (!sellerProfile?.stripeAccountId) {
        throw new BadRequestException('Seller bank account not connected');
      }

      const totalAmount = ad.price ?? ad.releasePrice;
      if (!totalAmount) throw new BadRequestException('Invalid price');

      const amountInCents = Math.round(totalAmount * 100);
      const adminFeeInCents = Math.round(
        amountInCents * (PLATFORM_FEE_PERCENT / 100),
      );

      const intent = await this.stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: 'usd',
          payment_method_data: {
            type: 'card',
            card: { token: dto.token },
          } as any,
          confirm: true,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
          application_fee_amount: adminFeeInCents,
          transfer_data: {
            destination: sellerProfile.stripeAccountId,
          },
          on_behalf_of: sellerProfile.stripeAccountId,
          metadata: {
            adId: ad.id,
            buyerId: userId,
            totalAmount: totalAmount.toString(),
          },
        },
        {
          idempotencyKey: `pay_${ad.id}_${userId}_${Date.now()}`,
        },
      );

      return {
        success: true,
        status: intent.status,
        transactionId: intent.id,
        amount: totalAmount,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(error.message);
      }

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      console.error('Payment Error:', error);
      throw new InternalServerErrorException('Payment processing failed');
    }
  }

  async generateOnboardingLink(userId: string) {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: userId },
        include: { sellerProfile: true },
      });

      if (!user?.sellerProfile?.stripeAccountId) {
        throw new BadRequestException('Stripe account not found');
      }

      const accountLink = await this.stripe.accountLinks.create({
        account: user.sellerProfile.stripeAccountId,
        refresh_url: `${process.env.FRONTEND_URL}/seller/onboarding-retry`,
        return_url: `${process.env.FRONTEND_URL}/seller/onboarding-success`,
        type: 'account_onboarding',
      });

      return { url: accountLink.url };
    } catch (error) {
      console.error('Generate onboarding failed:', error);
      throw error;
    }
  }
}
