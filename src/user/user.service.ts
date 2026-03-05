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
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class UserService {
  private stripe: Stripe;
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // --- SELLER PROFILE CREATION ---
  async createSellerProfile(userId: string, sellerDto: CreateSellerProfileDto) {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: userId },
        include: { sellerProfile: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== 'SELLER') {
        throw new ForbiddenException(
          'Only users with SELLER role can create a profile',
        );
      }

      if (user.sellerProfile) {
        throw new ConflictException(
          'Seller profile already exists for this user',
        );
      }
      const profile = await this.prisma.sellerProfile.create({
        data: {
          authId: user.id,
          companyName: sellerDto.companyName,
          city: sellerDto.city,
          address: sellerDto.address,
          zip: sellerDto.zip,
          companyWebSite: sellerDto.companyWebSite,
          country: sellerDto.country,
          state: sellerDto.state,
        },
      });

      return {
        success: true,
        message:
          'Your seller profile has been created successfully! Please purchase a subscription plan to start posting ads.',
        data: profile,
      };
    } catch (error) {
      console.error('Create Seller Profile Error:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create seller profile');
    }
  }
  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: userId },
        include: { sellerProfile: true },
      });

      if (!user) throw new NotFoundException('User not found');

      let profileImageUrl = user.profilePicture;
      if (file) {
        const uploadResult = await this.cloudinary.uploadImages([file]);
        profileImageUrl = uploadResult[0];
      }

      const updatedAuth = await this.prisma.auth.update({
        where: { id: userId },
        data: {
          firstName: updateData.firstName ?? user.firstName,
          lastName: updateData.lastName ?? user.lastName,
          nickName: updateData.nickName ?? user.nickName,
          phone: updateData.phone ?? user.phone,
          profilePicture: profileImageUrl,
        },
      });

      if (
        user.role === 'SELLER' &&
        user.sellerProfile &&
        updateData.sellerData
      ) {
        const sData = updateData.sellerData;

        await this.prisma.sellerProfile.update({
          where: { authId: userId },
          data: {
            companyName: sData.companyName ?? user.sellerProfile.companyName,
            address: sData.address ?? user.sellerProfile.address,
            city: sData.city ?? user.sellerProfile.city,
            state: sData.state ?? user.sellerProfile.state,
            country: sData.country ?? user.sellerProfile.country,
            zip: sData.zip ? Number(sData.zip) : user.sellerProfile.zip,
            companyWebSite:
              sData.companyWebSite ?? user.sellerProfile.companyWebSite,
          },
        });
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        data: updatedAuth,
      };
    } catch (error) {
      console.error('Update Error:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Profile update failed due to a server error',
      );
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
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = { ad: { sellerId: userId }, status: 'COMPLETED' as any };

    const [total, earnings] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          stripeId: true,
          totalAmount: true,
          adminFee: true,
          sellerAmount: true,
          status: true,
          createdAt: true,
          ad: {
            select: {
              id: true,
              title: true,
              price: true,
              category: { select: { name: true } },
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
          buyer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: earnings,
    };
  }
  // --- GET MY PURCHASES (BUYER) ---
  async getMyPurchases(
    userId: string,
    query: { page?: number; limit?: number },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = { buyerId: userId, status: 'COMPLETED' as any };

    const [total, purchases] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          stripeId: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          ad: {
            select: {
              id: true,
              title: true,
              description: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
              seller: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: purchases,
    };
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
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            price: true,
            sellerId: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    if (
      !payment ||
      (payment.buyerId !== userId && payment.ad.sellerId !== userId)
    ) {
      throw new NotFoundException('Payment not found or access denied');
    }

    const isSeller = payment.ad.sellerId === userId;

    const responseData = {
      id: payment.id,
      stripeId: payment.stripeId,
      status: payment.status,
      createdAt: payment.createdAt,
      ad: payment.ad,
      totalAmount: payment.totalAmount,
      ...(isSeller && {
        adminFee: payment.adminFee,
        sellerAmount: payment.sellerAmount,
        buyer: payment.buyer,
      }),
    };

    return {
      success: true,
      role: isSeller ? 'SELLER' : 'BUYER',
      data: responseData,
    };
  }

  async getSellerDashboardStats(sellerId: string) {
    try {
      const [totalAds, soldItems, totalViewsData, totalIncomeData] =
        await Promise.all([
          this.prisma.ad.count({
            where: { sellerId },
          }),
          this.prisma.ad.count({
            where: {
              sellerId,
              isSold: true,
            },
          }),

          this.prisma.ad.findMany({
            where: { sellerId },
            select: { viewerIds: true },
          }),

          this.prisma.payment.aggregate({
            where: {
              ad: { sellerId },
              status: 'COMPLETED',
            },
            _sum: {
              sellerAmount: true,
            },
          }),
        ]);

      const totalAdsViewed = totalViewsData.reduce(
        (acc, ad) => acc + ad.viewerIds.length,
        0,
      );

      return {
        success: true,
        data: {
          totalAds,
          totalIncome: totalIncomeData._sum.sellerAmount || 0,
          itemSold: soldItems,
          totalAdsViewed,
        },
      };
    } catch (error: any) {
      console.error('DASHBOARD_STATS_ERROR:', error);
      throw new InternalServerErrorException('Failed to fetch dashboard stats');
    }
  }

  async getSellerRecentAds(userId: string, query: { search?: string }) {
    const { search } = query;

    const where: any = {
      sellerId: userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const ads = await this.prisma.ad.findMany({
      where,
      take: 10,
      include: {
        category: { select: { name: true } },
        images: {
          select: {
            url: true,
          },
          take: 1,
        },
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: ads,
    };
  }

  async getMySubscriptions(userId: string) {
    try {
      const subscriptions = await this.prisma.subscription.findMany({
        where: { sellerId: userId },
        include: {
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
        'Failed to fetch your subscription history',
      );
    }
  }
}
