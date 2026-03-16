// /* eslint-disable @typescript-eslint/no-unsafe-assignment */

// import {
//   Injectable,
//   NotFoundException,
//   InternalServerErrorException,
//   BadRequestException,
//   // ForbiddenException,
// } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import Stripe from 'stripe';

// const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? 10);

// @Injectable()
// export class PaymentService {
//   private stripe: Stripe;

//   constructor(private readonly prisma: PrismaService) {
//     this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//       apiVersion: '2024-12-18.acacia' as any,
//     });
//   }

//   async createPaymentIntent(
//     userId: string,
//     dto: { adId: string; token: string },
//   ) {
//     try {
//       const ad = await this.prisma.ad.findUnique({
//         where: { id: dto.adId },
//         include: {
//           seller: {
//             include: { sellerProfile: true },
//           },
//         },
//       });

//       if (!ad) throw new NotFoundException('Ad not found');
//       if (ad.isSold) throw new BadRequestException('Ad already sold');

//       const sellerProfile = ad.seller.sellerProfile;
//       if (!sellerProfile?.stripeAccountId) {
//         throw new BadRequestException('Seller bank account not connected');
//       }

//       const totalAmount = ad.price ?? ad.releasePrice;
//       if (!totalAmount) throw new BadRequestException('Invalid price');

//       const amountInCents = Math.round(totalAmount * 100);
//       const adminFeeInCents = Math.round(
//         amountInCents * (PLATFORM_FEE_PERCENT / 100),
//       );

//       const intent = await this.stripe.paymentIntents.create(
//         {
//           amount: amountInCents,
//           currency: 'usd',
//           payment_method_data: {
//             type: 'card',
//             card: { token: dto.token },
//           } as any,
//           confirm: true,
//           automatic_payment_methods: {
//             enabled: true,
//             allow_redirects: 'never',
//           },
//           application_fee_amount: adminFeeInCents,
//           transfer_data: {
//             destination: sellerProfile.stripeAccountId,
//           },
//           on_behalf_of: sellerProfile.stripeAccountId,
//           metadata: {
//             adId: ad.id,
//             buyerId: userId,
//             totalAmount: totalAmount.toString(),
//           },
//         },
//         {
//           idempotencyKey: `pay_${ad.id}_${userId}_${Date.now()}`,
//         },
//       );

//       return {
//         success: true,
//         status: intent.status,
//         transactionId: intent.id,
//         amount: totalAmount,
//       };
//     } catch (error) {
//       if (error instanceof Stripe.errors.StripeError) {
//         throw new BadRequestException(error.message);
//       }

//       if (
//         error instanceof NotFoundException ||
//         error instanceof BadRequestException
//       ) {
//         throw error;
//       }

//       console.error('Payment Error:', error);
//       throw new InternalServerErrorException('Payment processing failed');
//     }
//   }

//   async generateOnboardingLink(userId: string) {
//     try {
//       const user = await this.prisma.auth.findUnique({
//         where: { id: userId },
//         include: { sellerProfile: true },
//       });

//       if (!user?.sellerProfile?.stripeAccountId) {
//         throw new BadRequestException('Stripe account not found');
//       }

//       const accountLink = await this.stripe.accountLinks.create({
//         account: user.sellerProfile.stripeAccountId,
//         refresh_url: `${process.env.FRONTEND_URL}/seller/dashboard/?success=false`,
//         return_url: `${process.env.FRONTEND_URL}/seller/dashboard/?success=true`,
//         type: 'account_onboarding',
//       });

//       return { url: accountLink.url };
//     } catch (error) {
//       console.error('Generate onboarding failed:', error);
//       throw error;
//     }
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
  // ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  async createCheckoutSession(userId: string, planId: string) {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!plan) throw new NotFoundException('Subscription plan not found');

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'pln',
              product_data: {
                name: plan.name,
                description: `Add ${plan.postLimit} ads and ${plan.durationDays} days to your current balance.`,
              },
              unit_amount: Math.round(plan.price * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/seller/dashboard/subscription?status=success`,
        cancel_url: `${process.env.FRONTEND_URL}/seller/dashboard/subscription?status=cancel`,
        metadata: {
          planId: plan.id,
          sellerId: userId,
          type: 'SUBSCRIPTION_PURCHASE',
        },
      });

      return { success: true, url: session.url };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed to initiate checkout session',
      );
    }
  }

  async getAllSubscriptions() {
    try {
      const subscriptions = await this.prisma.subscription.findMany({
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: subscriptions,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed to fetch subscription history',
      );
    }
  }

  async getSingleSubscription(id: string) {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id },
        include: {
          seller: true,
          plan: true,
        },
      });

      if (!subscription)
        throw new NotFoundException('Subscription record not found');

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to fetch subscription details',
      );
    }
  }

  async createBoostCheckoutSession(
    userId: string,
    adId: string,
    packageId: string,
  ) {
    try {
      const [ad, pkg] = await Promise.all([
        this.prisma.ad.findUnique({ where: { id: adId } }),
        this.prisma.adBoostPackage.findUnique({ where: { id: packageId } }),
      ]);

      if (!ad) throw new NotFoundException('Ad not found');
      if (!pkg) throw new NotFoundException('Boost package not found');

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'pln',
              product_data: {
                name: `Boost: ${pkg.name}`,
                description: `Boosting Ad: ${ad.title} for ${pkg.durationDays} days.`,
              },
              unit_amount: Math.round(pkg.price * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/seller/dashboard/my-ads?status=success`,
        cancel_url: `${process.env.FRONTEND_URL}/seller/dashboard/my-ads?status=cancel`,
        metadata: {
          sellerId: userId,
          adId: ad.id,
          packageId: pkg.id,
          type: 'AD_BOOST_PURCHASE',
        },
      });

      return { success: true, url: session.url };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Failed to initiate boost payment',
      );
    }
  }

  // 2. Get All Boost History (Admin)
  async getAllBoostHistory() {
    return {
      success: true,
      data: await this.prisma.adBoost.findMany({
        include: {
          seller: { select: { email: true, firstName: true, lastName: true } },
          ad: { select: { title: true } },
          package: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  // 3. Get User Specific Boost History (Seller)
  async getUserBoostHistory(userId: string) {
    return {
      success: true,
      data: await this.prisma.adBoost.findMany({
        where: { sellerId: userId },
        include: { ad: { select: { title: true } }, package: true },
        orderBy: { createdAt: 'desc' },
      }),
    };
  }
}
