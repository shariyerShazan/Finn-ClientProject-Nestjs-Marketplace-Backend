/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27' as any,
    });
  }

  async createPaymentIntent(userId: string, dto: { adId: string }) {
    try {
      const user = await this.prisma.auth.findUnique({ where: { id: userId } });
      if (!user || user.isSuspended)
        throw new ForbiddenException('User is suspended or not found');

      const ad = await this.prisma.ad.findUnique({
        where: { id: dto.adId },
        include: {
          seller: {
            include: { sellerProfile: { include: { sellerBank: true } } },
          },
        },
      });

      if (!ad) throw new NotFoundException('Ad not found');
      if (ad.isSold) throw new BadRequestException('Ad already sold');
      if (!ad.seller.sellerProfile?.sellerBank)
        throw new BadRequestException('Seller has not added bank details yet');

      const totalAmount = ad.price || ad.releasePrice;
      if (!totalAmount)
        throw new BadRequestException('Price not set for this ad');

      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: 'usd',
        metadata: {
          adId: ad.id,
          userId: userId,
          totalAmount: totalAmount.toString(),
          sellerAmount: (totalAmount * 0.9).toString(),
          adminFee: (totalAmount * 0.1).toString(),
        },
      });

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
      )
        throw error;
      throw new InternalServerErrorException('Failed to initialize payment');
    }
  }

  async handleWebhook(rawBody: Buffer, sig: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await this.finalizePayment(intent);
    }

    return { received: true };
  }

  // ৩. Database Update (Private Helper)
  private async finalizePayment(intent: Stripe.PaymentIntent) {
    const { adId, userId, totalAmount } = intent.metadata;

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            stripeId: intent.id,
            amount: parseFloat(totalAmount),
            adId: adId,
            authId: userId,
            status: 'COMPLETED',
            isPaid: 'COMPLETED',
          },
        });

        await tx.ad.update({
          where: { id: adId },
          data: { isSold: true },
        });
      });
    } catch (error) {
      console.error('Webhook DB processing failed:', error);
      throw new InternalServerErrorException('Failed to update DB on webhook');
    }
  }
}
