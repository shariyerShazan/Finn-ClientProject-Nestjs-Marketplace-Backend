/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
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

  async createPaymentIntent(userId: string, dto: { adId: string }) {
    try {
      const user = await this.prisma.auth.findUnique({ where: { id: userId } });
      if (!user || user.isSuspended) {
        throw new ForbiddenException('User is suspended or not found');
      }

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
        throw new BadRequestException(
          'Seller bank account not connected via Stripe',
        );
      }

      const account = await this.stripe.accounts.retrieve(
        sellerProfile.stripeAccountId,
      );

      if (!account.charges_enabled || !account.payouts_enabled) {
        throw new BadRequestException(
          'Seller Stripe onboarding is not completed',
        );
      }

      const totalAmount = ad.price ?? ad.releasePrice;
      if (!totalAmount || totalAmount <= 0) {
        throw new BadRequestException('Invalid ad price');
      }

      const amountInCents = Math.round(totalAmount * 100);
      const adminFeeInCents = Math.round(
        amountInCents * (PLATFORM_FEE_PERCENT / 100),
      );

      const intent = await this.stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: 'usd',
          application_fee_amount: adminFeeInCents,
          transfer_data: {
            destination: sellerProfile.stripeAccountId,
          },
          metadata: {
            adId: ad.id,
            buyerId: userId,
            totalAmount: totalAmount.toString(),
          },
        },
        {
          idempotencyKey: `pay_${ad.id}_${userId}`,
        },
      );

      return {
        success: true,
        clientSecret: intent.client_secret,
        amount: totalAmount,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('Payment Intent Error:', error);
      throw new InternalServerErrorException('Failed to initialize payment');
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
