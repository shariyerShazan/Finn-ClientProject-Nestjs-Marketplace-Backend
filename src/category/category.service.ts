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

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService ,  private readonly cloudinary: CloudinaryService,) {}

  async getAllCategories() {
    try {
      return await this.prisma.category.findMany({
        include: { subCategories: true },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('GetAllCategories Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong while fetching categories',
      );
    }
  }

  async getSingleCategory(id: string) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: { subCategories: true },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return category;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('GetSingleCategory Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong while fetching category',
      );
    }
  }


  async createCategory(dto: CreateCategoryDto, file?: Express.Multer.File) {
    try {
      const existingCategory = await this.prisma.category.findFirst({
        where: { slug: dto.slug },
      });

      if (existingCategory) {
        throw new ConflictException('Category slug already exists');
      }

      let imageUrl = dto.image; // Jodi link thake

      // Jodi file ashe, tobe upload koro
      if (file) {
        const uploadResult = await this.cloudinary.uploadImages([file]);
        imageUrl = uploadResult[0];
      }

      return await this.prisma.category.create({
        data: {
          ...dto,
          image: imageUrl,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('CreateCategory Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong while creating category',
      );
    }
  }

async updateCategory(
  id: string,
  dto: UpdateCategoryDto,
  file?: Express.Multer.File,
) {
  try {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    // 1. Handle Slug Logic
    if (dto.slug && dto.slug !== category.slug) {
      const slugExists = await this.prisma.category.findFirst({ where: { slug: dto.slug } });
      if (slugExists) throw new ConflictException('Category slug already exists');
    }

    // 2. Handle Image Logic correctly
    let imageUrl = category.image; // Keep old image by default
    if (file) {
      const uploadResult = await this.cloudinary.uploadImages([file]);
      imageUrl = uploadResult[0];
    } else if (dto.image) {
      imageUrl = dto.image; // If a URL was passed manually
    }

    // 3. Clean the DTO to prevent accidental overwrites
    // Remove the image from DTO so it doesn't conflict with our imageUrl variable
    const { image, ...updateData } = dto;

    return await this.prisma.category.update({
      where: { id },
      data: {
        ...updateData,
        image: imageUrl,
      },
    });
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throw new InternalServerErrorException('Update failed');
  }
}

  async deleteCategory(id: string) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      return await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('DeleteCategory Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong while deleting category',
      );
    }
  }

  async createSubCategory(dto: CreateSubCategoryDto) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) throw new BadRequestException('Invalid categoryId');

      const existingSubCategory = await this.prisma.subCategory.findFirst({
        where: { slug: dto.slug },
      });
      if (existingSubCategory)
        throw new ConflictException('Sub-category slug already exists');

      if (dto.specFields && Array.isArray(dto.specFields)) {
        for (const field of dto.specFields) {
          if (
            field.type === 'select' &&
            (!field.options || field.options.length === 0)
          ) {
            throw new BadRequestException(
              `Field "${field.label}" is a select type but has no options.`,
            );
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
      console.error('CreateSubCategory Error:', error);
      throw new InternalServerErrorException('Something went wrong');
    }
  }


async updateSubCategory(id: string, dto: UpdateSubCategoryDto) {
  try {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id },
    });
    if (!subCategory) throw new NotFoundException('Sub-category not found');

    let finalSpecFields = undefined;

    // Handle both String (FormData) and Object (JSON) incoming data
    if (dto.specFields) {
      if (typeof dto.specFields === 'string') {
        try {
          finalSpecFields = JSON.parse(dto.specFields);
        } catch (e) {
          throw new BadRequestException('specFields is not valid JSON');
        }
      } else {
        finalSpecFields = dto.specFields;
      }
    }

    return await this.prisma.subCategory.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        slug: dto.slug ?? undefined,
        categoryId: dto.categoryId ?? undefined,
        // The Fix for TS2322: cast to any to satisfy Prisma's internal Json types
        specFields: finalSpecFields !== undefined ? (finalSpecFields as any) : undefined,
      },
    });
  } catch (error) {
    if (error instanceof HttpException) throw error;
    console.error('UpdateSubCategory Error:', error);
    throw new InternalServerErrorException('Failed to update sub-category');
  }
}
  
  async deleteSubCategory(id: string) {
    try {
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id },
      });

      if (!subCategory) {
        throw new NotFoundException('Sub-category not found');
      }

      return await this.prisma.subCategory.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('DeleteSubCategory Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong while deleting sub-category',
      );
    }
  }

// Service file-er ei method-ta replace korun:
async getAllSubCategories(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.prisma.subCategory.findMany({
      skip,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    this.prisma.subCategory.count(),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
  };
}

  async getSingleSubCategory(id: string) {
    try {
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { ads: true } },
        },
      });

      if (!subCategory) {
        throw new NotFoundException('Sub-category not found');
      }

      return subCategory;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('GetSingleSubCategory Error:', error);
      throw new InternalServerErrorException(
        'Failed to fetch sub-category details',
      );
    }
  }
}
