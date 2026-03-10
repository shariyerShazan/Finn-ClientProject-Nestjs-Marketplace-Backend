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

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { AllMailService } from 'src/mail/all-mail.service';
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class StripeWebhookService {
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    // private readonly allMailService: AllMailService,
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
      await this.activateSubscription(session);
    }

    return { received: true };
  }

  private async activateSubscription(session: Stripe.Checkout.Session) {
    const { planId, sellerId, type, lang = 'en' } = session.metadata || {};
    if (type !== 'SUBSCRIPTION_PURCHASE' || !planId || !sellerId) return;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const newPlan = await tx.subscriptionPlan.findUnique({
          where: { id: planId },
        });

        if (!newPlan) throw new Error('Plan not found');

        const seller = await tx.auth.findUnique({
          where: { id: sellerId },
          select: { email: true, firstName: true },
        });

        if (!seller) throw new Error('Seller not found');

        const currentSub = await tx.subscription.findUnique({
          where: { sellerId: sellerId },
        });

        const today = new Date();
        let finalEndDate: Date;
        let finalTotalLimit: number;

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

        const subscription = await tx.subscription.upsert({
          where: { sellerId: sellerId },
          update: {
            planId: newPlan.id,
            endDate: finalEndDate,
            totalLimit: finalTotalLimit,
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
            status: 'ACTIVE',
            paymentStatus: 'COMPLETED',
            transactionId: session.id,
          },
        });

        return { seller, newPlan, subscription };
      });
      if (result) {
        const { seller, newPlan } = result;
        const subject = await this.translationService.translate(
          'Subscription Activated!',
          lang,
        );
        const body = await this.translationService.translate(
          `Your ${newPlan.name} plan is now active. You have ${newPlan.postLimit} post limits added.`,
          lang,
        );

        console.log(`Sending email to ${seller.email} in ${lang} language...`);
      }
    } catch (error) {
      console.error('Webhook Merging Error:', error);
    }
  }
}
