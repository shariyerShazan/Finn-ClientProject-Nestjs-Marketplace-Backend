/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateCategoryDto,
  CreateSubCategoryDto,
  UpdateCategoryDto,
  UpdateSubCategoryDto,
} from 'src/category/dto/categoryCrud.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly translationService: TranslationService,
  ) {}

  // --- Category Methods ---

  async getAllCategories(
    page: number = 1,
    limit: number = 10,
    search?: string,
    lang: string = 'en',
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: any = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [data, total] = await Promise.all([
        this.prisma.category.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            _count: { select: { subCategories: true } },
            subCategories: true,
          },
        }),
        this.prisma.category.count({ where }),
      ]);

      // Translate category names and nested subcategory names
      const translatedData = await this.translationService.translateData(
        data,
        ['name'],
        lang,
      );

      return {
        success: true,
        data: translatedData,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPage: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMsg = await this.translationService.translate(
        'Something went wrong while fetching categories',
        lang,
      );
      throw new InternalServerErrorException(errorMsg);
    }
  }

  async getSingleCategory(id: string, lang: string = 'en') {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: { subCategories: true },
      });

      if (!category) {
        const msg = await this.translationService.translate(
          'Category not found',
          lang,
        );
        throw new NotFoundException(msg);
      }

      return await this.translationService.translateData(
        category,
        ['name'],
        lang,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMsg = await this.translationService.translate(
        'Something went wrong while fetching category',
        lang,
      );
      throw new InternalServerErrorException(errorMsg);
    }
  }

  async createCategory(
    dto: CreateCategoryDto,
    file?: Express.Multer.File,
    lang: string = 'en',
  ) {
    try {
      const existingCategory = await this.prisma.category.findFirst({
        where: { slug: dto.slug },
      });

      if (existingCategory) {
        const msg = await this.translationService.translate(
          'Category slug already exists',
          lang,
        );
        throw new ConflictException(msg);
      }

      let imageUrl = dto.image;
      if (file) {
        const uploadResult = await this.cloudinary.uploadImages([file]);
        imageUrl = uploadResult[0];
      }

      return await this.prisma.category.create({
        data: { ...dto, image: imageUrl },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMsg = await this.translationService.translate(
        'Something went wrong while creating category',
        lang,
      );
      throw new InternalServerErrorException(errorMsg);
    }
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
    file?: Express.Multer.File,
    lang: string = 'en',
  ) {
    try {
      const category = await this.prisma.category.findUnique({ where: { id } });
      if (!category) {
        const msg = await this.translationService.translate(
          'Category not found',
          lang,
        );
        throw new NotFoundException(msg);
      }

      if (dto.slug && dto.slug !== category.slug) {
        const slugExists = await this.prisma.category.findFirst({
          where: { slug: dto.slug },
        });
        if (slugExists) {
          const msg = await this.translationService.translate(
            'Category slug already exists',
            lang,
          );
          throw new ConflictException(msg);
        }
      }

      let imageUrl = category.image;
      if (file) {
        const uploadResult = await this.cloudinary.uploadImages([file]);
        imageUrl = uploadResult[0];
      } else if (dto.image) {
        imageUrl = dto.image;
      }

      const { image, ...updateData } = dto;

      return await this.prisma.category.update({
        where: { id },
        data: { ...updateData, image: imageUrl },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMsg = await this.translationService.translate(
        'Update failed',
        lang,
      );
      throw new InternalServerErrorException(errorMsg);
    }
  }

  async deleteCategory(id: string, lang: string = 'en') {
    try {
      const category = await this.prisma.category.findUnique({ where: { id } });
      if (!category) {
        const msg = await this.translationService.translate(
          'Category not found',
          lang,
        );
        throw new NotFoundException(msg);
      }

      await this.prisma.category.delete({ where: { id } });
      return {
        message: await this.translationService.translate(
          'Category deleted successfully',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMsg = await this.translationService.translate(
        'Something went wrong while deleting category',
        lang,
      );
      throw new InternalServerErrorException(errorMsg);
    }
  }

  // --- Sub-Category Methods ---

  async createSubCategory(dto: CreateSubCategoryDto, lang: string = 'en') {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        const msg = await this.translationService.translate(
          'Invalid categoryId',
          lang,
        );
        throw new BadRequestException(msg);
      }

      const existingSubCategory = await this.prisma.subCategory.findFirst({
        where: { slug: dto.slug },
      });
      if (existingSubCategory) {
        const msg = await this.translationService.translate(
          'Sub-category slug already exists',
          lang,
        );
        throw new ConflictException(msg);
      }

      if (dto.specFields && Array.isArray(dto.specFields)) {
        for (const field of dto.specFields) {
          if (
            field.type === 'select' &&
            (!field.options || field.options.length === 0)
          ) {
            const msg = await this.translationService.translate(
              `Field "${field.label}" is a select type but has no options.`,
              lang,
            );
            throw new BadRequestException(msg);
          }
        }
      }

      return await this.prisma.subCategory.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          categoryId: dto.categoryId,
          specFields: dto.specFields
            ? JSON.parse(JSON.stringify(dto.specFields))
            : [],
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMsg = await this.translationService.translate(
        'Something went wrong',
        lang,
      );
      throw new InternalServerErrorException(errorMsg);
    }
  }

  async updateSubCategory(
    id: string,
    dto: UpdateSubCategoryDto,
    lang: string = 'en',
  ) {
    try {
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id },
      });
      if (!subCategory) {
        const msg = await this.translationService.translate(
          'Sub-category not found',
          lang,
        );
        throw new NotFoundException(msg);
      }

      if (dto.slug && dto.slug !== subCategory.slug) {
        const slugExists = await this.prisma.subCategory.findFirst({
          where: { slug: dto.slug },
        });
        if (slugExists) {
          const msg = await this.translationService.translate(
            'Sub-category slug already exists',
            lang,
          );
          throw new ConflictException(msg);
        }
      }

      let finalSpecFields: any = undefined;
      if (dto.specFields) {
        finalSpecFields =
          typeof dto.specFields === 'string'
            ? JSON.parse(dto.specFields)
            : dto.specFields;

        if (Array.isArray(finalSpecFields)) {
          for (const field of finalSpecFields) {
            if (
              field.type === 'select' &&
              (!field.options || field.options.length === 0)
            ) {
              const msg = await this.translationService.translate(
                `Field "${field.label}" is a select type but has no options.`,
                lang,
              );
              throw new BadRequestException(msg);
            }
          }
        }
      }

      const updateData: any = {};
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.slug !== undefined) updateData.slug = dto.slug;
      if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
      if (finalSpecFields !== undefined)
        updateData.specFields = finalSpecFields;

      return await this.prisma.subCategory.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMsg = await this.translationService.translate(
        'Failed to update sub-category',
        lang,
      );
      throw new InternalServerErrorException(errorMsg);
    }
  }

  async deleteSubCategory(id: string, lang: string = 'en') {
    try {
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id },
      });
      if (!subCategory) {
        const msg = await this.translationService.translate(
          'Sub-category not found',
          lang,
        );
        throw new NotFoundException(msg);
      }

      await this.prisma.subCategory.delete({ where: { id } });
      return {
        message: await this.translationService.translate(
          'Sub-category deleted successfully',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMsg = await this.translationService.translate(
        'Something went wrong while deleting sub-category',
        lang,
      );
      throw new InternalServerErrorException(errorMsg);
    }
  }

  async getAllSubCategories(
    page: number = 1,
    limit: number = 10,
    lang: string = 'en',
  ) {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.subCategory.findMany({
          skip,
          take: Number(limit),
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        }),
        this.prisma.subCategory.count(),
      ]);

      const translatedData = await this.translationService.translateData(
        data,
        ['name'],
        lang,
      );

      return {
        success: true,
        data: translatedData,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPage: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      const errorMsg = await this.translationService.translate(
        'Failed to fetch sub-categories',
        lang,
      );
      throw new InternalServerErrorException(errorMsg);
    }
  }

  async getSingleSubCategory(id: string, lang: string = 'en') {
    try {
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { ads: true } },
        },
      });

      if (!subCategory) {
        const msg = await this.translationService.translate(
          'Sub-category not found',
          lang,
        );
        throw new NotFoundException(msg);
      }

      return await this.translationService.translateData(
        subCategory,
        ['name'],
        lang,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMsg = await this.translationService.translate(
        'Failed to fetch sub-category details',
        lang,
      );
      throw new InternalServerErrorException(errorMsg);
    }
  }
}
