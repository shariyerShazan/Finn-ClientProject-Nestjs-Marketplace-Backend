/* eslint-disable @typescript-eslint/no-unsafe-call */
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

@Injectable()
export class AdminService {
  stripe: Stripe;
  constructor(
    private readonly prisma: PrismaService,
    private readonly allMailService: AllMailService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27' as any,
    });
  }

  async createSellerByAdmin(dto: AdminCreateSellerDto) {
    try {
      const existingUser = await this.prisma.auth.findFirst({
        where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
      });

      if (existingUser)
        throw new ConflictException('Email or Phone already exists');

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
        );
      } catch (mailError) {
        console.error('Email sending failed:', mailError);
      }

      return {
        success: true,
        message: 'Seller created with Stripe ID and credentials sent to mail',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new InternalServerErrorException('Failed to create seller');
    }
  }

  async updateSellerByAdmin(sellerId: string, dto: AdminUpdateSellerDto) {
    try {
      const auth = await this.prisma.auth.findUnique({
        where: { id: sellerId },
      });
      if (!auth) throw new NotFoundException('Seller not found');

      let hashedPassword;
      if (dto.password) {
        hashedPassword = await bcrypt.hash(dto.password, 10);
      }

      return await this.prisma.auth.update({
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
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Update failed');
    }
  }

  async toggleSellerSuspension(sellerId: string) {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: sellerId },
        select: { isSuspended: true },
      });

      if (!user) throw new NotFoundException('Seller not found');

      const newStatus = !user.isSuspended;

      await this.prisma.auth.update({
        where: { id: sellerId },
        data: { isSuspended: newStatus },
      });

      return {
        success: true,
        message: newStatus
          ? 'Seller suspended successfully'
          : 'Seller activated successfully',
        currentStatus: newStatus,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.log(error);
      throw new InternalServerErrorException('Status chnage error!');
    }
  }

  async deleteSeller(sellerId: string) {
    try {
      await this.prisma.auth.delete({ where: { id: sellerId } });
      return { success: true, message: 'Seller deleted forever' };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Delete failed');
    }
  }

  async getAllUsers(query: {
    page?: number;
    limit?: number;
    role?: 'USER' | 'ADMIN' | 'SELLER';
    isSeller?: string;
    isSuspended?: string;
    search?: string;
  }) {
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
          _count: {
            select: { postedAds: true, boughtAds: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      meta: { total, page: Number(page), limit: Number(limit) },
      data: users,
    };
  }

  async getAllPayments(query: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'COMPLETED' | 'FAILED';
  }) {
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
      meta: { total, page: Number(page), limit: Number(limit) },
      data: payments,
    };
  }

  async getAllAds(query: {
    page?: number;
    limit?: number;
    type?: 'FIXED' | 'AUCTION';
    isSold?: string;
    search?: string;
  }) {
    const { page = 1, limit = 10, type, isSold, search } = query;
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

    return {
      success: true,
      meta: { total, page: Number(page), limit: Number(limit) },
      data: ads,
    };
  }

  async getSingleUser(userId: string) {
    const user = await this.prisma.auth.findUnique({
      where: { id: userId },
      include: {
        sellerProfile: true,
        postedAds: { take: 5, orderBy: { createdAt: 'desc' } }, // Last 5 ads
        boughtAds: { take: 5, orderBy: { createdAt: 'desc' } }, // Last 5 purchases
        _count: { select: { postedAds: true, boughtAds: true, bids: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: user };
  }

  async getSingleAd(adId: string) {
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

    if (!ad) throw new NotFoundException('Ad not found');
    return { success: true, data: ad };
  }

  async getSinglePayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        buyer: { select: { firstName: true, email: true, phone: true } },
        ad: {
          include: {
            seller: { select: { firstName: true, email: true } },
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment record not found');
    return { success: true, data: payment };
  }

  async toggleSellerApproval(userId: string) {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: userId },
        include: { sellerProfile: true },
      });

      if (!user) throw new NotFoundException('User not found');
      if (!user.sellerProfile) {
        throw new BadRequestException(
          'This user has no seller profile to approve',
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

      return {
        success: true,
        message: `Seller profile has been ${newStatus.toLowerCase()} successfully`,
        data: {
          isSeller: newIsSeller,
          status: newStatus,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Approval Toggle Error:', error);
      throw new InternalServerErrorException(
        'Failed to process seller approval',
      );
    }
  }

  async getAllRequestedSellers(query: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    try {
      const { page = 1, limit = 10, search } = query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        isSeller: false,
        sellerProfile: {
          isNot: null,
          status: 'PENDING',
        },
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
          include: {
            sellerProfile: true,
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
        data: requests,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      console.error('GetAllRequestedSellers Error:', error);
      throw new InternalServerErrorException(
        'Failed to fetch requested sellers list. Please try again later.',
      );
    }
  }
}
