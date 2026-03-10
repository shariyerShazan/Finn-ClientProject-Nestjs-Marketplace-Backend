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
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class AddService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly translationService: TranslationService, // ইনজেক্ট করা হলো
  ) {}

  private transformAdData(ad: any) {
    const { seller, buyer, ...adData } = ad;

    // Seller Info Filter
    const sellerInfo = {
      id: seller?.id,
      nickName: seller?.nickName,
      profilePicture: seller?.profilePicture,
      email: ad.allowEmail ? seller?.email : 'Private',
      phone: ad.allowPhone ? seller?.phone : 'Private',
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
    lang: string,
    isUpdate = false,
  ) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });

    if (!subCategory) {
      const msg = await this.translationService.translate(
        'Sub-category not found',
        lang,
      );
      throw new NotFoundException(msg);
    }

    const adminSpecs = (subCategory.specFields as any[]) || [];
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
          const msg = await this.translationService.translate(
            `Field "${field.label}" is required.`,
            lang,
          );
          throw new BadRequestException(msg);
        }
      }
      if (value !== undefined) validatedData[field.key] = value;
    }
    return validatedData;
  }

  async createAd(
    sellerId: string,
    createAdDto: CreateAdDto,
    files: any,
    lang: string = 'en',
  ) {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException(
          await this.translationService.translate('Images are required', lang),
        );
      }

      const subscription = await this.prisma.subscription.findUnique({
        where: { sellerId },
      });

      if (!subscription || subscription.status !== 'ACTIVE') {
        throw new BadRequestException(
          await this.translationService.translate(
            'No active subscription plan found.',
            lang,
          ),
        );
      }

      if (subscription.usedAdIds.length >= subscription.totalLimit) {
        throw new BadRequestException(
          await this.translationService.translate('Ad limit reached.', lang),
        );
      }

      const price = Number(createAdDto.price);
      const lat = createAdDto.latitude ? Number(createAdDto.latitude) : null;
      const lng = createAdDto.longitude ? Number(createAdDto.longitude) : null;

      let specs = createAdDto.specifications;
      if (typeof specs === 'string') {
        try {
          specs = JSON.parse(specs);
        } catch (e) {
          throw new BadRequestException(
            await this.translationService.translate(
              'Invalid JSON in specifications',
              lang,
            ),
          );
        }
      }

      const validatedSpecs = await this.validateSpecifications(
        createAdDto.subCategoryId,
        specs,
        lang,
      );

      const imageUrls = await this.cloudinary.uploadImages(files);

      const result = await this.prisma.$transaction(async (tx) => {
        const newAd = await tx.ad.create({
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
            showAddress: createAdDto.showAddress === 'true',
            allowPhone: createAdDto.allowPhone === 'true',
            allowEmail: createAdDto.allowEmail === 'true',
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

        await tx.subscription.update({
          where: { sellerId },
          data: { usedAdIds: { push: newAd.id } },
        });

        return newAd;
      });

      return {
        newAdd: result,
        success: true,
        message: await this.translationService.translate(
          'Ad created successfully',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateAd(
    adId: string,
    sellerId: string,
    updateAdDto: UpdateAddDto,
    files?: Express.Multer.File[],
    lang: string = 'en',
  ) {
    try {
      const existingAd = await this.prisma.ad.findUnique({
        where: { id: adId },
        include: { images: true },
      });

      if (!existingAd)
        throw new NotFoundException(
          await this.translationService.translate('Ad not found', lang),
        );
      if (existingAd.sellerId !== sellerId)
        throw new ForbiddenException(
          await this.translationService.translate('Not authorized', lang),
        );

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

      const newImageCount = files?.length || 0;
      if (imagesRemainingCount + newImageCount === 0) {
        throw new BadRequestException(
          await this.translationService.translate(
            'At least one image is required for an ad.',
            lang,
          ),
        );
      }

      let newImageUrls: string[] = [];
      if (newImageCount > 0)
        newImageUrls = await this.cloudinary.uploadImages(files as any);

      let finalSpecs: any = undefined;
      if (updateAdDto.specifications) {
        let specs = updateAdDto.specifications;
        if (typeof specs === 'string') {
          try {
            specs = JSON.parse(specs);
          } catch (e) {
            throw new BadRequestException(
              await this.translationService.translate(
                'Invalid specifications JSON',
                lang,
              ),
            );
          }
        }
        finalSpecs = await this.validateSpecifications(
          updateAdDto.subCategoryId || existingAd.subCategoryId,
          specs,
          lang,
          true,
        );
      }

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
        message: await this.translationService.translate(
          'Ad updated successfully',
          lang,
        ),
        success: true,
        data: updatedAd,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate('Update failed', lang),
      );
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
        lang = 'en',
      } = query;
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (isSold !== undefined && isSold !== '')
        where.isSold = isSold === 'true';

      if (search && search.trim() !== '') {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (
        categoryId &&
        categoryId !== 'all' &&
        categoryId !== 'undefined' &&
        categoryId !== ''
      )
        where.categoryId = categoryId;
      if (
        subCategoryId &&
        subCategoryId !== 'all' &&
        subCategoryId !== 'undefined' &&
        subCategoryId !== ''
      )
        where.subCategoryId = subCategoryId;

      const orderBy: any = sortByPrice
        ? { price: sortByPrice as 'asc' | 'desc' }
        : { createdAt: 'desc' };

      const [total, ads] = await Promise.all([
        this.prisma.ad.count({ where }),
        this.prisma.ad.findMany({
          where,
          include: { images: true, category: true, seller: true },
          orderBy,
          skip,
          take: Number(limit),
        }),
      ]);

      // ট্রান্সলেশন: টাইটেল এবং ডেসক্রিপশন
      const translatedAds = await this.translationService.translateData(
        ads,
        ['title', 'description'],
        lang,
      );

      return {
        success: true,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPage: Math.ceil(total / Number(limit)),
        },
        data: translatedAds.map((ad) => this.transformAdData(ad)),
      };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteAd(adId: string, sellerId: string, lang: string = 'en') {
    try {
      const existingAd = await this.prisma.ad.findUnique({
        where: { id: adId },
      });
      if (!existingAd)
        throw new NotFoundException(
          await this.translationService.translate('Ad not found', lang),
        );
      if (existingAd.sellerId !== sellerId)
        throw new ForbiddenException(
          await this.translationService.translate('Not authorized', lang),
        );

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
            data: { usedAdIds: updatedUsedAdIds },
          });
        }
      });

      return {
        message: await this.translationService.translate(
          'Ad deleted successfully and slot freed',
          lang,
        ),
        success: true,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate('Delete failed', lang),
      );
    }
  }

  async getAdById(id: string, lang: string = 'en') {
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
          buyer: { select: { nickName: true } },
          comments: {
            where: { parentId: null },
            include: {
              user: {
                select: { id: true, firstName: true, profilePicture: true },
              },
              replies: {
                include: {
                  user: {
                    select: { id: true, firstName: true, profilePicture: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!ad)
        throw new NotFoundException(
          await this.translationService.translate(
            'Ad not found or might have been deleted',
            lang,
          ),
        );

      const translatedAd = await this.translationService.translateData(
        ad,
        ['title', 'description'],
        lang,
      );

      return {
        success: true,
        data: this.transformAdData(translatedAd),
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'An unexpected error occurred',
          lang,
        ),
      );
    }
  }

  async toggleSoldStatus(adId: string, sellerId: string, lang: string = 'en') {
    const ad = await this.prisma.ad.findUnique({
      where: { id: adId },
      select: { id: true, sellerId: true, isSold: true },
    });

    if (!ad)
      throw new NotFoundException(
        await this.translationService.translate('Ad not found', lang),
      );
    if (ad.sellerId !== sellerId)
      throw new ForbiddenException(
        await this.translationService.translate('Not authorized', lang),
      );

    const updatedAd = await this.prisma.ad.update({
      where: { id: adId },
      data: { isSold: !ad.isSold },
    });

    const successMsg = updatedAd.isSold
      ? 'Your item has been marked as Sold.'
      : 'Your item is now marked as Available.';

    return {
      success: true,
      message: await this.translationService.translate(successMsg, lang),
      data: { id: updatedAd.id, isSold: updatedAd.isSold },
    };
  }

  // --- RECORD VIEW (ট্রান্সলেশন সহ) ---
  async recordView(adId: string, userId: string, lang: string = 'en') {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: { id: adId },
        select: { viewerIds: true },
      });

      if (!ad) {
        throw new NotFoundException(
          await this.translationService.translate('Ad not found', lang),
        );
      }

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

      return {
        success: true,
        message: await this.translationService.translate('View recorded', lang),
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          error.message || 'Failed to record view',
          lang,
        ),
      );
    }
  }

  // --- GET AD VIEWERS (সেলার চেক এবং ট্রান্সলেশন সহ) ---
  async getAdViewers(adId: string, sellerId: string, lang: string = 'en') {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: { id: adId },
        select: { sellerId: true, viewerIds: true },
      });

      if (!ad) {
        throw new NotFoundException(
          await this.translationService.translate('Ad not found', lang),
        );
      }

      if (ad.sellerId !== sellerId) {
        throw new ForbiddenException(
          await this.translationService.translate(
            'You are not the owner of this ad',
            lang,
          ),
        );
      }

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
        await this.translationService.translate(
          error.message || 'Failed to fetch viewers',
          lang,
        ),
      );
    }
  }

  // --- GET ADS BY SELLER ID (লিস্ট ট্রান্সলেশন সহ) ---
  async getAdsBySellerId(sellerId: string, query: any) {
    try {
      const { page = 1, limit = 10, isSold, lang = 'en' } = query;
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

      // টাইটেল এবং ডেসক্রিপশন ট্রান্সলেশন
      const translatedAds = await this.translationService.translateData(
        ads,
        ['title', 'description'],
        lang,
      );

      return {
        success: true,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPage: Math.ceil(total / Number(limit)),
        },
        data: translatedAds.map((ad) => this.transformAdData(ad)),
      };
    } catch (error: any) {
      console.error('Error fetching ads by seller:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
