/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto, UpdateAddDto } from './dto/CreateAdDto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class AddService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private transformAdData(ad: any) {
    const { seller, buyer, ...adData } = ad;

    // Seller Info Filter
    const sellerInfo = {
      id: seller.id,
      nickName: seller.nickName,
      profilePicture: seller.profilePicture,
      email: ad.allowEmail ? seller.email : 'Private',
      phone: ad.allowPhone ? seller.phone : 'Private',
    };

    // Address Privacy Filter
    if (!ad.showAddress) {
      adData.state = 'Private';
      adData.city = 'Private';
      adData.zipCode = '****';
      adData.country = 'Private';
      adData.latitude = null;
      adData.longitude = null;
    }

    return {
      ...adData,
      seller: sellerInfo,
      buyer: ad.isSold && buyer ? { nickName: buyer.nickName } : null,
    };
  }

  private async validateSpecifications(
    subCategoryId: string,
    specifications: any,
    isUpdate = false,
  ) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });

    if (!subCategory) throw new NotFoundException('Sub-category not found');

    const adminSpecs = (subCategory.specFields as any[]) || [];
    // Ensure we are working with an object
    const sellerSpecs =
      typeof specifications === 'string'
        ? JSON.parse(specifications)
        : specifications || {};

    const validatedData = {};
    for (const field of adminSpecs) {
      const value = sellerSpecs[field.key];
      if (field.required) {
        if (
          !isUpdate &&
          (value === undefined || value === null || value === '')
        ) {
          throw new BadRequestException(`Field "${field.label}" is required.`);
        }
      }
      if (value !== undefined) validatedData[field.key] = value;
    }
    return validatedData;
  }

  async createAd(sellerId: string, createAdDto: CreateAdDto, files: any) {
    try {
      // A. Image Check
      if (!files || files.length === 0)
        throw new BadRequestException('Images are required');

      const subscription = await this.prisma.subscription.findUnique({
        where: { sellerId },
      });

      if (!subscription || subscription.status !== 'ACTIVE') {
        throw new BadRequestException('No active subscription plan found.');
      }
      const usedCount = subscription.usedAdIds.length;
      if (usedCount >= subscription.totalLimit) {
        throw new BadRequestException(
          `Ad limit reached (${usedCount}/${subscription.totalLimit}). Please upgrade your plan.`,
        );
      }

      // B. Manual Parsing (FormData safety)
      const price = Number(createAdDto.price);
      const lat = createAdDto.latitude ? Number(createAdDto.latitude) : null;
      const lng = createAdDto.longitude ? Number(createAdDto.longitude) : null;

      // FormData theke asha string ke boolean banano
      const showAddress = String(createAdDto.showAddress) === 'true';
      const allowPhone = String(createAdDto.allowPhone) === 'true';
      const allowEmail = String(createAdDto.allowEmail) === 'true';

      // C. Specifications handling (The biggest suspect)
      let specs = createAdDto.specifications;
      if (typeof specs === 'string') {
        try {
          specs = JSON.parse(specs);
        } catch (e) {
          throw new BadRequestException('Invalid JSON in specifications');
        }
      }

      // Specification validate korar agey dekhen specs object kina
      const validatedSpecs = await this.validateSpecifications(
        createAdDto.subCategoryId,
        specs,
      );

      // D. Cloudinary Upload
      const imageUrls = await this.cloudinary.uploadImages(files);

      // E. Prisma Create
      const newAdd = await this.prisma.ad.create({
        data: {
          title: createAdDto.title,
          description: createAdDto.description,
          type: createAdDto.type,
          price: price,
          propertyFor: createAdDto.propertyFor,
          state: createAdDto.state,
          city: createAdDto.city,
          zipCode: createAdDto.zipCode,
          country: createAdDto.country,
          latitude: lat,
          longitude: lng,
          showAddress,
          allowPhone,
          allowEmail,
          categoryId: createAdDto.categoryId,
          subCategoryId: createAdDto.subCategoryId,
          specifications: validatedSpecs,
          sellerId: sellerId,
          images: {
            create: imageUrls.map((url, index) => ({
              url,
              isPrimary: index === 0,
            })),
          },
        },
      });

      await this.prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { sellerId },
          data: {
            usedAdIds: {
              push: newAdd.id,
            },
          },
        });
      });
      return { newAdd, success: true, message: 'Ad created successfully' };
    } catch (error) {
      console.error('DETAILED_ERROR:', error); // Eita apnar terminal-e bolbe ashol kahini
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateAd(
    adId: string,
    sellerId: string,
    updateAdDto: UpdateAddDto,
    files?: Express.Multer.File[],
  ) {
    try {
      const existingAd = await this.prisma.ad.findUnique({
        where: { id: adId },
        include: { images: true }, // ইমেজগুলো আগে থেকেই ইনক্লুড করুন
      });

      if (!existingAd) throw new NotFoundException('Ad not found');
      if (existingAd.sellerId !== sellerId)
        throw new ForbiddenException('Not authorized');

      // --- ১. ইমেজ ডিলিট করার লজিক ---
      let imagesRemainingCount = existingAd.images.length;

      if (updateAdDto.imagesToDelete) {
        const idsToDelete = Array.isArray(updateAdDto.imagesToDelete)
          ? updateAdDto.imagesToDelete
          : (updateAdDto.imagesToDelete as string).split(',');

        imagesRemainingCount -= idsToDelete.length;

        await this.prisma.adImage.deleteMany({
          where: { id: { in: idsToDelete }, adId },
        });
      }

      // --- ২. নতুন ইমেজ আপলোড এবং চেক ---
      const newImageCount = files?.length || 0;
      if (imagesRemainingCount + newImageCount === 0) {
        throw new BadRequestException(
          'At least one image is required for an ad.',
        );
      }

      let newImageUrls: string[] = [];
      if (newImageCount > 0) {
        newImageUrls = await this.cloudinary.uploadImages(files as any);
      }

      // --- ৩. স্পেসিফিকেশন হ্যান্ডলিং (Parse JSON if string) ---
      let finalSpecs: any = undefined;
      if (updateAdDto.specifications) {
        let specs = updateAdDto.specifications;
        if (typeof specs === 'string') {
          try {
            specs = JSON.parse(specs);
          } catch (e) {
            throw new BadRequestException('Invalid specifications JSON');
          }
        }
        finalSpecs = await this.validateSpecifications(
          updateAdDto.subCategoryId || existingAd.subCategoryId,
          specs,
          true,
        );
      }

      // --- ৪. ডাটাবেজ আপডেট ---
      const { imagesToDelete, specifications, ...rest } = updateAdDto;

      const updatedAd = await this.prisma.ad.update({
        where: { id: adId },
        data: {
          ...rest,
          price: rest.price ? Number(rest.price) : undefined,
          latitude: rest.latitude ? Number(rest.latitude) : undefined,
          longitude: rest.longitude ? Number(rest.longitude) : undefined,
          showAddress:
            rest.showAddress !== undefined
              ? String(rest.showAddress) === 'true'
              : undefined,
          allowPhone:
            rest.allowPhone !== undefined
              ? String(rest.allowPhone) === 'true'
              : undefined,
          allowEmail:
            rest.allowEmail !== undefined
              ? String(rest.allowEmail) === 'true'
              : undefined,
          specifications: finalSpecs,
          images:
            newImageUrls.length > 0
              ? {
                  create: newImageUrls.map((url) => ({
                    url,
                    isPrimary: false,
                  })),
                }
              : undefined,
        },
        include: { images: true },
      });

      return {
        message: 'Ad updated successfully',
        success: true,
        data: updatedAd,
      };
    } catch (error) {
      console.error('UPDATE_ERROR:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Update failed');
    }
  }

  async getAllAds(query: any) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        isSold,
        categoryId,
        subCategoryId,
        sortByPrice,
      } = query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (isSold !== undefined && isSold !== '') {
        where.isSold = isSold === 'true';
      }

      if (search && search.trim() !== '') {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
          { category: { slug: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (
        categoryId &&
        categoryId !== 'all' &&
        categoryId !== 'undefined' &&
        categoryId !== ''
      ) {
        where.categoryId = categoryId;
      }
      console.log(categoryId);
      if (
        subCategoryId &&
        subCategoryId !== 'all' &&
        subCategoryId !== 'undefined' &&
        subCategoryId !== ''
      ) {
        where.subCategoryId = subCategoryId;
      }

      const orderBy: any = sortByPrice
        ? { price: sortByPrice as 'asc' | 'desc' }
        : { createdAt: 'desc' };

      const [total, ads] = await Promise.all([
        this.prisma.ad.count({ where }),
        this.prisma.ad.findMany({
          where,
          include: {
            images: true,
            category: true,
            seller: true,
          },
          orderBy,
          skip,
          take: Number(limit),
        }),
      ]);

      const totalPage = Math.ceil(total / Number(limit));

      return {
        success: true,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPage,
        },
        data: ads.map((ad) => this.transformAdData(ad)),
      };
    } catch (error: any) {
      console.error('Error fetching ads:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteAd(adId: string, sellerId: string) {
    try {
      const existingAd = await this.prisma.ad.findUnique({
        where: { id: adId },
      });

      if (!existingAd) throw new NotFoundException('Ad not found');
      if (existingAd.sellerId !== sellerId)
        throw new ForbiddenException('Not authorized');

      await this.prisma.$transaction(async (tx) => {
        await tx.ad.delete({ where: { id: adId } });
        const subscription = await tx.subscription.findUnique({
          where: { sellerId },
        });

        if (subscription) {
          const updatedUsedAdIds = subscription.usedAdIds.filter(
            (id) => id !== adId,
          );

          await tx.subscription.update({
            where: { sellerId },
            data: {
              usedAdIds: updatedUsedAdIds,
            },
          });
        }
      });

      return {
        message: 'Ad deleted successfully and slot freed',
        success: true,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Delete failed: ' + error.message);
    }
  }

  // --- GET SINGLE AD ---
  async getAdById(id: string) {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: { id },
        include: {
          images: true,
          category: true,
          subCategory: true,
          seller: {
            select: {
              id: true,
              nickName: true,
              profilePicture: true,
              email: true,
              phone: true,
              sellerProfile: true,
            },
          },
          buyer: {
            select: {
              nickName: true,
            },
          },
          comments: {
            where: { parentId: null }, // শুধুমাত্র মেইন কমেন্টগুলো আসবে
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                },
              },
              replies: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      profilePicture: true,
                    },
                  },
                },
                orderBy: { createdAt: 'asc' }, // রিপ্লাইগুলো পুরনো থেকে নতুন ক্রমে
              },
            },
            orderBy: { createdAt: 'desc' }, // কমেন্টগুলো নতুন থেকে পুরনো ক্রমে
          },
        },
      });

      if (!ad) {
        throw new NotFoundException('Ad not found or might have been deleted');
      }

      return {
        success: true,
        data: this.transformAdData(ad),
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      console.error(`[GetAdById Error]: ${error.message}`);
      throw new InternalServerErrorException(
        'An unexpected error occurred while fetching the ad',
      );
    }
  }

  async getAdsBySellerId(sellerId: string, query: any) {
    try {
      const { page = 1, limit = 10, isSold } = query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = { sellerId: sellerId };

      if (isSold !== undefined && isSold !== '') {
        where.isSold = isSold === 'true';
      }

      const [total, ads] = await Promise.all([
        this.prisma.ad.count({ where }),
        this.prisma.ad.findMany({
          where,
          include: {
            images: true,
            category: true,
            seller: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: Number(limit),
        }),
      ]);

      const totalPage = Math.ceil(total / Number(limit));

      return {
        success: true,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPage,
        },
        data: ads.map((ad) => this.transformAdData(ad)),
      };
    } catch (error: any) {
      console.error('Error fetching ads by seller:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async toggleSoldStatus(adId: string, sellerId: string) {
    // ১. অ্যাডটি খুঁজে দেখা
    const ad = await this.prisma.ad.findUnique({
      where: { id: adId },
      select: { id: true, sellerId: true, isSold: true },
    });

    if (!ad) throw new NotFoundException('Ad not found');
    if (ad.sellerId !== sellerId) {
      throw new ForbiddenException(
        'You are not authorized to mark this ad as sold.',
      );
    }
    const updatedAd = await this.prisma.ad.update({
      where: { id: adId },
      data: { isSold: !ad.isSold },
    });

    return {
      success: true,
      message: updatedAd.isSold
        ? 'Your item has been marked as Sold.'
        : 'Your item is now marked as Available.',
      data: {
        id: updatedAd.id,
        isSold: updatedAd.isSold,
      },
    };
  }

  async recordView(adId: string, userId: string) {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: { id: adId },
        select: { viewerIds: true },
      });

      if (!ad) throw new NotFoundException('Ad not found');

      if (!ad.viewerIds.includes(userId)) {
        await this.prisma.ad.update({
          where: { id: adId },
          data: {
            viewerIds: {
              push: userId,
            },
          },
        });
      }

      return { success: true, message: 'View recorded' };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error.message || 'Failed to record view',
      );
    }
  }

  async getAdViewers(adId: string, sellerId: string) {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: { id: adId },
        select: { sellerId: true, viewerIds: true },
      });

      if (!ad) throw new NotFoundException('Ad not found');

      if (ad.sellerId !== sellerId) {
        throw new ForbiddenException('You are not the owner of this ad');
      }

      // Viewer details fetch kora
      const viewers = await this.prisma.auth.findMany({
        where: { id: { in: ad.viewerIds } },
        select: {
          id: true,
          nickName: true,
          profilePicture: true,
          lastLogin: true,
        },
      });

      return {
        success: true,
        totalViews: ad.viewerIds.length,
        data: viewers,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        error.message || 'Failed to fetch viewers',
      );
    }
  }
}
