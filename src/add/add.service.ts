/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  HttpException,
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

  // --- CREATE AD ---
  async createAd(
    sellerId: string,
    createAdDto: CreateAdDto,
    files: Express.Multer.File[],
  ) {
    try {
      if (!files || files.length === 0) {
        throw new HttpException('At least one image is required', 400);
      }

      const imageUrls = await this.cloudinary.uploadImages(files);

      const {
        categoryId,
        subCategoryId,
        price,
        latitude,
        longitude,
        showAddress,
        allowPhone,
        allowEmail,
        specifications,
        ...rest
      } = createAdDto;

      const categoryExists = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!categoryExists) throw new NotFoundException('Category not found');

      const newAd = await this.prisma.ad.create({
        data: {
          ...rest,
          price: price ? Number(price) : null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          showAddress: String(showAddress) === 'true',
          allowPhone: String(allowPhone) === 'true',
          allowEmail: String(allowEmail) === 'true',
          specifications:
            typeof specifications === 'string'
              ? JSON.parse(specifications)
              : specifications,
          categoryId,
          subCategoryId,
          sellerId,
          isSold: false,
          images: {
            create: imageUrls.map((url, index) => ({
              url: url,
              isPrimary: index === 0,
            })),
          },
        },
        include: { images: true },
      });

      return { message: 'Ad posted successfully.', success: true, data: newAd };
    } catch (error: any) {
      console.error('--- DEBUG: CREATE AD ERROR ---');
      console.error(error); // Terminal-e error details dekhabe

      if (error instanceof HttpException) throw error;
      // Detailed error message frontend-e pathabe debug korar jonno
      throw new InternalServerErrorException(
        error.message || 'Prisma/Database Error',
      );
    }
  }

  async updateAd(
    adId: string,
    sellerId: string,
    updateAdDto: UpdateAddDto,
    files?: Express.Multer.File[],
  ) {
    try {
      // 1. Existing Ad Check
      const existingAd = await this.prisma.ad.findUnique({
        where: { id: adId },
        include: { images: true },
      });

      if (!existingAd) throw new NotFoundException('Ad not found');
      if (existingAd.isSold)
        throw new ForbiddenException('Sold items cannot be updated!');
      if (existingAd.sellerId !== sellerId)
        throw new ForbiddenException('Not authorized');

      // Error fix korar jonno eivabe likho:
      if (updateAdDto.imagesToDelete) {
        let idsToDelete: string[] = [];

        // Type casting korlam jate TS error na dey
        const rawImagesToDelete = updateAdDto.imagesToDelete as any;

        if (Array.isArray(rawImagesToDelete)) {
          idsToDelete = rawImagesToDelete;
        } else if (typeof rawImagesToDelete === 'string') {
          idsToDelete = rawImagesToDelete.split(',').map((id) => id.trim());
        }

        if (idsToDelete.length > 0) {
          await this.prisma.adImage.deleteMany({
            where: { id: { in: idsToDelete }, adId: adId },
          });
        }
      }

      let newImageUrls: string[] = [];
      if (files && files.length > 0) {
        newImageUrls = await this.cloudinary.uploadImages(files);
      }

      const { imagesToDelete, ...updateData } = updateAdDto;

      const updatedAd = await this.prisma.ad.update({
        where: { id: adId },
        data: {
          ...updateData,
          // Multipart form theke asha data transform
          price: updateData.price ? Number(updateData.price) : undefined,
          latitude: updateData.latitude
            ? Number(updateData.latitude)
            : undefined,
          longitude: updateData.longitude
            ? Number(updateData.longitude)
            : undefined,

          showAddress:
            updateData.showAddress !== undefined
              ? String(updateData.showAddress) === 'true'
              : undefined,
          allowPhone:
            updateData.allowPhone !== undefined
              ? String(updateData.allowPhone) === 'true'
              : undefined,
          allowEmail:
            updateData.allowEmail !== undefined
              ? String(updateData.allowEmail) === 'true'
              : undefined,
          //   isSold:
          //     updateData.isSold !== undefined
          //       ? String(updateData.isSold) === 'true'
          //       : undefined,

          // JSON parsing for specifications

          specifications:
            typeof updateData.specifications === 'string'
              ? JSON.parse(updateData.specifications)
              : updateData.specifications,

          // New images add
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
    } catch (error: any) {
      console.error('--- DEBUG: UPDATE AD ERROR ---');
      console.error(error);

      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error.message || 'Update failed');
    }
  }

  async getAllAds(query: any) {
    try {
      const { page = 1, limit = 10, search, isSold, sortByPrice } = query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        ...(search && { title: { contains: search, mode: 'insensitive' } }),
        ...(isSold !== undefined && { isSold: isSold === 'true' }),
      };

      const [total, ads] = await Promise.all([
        this.prisma.ad.count({ where }),
        this.prisma.ad.findMany({
          where,
          include: {
            images: true,
            category: { select: { name: true } },
            seller: true,
          },
          orderBy: sortByPrice ? { price: sortByPrice } : { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
      ]);

      const filteredAds = ads.map((ad) => {
        const sellerInfo: any = {
          nickName: ad.seller.nickName,
          profilePicture: ad.seller.profilePicture,
        };

        sellerInfo.email = ad.allowEmail ? ad.seller.email : 'Private';
        sellerInfo.phone = ad.allowPhone ? ad.seller.phone : 'Private';

        const adItem: any = { ...ad };
        if (!ad.showAddress) {
          adItem.state = 'Private';
          adItem.city = 'Private';
          adItem.zipCode = '****';
          adItem.country = 'Private';
          adItem.latitude = null;
          adItem.longitude = null;
        }

        delete adItem.seller;
        return { ...adItem, seller: sellerInfo };
      });

      return {
        success: true,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
        data: filteredAds,
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
        },
      });

      if (!ad) throw new NotFoundException('Ad not found');

      const sellerInfo: any = {
        firstName: ad.seller.firstName,
        lastName: ad.seller.lastName,
        nickName: ad.seller.nickName,
        profilePicture: ad.seller.profilePicture,
      };

      sellerInfo.email = ad.allowEmail ? ad.seller.email : 'Private';
      sellerInfo.phone = ad.allowPhone ? ad.seller.phone : 'Private';

      // 2. Address Privacy Filter
      const adData: any = { ...ad };

      if (!ad.showAddress) {
        adData.state = 'Private';
        adData.city = 'Private';
        adData.zipCode = '****';
        adData.country = 'Private';
        adData.latitude = null;
        adData.longitude = null;
      }

      delete adData.seller; // Purano seller object delete

      return {
        success: true,
        data: {
          ...adData,
          seller: sellerInfo,
        },
      };
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
}
