/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// // src/stripe/stripe-webhook.service.ts
// import { Injectable, BadRequestException } from '@nestjs/common';
// import Stripe from 'stripe';
// import { PrismaService } from '../prisma/prisma.service';
// // import { PaymentService } from '../payment/payment.service';

// const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? 10);

// @Injectable()
// export class StripeWebhookService {
//   private stripe: Stripe;

//   constructor(
//     private readonly prisma: PrismaService,
//     // private readonly paymentService: PaymentService,
//   ) {
//     this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//       apiVersion: '2024-12-18.acacia' as any,
//     });
//   }

//   async handleWebhook(rawBody: Buffer, sig: string) {
//     let event: Stripe.Event;

//     if (!sig) {
//       throw new BadRequestException('Missing Stripe signature');
//     }

//     try {
//       event = this.stripe.webhooks.constructEvent(
//         rawBody,
//         sig,
//         process.env.STRIPE_WEBHOOK_SECRET!,
//       );
//     } catch (err: any) {
//       throw new BadRequestException(`Webhook error: ${err.message}`);
//     }

//     switch (event.type) {
//       case 'account.updated': {
//         const account = event.data.object;

//         if (
//           account.charges_enabled === true &&
//           account.payouts_enabled === true &&
//           account.details_submitted === true
//         ) {
//           await this.prisma.sellerProfile.update({
//             where: { stripeAccountId: account.id },
//             data: { isStripeVerified: true },
//           });
//         }
//         break;
//       }

//       case 'payment_intent.succeeded':
//         await this.finalizePayment(event.data.object);
//         break;
//       case 'payment_intent.payment_failed':
//         await this.failPayment(event.data.object);
//         break;
//     }

//     return { received: true };
//   }

//   private async finalizePayment(intent: Stripe.PaymentIntent) {
//     const { adId, buyerId, totalAmount } = intent.metadata;

//     if (!adId || !buyerId || !totalAmount) {
//       console.error('Missing metadata in PaymentIntent:', intent.id);
//       return;
//     }

//     const amount = Number(totalAmount);
//     const adminFee = (amount * PLATFORM_FEE_PERCENT) / 100;
//     const sellerAmount = amount - adminFee;

//     try {
//       await this.prisma.$transaction(async (tx) => {
//         const existingPayment = await tx.payment.findUnique({
//           where: { stripeId: intent.id },
//         });

//         if (existingPayment) return;

//         await tx.payment.create({
//           data: {
//             stripeId: intent.id,
//             totalAmount: amount,
//             adminFee,
//             sellerAmount,
//             status: 'COMPLETED',
//             ad: { connect: { id: adId } },
//             buyer: { connect: { id: buyerId } },
//           },
//         });

//         await tx.ad.update({
//           where: { id: adId },
//           data: {
//             isSold: true,
//             buyerId,
//           },
//         });
//       });

//       console.log(`✅ Payment successful and DB updated for Ad: ${adId}`);
//     } catch (error) {
//       console.error('❌ Webhook DB Update failed:', error);
//     }
//   }

//   private async failPayment(intent: Stripe.PaymentIntent) {
//     const { adId, buyerId } = intent.metadata;

//     try {
//       await this.prisma.payment.create({
//         data: {
//           stripeId: intent.id,
//           totalAmount: 0,
//           adminFee: 0,
//           sellerAmount: 0,
//           adId,
//           buyerId,
//           status: 'FAILED',
//         },
//       });
//     } catch (error) {
//       console.error('Payment failed handler error:', error);
//     }
//   }
// }
import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class StripeWebhookService {
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: TranslationService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  async handleWebhook(rawBody: Buffer, sig: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const type = session.metadata?.type;

      // Route to correct handler based on metadata type
      if (type === 'SUBSCRIPTION_PURCHASE') {
        await this.activateSubscription(session);
      } else if (type === 'AD_BOOST_PURCHASE') {
        await this.activateAdBoost(session);
      }
    }

    return { received: true };
  }

  // --- Ad Boost Activation Logic ---
  private async activateAdBoost(session: Stripe.Checkout.Session) {
    const { adId, packageId, sellerId, lang = 'en' } = session.metadata || {};
    if (!adId || !packageId || !sellerId) return;

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Get package details for duration
        const pkg = await tx.adBoostPackage.findUnique({
          where: { id: packageId },
        });
        if (!pkg) throw new Error('Boost Package not found');

        // 2. Calculate end date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + pkg.durationDays);

        // 3. Create or Update the Boost record
        await tx.adBoost.upsert({
          where: { adId: adId },
          update: {
            packageId: pkg.id,
            status: 'ACTIVE',
            endDate: endDate,
            startDate: new Date(),
          },
          create: {
            adId: adId,
            packageId: pkg.id,
            sellerId: sellerId,
            status: 'ACTIVE',
            endDate: endDate,
            startDate: new Date(),
          },
        });

        // 4. Update the Ad flag for fast filtering
        await tx.ad.update({
          where: { id: adId },
          data: { isBoosted: true },
        });
      });

      console.log(
        `Ad ${adId} successfully boosted via Stripe Session ${session.id}`,
      );
    } catch (error) {
      console.error('Ad Boost Webhook Error:', error);
    }
  }

  // --- Existing Subscription Logic ---
  private async activateSubscription(session: Stripe.Checkout.Session) {
    const { planId, sellerId, type } = session.metadata || {};
    if (type !== 'SUBSCRIPTION_PURCHASE' || !planId || !sellerId) return;

    try {
      await this.prisma.$transaction(async (tx) => {
        const newPlan = await tx.subscriptionPlan.findUnique({
          where: { id: planId },
        });

        if (!newPlan) throw new Error('Plan not found');

        const currentSub = await tx.subscription.findUnique({
          where: { sellerId: sellerId },
        });

        const today = new Date();
        let finalEndDate: Date;
        let finalTotalLimit: number;

        const paidAmount = session.amount_total
          ? session.amount_total / 100
          : newPlan.price;

        if (
          currentSub &&
          currentSub.status === 'ACTIVE' &&
          currentSub.endDate > today
        ) {
          finalEndDate = new Date(currentSub.endDate);
          finalEndDate.setDate(finalEndDate.getDate() + newPlan.durationDays);

          finalTotalLimit = currentSub.totalLimit + newPlan.postLimit;
        } else {
          finalEndDate = new Date();
          finalEndDate.setDate(finalEndDate.getDate() + newPlan.durationDays);
          finalTotalLimit = newPlan.postLimit;
        }

        // ৩. Upsert logic with totalSpent increment
        await tx.subscription.upsert({
          where: { sellerId: sellerId },
          update: {
            planId: newPlan.id,
            endDate: finalEndDate,
            totalLimit: finalTotalLimit,
            totalSpent: {
              increment: paidAmount,
            },
            status: 'ACTIVE',
            paymentStatus: 'COMPLETED',
            transactionId: session.id,
          },
          create: {
            sellerId: sellerId,
            planId: newPlan.id,
            startDate: today,
            endDate: finalEndDate,
            totalLimit: finalTotalLimit,
            totalSpent: paidAmount,
            status: 'ACTIVE',
            paymentStatus: 'COMPLETED',
            transactionId: session.id,
          },
        });
      });

      console.log(
        `Successfully updated totalSpent and limits for seller: ${sellerId}`,
      );
    } catch (error) {
      console.error('Webhook Merging Error:', error);
    }
  }
}
