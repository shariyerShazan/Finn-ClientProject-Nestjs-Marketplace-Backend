/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  AdminCreateSellerDto,
  AdminUpdateSellerDto,
} from './dto/admin-seller.dto';
import { AllMailService } from 'src/mail/all-mail.service';
import Stripe from 'stripe';
import { SellerStatus } from 'prisma/generated/prisma/enums';
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class AdminService {
  stripe: Stripe;
  constructor(
    private readonly prisma: PrismaService,
    private readonly allMailService: AllMailService,
    private readonly translationService: TranslationService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27' as any,
    });
  }

  async createSellerByAdmin(dto: AdminCreateSellerDto, lang: string = 'en') {
    try {
      const existingUser = await this.prisma.auth.findFirst({
        where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
      });

      if (existingUser) {
        throw new ConflictException(
          await this.translationService.translate(
            'Email or Phone already exists',
            lang,
          ),
        );
      }

      const stripeAccount = await this.stripe.accounts.create({
        type: 'express',
        email: dto.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      await this.prisma.$transaction(async (tx) => {
        const auth = await tx.auth.create({
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            nickName: dto.nickName,
            email: dto.email,
            phone: dto.phone,
            password: hashedPassword,
            isSeller: true,
            isVerified: true,
          },
        });

        await tx.sellerProfile.create({
          data: {
            authId: auth.id,
            companyName: dto.companyName,
            companyWebSite: dto.companyWebSite,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            zip: dto.zip,
            country: dto.country,
            status: 'APPROVED',
            stripeAccountId: stripeAccount.id,
            isStripeVerified: false,
          },
        });
      });

      try {
        await this.allMailService.sendSellerCredentials(
          dto.email,
          dto.password,
          dto.firstName,
          lang,
        );
      } catch (mailError) {
        console.error('Email sending failed:', mailError);
      }

      return {
        success: true,
        message: await this.translationService.translate(
          'Seller created with Stripe ID and credentials sent to mail',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Failed to create seller',
          lang,
        ),
      );
    }
  }

  async updateSellerByAdmin(
    sellerId: string,
    dto: AdminUpdateSellerDto,
    lang: string = 'en',
  ) {
    try {
      const auth = await this.prisma.auth.findUnique({
        where: { id: sellerId },
      });
      if (!auth)
        throw new NotFoundException(
          await this.translationService.translate('Seller not found', lang),
        );

      let hashedPassword;
      if (dto.password) {
        hashedPassword = await bcrypt.hash(dto.password, 10);
      }

      const updated = await this.prisma.auth.update({
        where: { id: sellerId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          password: hashedPassword,
          sellerProfile: {
            update: {
              companyName: dto.companyName,
              companyWebSite: dto.companyWebSite,
              address: dto.address,
              city: dto.city,
              state: dto.state,
              zip: dto.zip,
              country: dto.country,
            },
          },
        },
      });

      return {
        success: true,
        message: await this.translationService.translate(
          'Seller updated successfully',
          lang,
        ),
        data: updated,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        await this.translationService.translate('Update failed', lang),
      );
    }
  }

  async toggleSellerSuspension(
    sellerId: string,
    reason?: string,
    lang: string = 'en',
  ) {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: sellerId },
      });
      if (!user)
        throw new NotFoundException(
          await this.translationService.translate('Seller not found', lang),
        );

      const newSuspendedStatus = !user.isSuspended;
      if (newSuspendedStatus === true && !reason) {
        throw new BadRequestException(
          await this.translationService.translate(
            'Reason is mandatory for suspension!',
            lang,
          ),
        );
      }

      const updatedUser = await this.prisma.auth.update({
        where: { id: sellerId },
        data: {
          isSuspended: newSuspendedStatus,
          suspensionReason: newSuspendedStatus ? reason : '',
        },
      });

      const msg = newSuspendedStatus
        ? `Seller suspended successfully. Reason: ${reason}`
        : 'Seller account activated successfully';

      return {
        updatedUser,
        success: true,
        message: await this.translationService.translate(msg, lang),
        currentStatus: newSuspendedStatus,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate('Status toggle error!', lang),
      );
    }
  }

  async deleteSeller(sellerId: string, lang: string = 'en') {
    try {
      await this.prisma.auth.delete({ where: { id: sellerId } });
      return {
        success: true,
        message: await this.translationService.translate(
          'Seller deleted forever',
          lang,
        ),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        await this.translationService.translate('Delete failed', lang),
      );
    }
  }

  async getAllUsers(query: any) {
    const { page = 1, limit = 10, role, isSeller, isSuspended, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      ...(role && { role }),
      ...(isSeller !== undefined && { isSeller: isSeller === 'true' }),
      ...(isSuspended !== undefined && { isSuspended: isSuspended === 'true' }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { nickName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, users] = await Promise.all([
      this.prisma.auth.count({ where }),
      this.prisma.auth.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          sellerProfile: true,
          _count: { select: { postedAds: true, boughtAds: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      data: users,
    };
  }

  async getAllPayments(query: any) {
    const { page = 1, limit = 10, status } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = status ? { status } : {};

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          buyer: { select: { nickName: true, email: true } },
          ad: { select: { title: true, price: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      data: payments,
    };
  }

  async getAllAds(query: any) {
    const { page = 1, limit = 10, type, isSold, search, lang = 'en' } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      ...(type && { type }),
      ...(isSold !== undefined && { isSold: isSold === 'true' }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, ads] = await Promise.all([
      this.prisma.ad.count({ where }),
      this.prisma.ad.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          seller: { select: { nickName: true, email: true } },
          category: { select: { name: true } },
          _count: { select: { bids: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const translatedAds = await this.translationService.translateData(
      ads,
      ['title'],
      lang,
    );

    return {
      success: true,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      data: translatedAds,
    };
  }

  async getSingleUser(userId: string, lang: string = 'en') {
    const user = await this.prisma.auth.findUnique({
      where: { id: userId },
      include: {
        sellerProfile: true,
        postedAds: { take: 5, orderBy: { createdAt: 'desc' } },
        boughtAds: { take: 5, orderBy: { createdAt: 'desc' } },
        _count: { select: { postedAds: true, boughtAds: true, bids: true } },
      },
    });

    if (!user)
      throw new NotFoundException(
        await this.translationService.translate('User not found', lang),
      );
    return { success: true, data: user };
  }

  async getSingleAd(adId: string, lang: string = 'en') {
    const ad = await this.prisma.ad.findUnique({
      where: { id: adId },
      include: {
        seller: { select: { nickName: true, email: true, phone: true } },
        category: true,
        subCategory: true,
        images: true,
        bids: {
          include: { bidder: { select: { nickName: true } } },
          orderBy: { amount: 'desc' },
        },
        payment: true,
      },
    });

    if (!ad)
      throw new NotFoundException(
        await this.translationService.translate('Ad not found', lang),
      );
    const translatedAd = await this.translationService.translateData(
      ad,
      ['title', 'description'],
      lang,
    );
    return { success: true, data: translatedAd };
  }

  async getSinglePayment(paymentId: string, lang: string = 'en') {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        buyer: { select: { firstName: true, email: true, phone: true } },
        ad: {
          include: { seller: { select: { firstName: true, email: true } } },
        },
      },
    });

    if (!payment)
      throw new NotFoundException(
        await this.translationService.translate(
          'Payment record not found',
          lang,
        ),
      );
    return { success: true, data: payment };
  }

  async toggleSellerApproval(userId: string, lang: string = 'en') {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: userId },
        include: { sellerProfile: true },
      });

      if (!user)
        throw new NotFoundException(
          await this.translationService.translate('User not found', lang),
        );
      if (!user.sellerProfile) {
        throw new BadRequestException(
          await this.translationService.translate(
            'This user has no seller profile to approve',
            lang,
          ),
        );
      }

      const isCurrentlyApproved = user.sellerProfile.status === 'APPROVED';
      const newStatus: SellerStatus = isCurrentlyApproved
        ? 'REJECTED'
        : 'APPROVED';
      const newIsSeller = !isCurrentlyApproved;

      await this.prisma.$transaction([
        this.prisma.auth.update({
          where: { id: userId },
          data: { isSeller: newIsSeller },
        }),
        this.prisma.sellerProfile.update({
          where: { authId: userId },
          data: { status: newStatus },
        }),
      ]);

      const msg = `Seller profile has been ${newStatus.toLowerCase()} successfully`;
      return {
        success: true,
        message: await this.translationService.translate(msg, lang),
        data: { isSeller: newIsSeller, status: newStatus },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Failed to process seller approval',
          lang,
        ),
      );
    }
  }

  async getAllRequestedSellers(query: any) {
    try {
      const { page = 1, limit = 10, search } = query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        isSeller: false,
        sellerProfile: { isNot: null },
        ...(search && {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { nickName: { contains: search, mode: 'insensitive' } },
            {
              sellerProfile: {
                companyName: { contains: search, mode: 'insensitive' },
              },
            },
          ],
        }),
      };

      const [total, requests] = await Promise.all([
        this.prisma.auth.count({ where }),
        this.prisma.auth.findMany({
          where,
          skip,
          take: Number(limit),
          include: { sellerProfile: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        success: true,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
        data: requests,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch requested sellers',
      );
    }
  }

  async getAdminStats() {
    try {
      const [
        totalUsers,
        totalSellers,
        totalAds,
        totalSoldAds,
        paymentStats,
        subscriptions,
      ] = await Promise.all([
        this.prisma.auth.count({ where: { isSeller: false, role: 'USER' } }),
        this.prisma.auth.count({ where: { isSeller: true } }),
        this.prisma.ad.count(),
        this.prisma.ad.count({ where: { isSold: true } }),
        this.prisma.payment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { totalAmount: true, adminFee: true, sellerAmount: true },
        }),
        this.prisma.subscription.findMany({
          where: { paymentStatus: 'COMPLETED' },
          include: { plan: { select: { price: true } } },
        }),
      ]);

      const totalSubscriptionRevenue = subscriptions.reduce(
        (sum, sub) => sum + (sub.plan?.price || 0),
        0,
      );

      return {
        success: true,
        data: {
          overview: {
            totalUsers,
            totalSellers,
            totalAds,
            totalSoldAds,
            conversionRate:
              totalAds > 0 ? ((totalSoldAds / totalAds) * 100).toFixed(2) : 0,
          },
          financials: {
            totalRevenue:
              (paymentStats._sum.totalAmount || 0) + totalSubscriptionRevenue,
            netProfit:
              (paymentStats._sum.adminFee || 0) + totalSubscriptionRevenue,
            sellerPayouts: paymentStats._sum.sellerAmount || 0,
            subscriptionRevenue: totalSubscriptionRevenue,
            totalSubscriptionsSold: subscriptions.length,
          },
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate statistics');
    }
  }

  async getRecentUsers() {
    try {
      const recentUsers = await this.prisma.auth.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          sellerProfile: true,
          _count: { select: { postedAds: true, boughtAds: true } },
        },
      });
      return { success: true, data: recentUsers };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch recent users');
    }
  }
}
