/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-prototype-builtins */
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
        if (
          isUpdate &&
          sellerSpecs.hasOwnProperty(field.key) &&
          (value === null || value === '')
        ) {
          throw new BadRequestException(
            `Field "${field.label}" cannot be empty.`,
          );
        }
      }

      if (value !== undefined) {
        validatedData[field.key] = value;
      }
    }

    return validatedData;
  }

  async createAd(
    sellerId: string,
    createAdDto: CreateAdDto,
    files: Express.Multer.File[],
  ) {
    try {
      if (!files || files.length === 0)
        throw new BadRequestException('At least one image is required');

      const specifications = await this.validateSpecifications(
        createAdDto.subCategoryId,
        createAdDto.specifications,
      );

      const imageUrls = await this.cloudinary.uploadImages(files);
      const { categoryId, subCategoryId, ...rest } = createAdDto;

      const newAd = await this.prisma.ad.create({
        data: {
          ...rest,
          price: rest.price ? Number(rest.price) : null,
          latitude: rest.latitude ? Number(rest.latitude) : null,
          longitude: rest.longitude ? Number(rest.longitude) : null,
          showAddress: String(rest.showAddress) === 'true',
          allowPhone: String(rest.allowPhone) === 'true',
          allowEmail: String(rest.allowEmail) === 'true',
          specifications,
          categoryId,
          subCategoryId,
          sellerId,
          images: {
            create: imageUrls.map((url, index) => ({
              url,
              isPrimary: index === 0,
            })),
          },
        },
        include: { images: true },
      });

      return { message: 'Ad posted successfully.', success: true, data: newAd };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Create failed');
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
      });
      if (!existingAd) throw new NotFoundException('Ad not found');
      if (existingAd.sellerId !== sellerId)
        throw new ForbiddenException('Not authorized');

      if (updateAdDto.imagesToDelete) {
        const idsToDelete = Array.isArray(updateAdDto.imagesToDelete)
          ? updateAdDto.imagesToDelete
          : (updateAdDto.imagesToDelete as string).split(',');
        await this.prisma.adImage.deleteMany({
          where: { id: { in: idsToDelete }, adId },
        });
      }

      let finalSpecs: any = undefined;
      if (updateAdDto.specifications) {
        finalSpecs = await this.validateSpecifications(
          updateAdDto.subCategoryId || existingAd.subCategoryId,
          updateAdDto.specifications,
          true,
        );
      }

      if (!files || files?.length === 0) {
        throw new BadRequestException('At least one image is required');
      }
      let newImageUrls: string[] = [];
      if (files?.length > 0)
        newImageUrls = await this.cloudinary.uploadImages(files);

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
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Update failed');
    }
  }

  async getAllAds(query: any) {
    try {
      const { page = 1, limit = 10, search, isSold, categoryId } = query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        ...(search && { title: { contains: search, mode: 'insensitive' } }),
        ...(isSold !== undefined && { isSold: isSold === 'true' }),
        ...(categoryId && { categoryId }),
      };

      const [total, ads] = await Promise.all([
        this.prisma.ad.count({ where }),
        this.prisma.ad.findMany({
          where,
          include: { images: true, category: true, seller: true, buyer: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
      ]);

      return {
        success: true,
        meta: { total, page: Number(page), limit: Number(limit) },
        data: ads.map((ad) => this.transformAdData(ad)),
      };
    } catch (error: any) {
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

      await this.prisma.ad.delete({ where: { id: adId } });
      return { message: 'Ad deleted successfully', success: true };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Delete failed');
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
          seller: true,
          buyer: true,
        },
      });

      if (!ad) throw new NotFoundException('Ad not found');
      return { success: true, data: this.transformAdData(ad) };
    } catch (error: any) {
      console.error('--- DEBUG: GET AD ERROR ---');
      console.error(error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async toggleSoldStatus(adId: string, sellerId: string) {
    const ad = await this.prisma.ad.findUnique({ where: { id: adId } });

    if (!ad) throw new NotFoundException('Ad not found');
    if (ad.sellerId !== sellerId)
      throw new ForbiddenException('Not authorized');

    // Toggle logic: jodi true thake false hobe, false thakle true hobe
    const updatedAd = await this.prisma.ad.update({
      where: { id: adId },
      data: { isSold: !ad.isSold },
    });

    const statusMessage = updatedAd.isSold
      ? 'Item marked as sold'
      : 'Item marked as available';

    return {
      message: statusMessage,
      success: true,
      //   data: updatedAd,
    };
  }

  async recordView(adId: string, userId: string) {
    try {
      const ad = await this.prisma.ad.findUnique({
        where: { id: adId },
        select: { viewerIds: true },
      });

      if (!ad) throw new NotFoundException('Ad not found');

      // Check jodi user agei dekhe thake (Unique view logic)
      if (!ad.viewerIds.includes(userId)) {
        await this.prisma.ad.update({
          where: { id: adId },
          data: {
            viewerIds: {
              push: userId, // Array-te user ID-ta dhukay dibe
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

      // Shudhu seller tar ad-er viewer list dekhte parbe
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
