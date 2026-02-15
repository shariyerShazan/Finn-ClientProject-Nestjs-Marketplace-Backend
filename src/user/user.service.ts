/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  // BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSellerProfileDto } from 'src/user/dto/create-seller-profile.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/UpdateProfileDto';
import Stripe from 'stripe';

@Injectable()
export class UserService {
  private stripe: Stripe;
  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  // --- SELLER PROFILE CREATION ---
  async createSellerProfile(userId: string, sellerDto: CreateSellerProfileDto) {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: userId },
        include: { sellerProfile: true },
      });

      if (!user) throw new NotFoundException('User not found');
      if (user.role !== 'SELLER')
        throw new ForbiddenException('Only sellers can create a profile');
      if (user.sellerProfile)
        throw new ConflictException('Profile already exists');

      const stripeAccount = await this.stripe.accounts.create({
        type: 'express',
        country: sellerDto.country, // BD hole card_payments bad jabe
        email: user.email,
        capabilities:
          sellerDto.country === 'BD'
            ? {
                transfers: { requested: true }, // BD-r jonno shudhu transfers ba cross-border logic thake
              }
            : {
                card_payments: { requested: true },
                transfers: { requested: true },
              },
        metadata: { userId: user.id },
      });

      return await this.prisma.sellerProfile.create({
        data: {
          authId: user.id,
          companyName: sellerDto.companyName,
          city: sellerDto.city,
          address: sellerDto.address,
          zip: sellerDto.zip,
          companyWebSite: sellerDto.companyWebSite,
          country: sellerDto.country,
          state: sellerDto.state,
          stripeAccountId: stripeAccount.id,
        },
      });
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to create seller profile');
    }
  }

  // --- PROFILE UPDATE ---
  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: userId },
        include: { sellerProfile: true },
      });

      if (!user) throw new NotFoundException('User not found');

      const {
        firstName,
        lastName,
        nickName,
        phone,
        profilePicture,
        sellerData,
      } = updateData;

      const updatedAuth = await this.prisma.auth.update({
        where: { id: userId },
        data: {
          firstName: firstName ?? user.firstName,
          lastName: lastName ?? user.lastName,
          nickName: nickName ?? user.nickName,
          phone: phone ?? user.phone,
          profilePicture: profilePicture ?? user.profilePicture,
        },
      });

      if (user.role === 'SELLER' && sellerData && user.sellerProfile) {
        if (!user.isSeller) {
          throw new ForbiddenException('Seller profile pending approval.');
        }

        await this.prisma.sellerProfile.update({
          where: { authId: userId },
          data: {
            companyName:
              sellerData.companyName ?? user.sellerProfile.companyName,
            address: sellerData.address ?? user.sellerProfile.address,
            city: sellerData.city ?? user.sellerProfile.city,
            state: sellerData.state ?? user.sellerProfile.state,
            zip: sellerData.zip ?? user.sellerProfile.zip,
          },
        });
      }

      return { success: true, data: updatedAuth };
    } catch (error) {
      // console.log(error)
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Update failed');
    }
  }

  // --- GET ME ---
  async getMe(userId: string) {
    const user = await this.prisma.auth.findUnique({
      where: { id: userId },
      include: {
        sellerProfile: true,
        _count: { select: { postedAds: true, boughtAds: true, bids: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: user };
  }

  // --- GET MY ADS (SELLER) ---
  async getMyAds(
    userId: string,
    query: { page?: number; limit?: number; search?: string },
  ) {
    const { page = 1, limit = 10, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      sellerId: userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
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
          category: { select: { name: true } },
          // Image gulo include kora holo jate frontend-e gallery dekha jay
          images: {
            select: {
              url: true,
            },
          },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
      data: ads,
    };
  }

  // --- GET MY EARNINGS (SELLER) ---
  async getMyEarnings(
    userId: string,
    query: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = { ad: { sellerId: userId } };

    const [total, earnings] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          ad: { select: { title: true } },
          buyer: { select: { firstName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { success: true, meta: { total, page }, data: earnings };
  }

  // --- GET MY PURCHASES (BUYER) ---
  async getMyPurchases(
    userId: string,
    query: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [total, purchases] = await Promise.all([
      this.prisma.payment.count({ where: { buyerId: userId } }),
      this.prisma.payment.findMany({
        where: { buyerId: userId },
        skip,
        take: Number(limit),
        include: { ad: { select: { title: true, images: { take: 1 } } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { success: true, meta: { total, page }, data: purchases };
  }

  // --- SINGLE ITEM DETAILS ---
  async getSingleMyAd(userId: string, adId: string) {
    const ad = await this.prisma.ad.findFirst({
      where: { id: adId, sellerId: userId },
      include: { images: true, bids: true, category: true },
    });
    if (!ad) throw new NotFoundException('Ad not found');
    return { success: true, data: ad };
  }

  async getSinglePayment(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        OR: [{ buyerId: userId }, { ad: { sellerId: userId } }],
      },
      include: { ad: true, buyer: { select: { nickName: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return { success: true, data: payment };
  }
}
