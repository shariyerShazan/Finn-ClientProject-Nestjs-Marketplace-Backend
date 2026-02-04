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

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

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

  async createCategory(dto: CreateCategoryDto) {
    try {
      const existingCategory = await this.prisma.category.findFirst({
        where: { slug: dto.slug },
      });

      if (existingCategory) {
        throw new ConflictException('Category slug already exists');
      }

      return await this.prisma.category.create({
        data: dto,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('CreateCategory Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong while creating category',
      );
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (dto.slug && dto.slug !== category.slug) {
        const slugExists = await this.prisma.category.findFirst({
          where: { slug: dto.slug },
        });

        if (slugExists) {
          throw new ConflictException('Category slug already exists');
        }
      }

      return await this.prisma.category.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('UpdateCategory Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong while updating category',
      );
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

      if (dto.categoryId) {
        const category = await this.prisma.category.findUnique({
          where: { id: dto.categoryId },
        });
        if (!category)
          throw new BadRequestException(
            'The provided parent Category ID is invalid',
          );
      }

      if (dto.slug && dto.slug !== subCategory.slug) {
        const slugExists = await this.prisma.subCategory.findFirst({
          where: { slug: dto.slug },
        });
        if (slugExists)
          throw new ConflictException(
            'This sub-category slug is already in use',
          );
      }

      if (dto.specFields && Array.isArray(dto.specFields)) {
        for (const field of dto.specFields) {
          if (
            field.type === 'select' &&
            (!field.options || field.options.length === 0)
          ) {
            throw new BadRequestException(
              `Field "${field.label}" requires options for select type.`,
            );
          }
        }
      }

      return await this.prisma.subCategory.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          categoryId: dto.categoryId,
          specFields: dto.specFields
            ? JSON.parse(JSON.stringify(dto.specFields))
            : undefined,
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

  async getAllSubCategories() {
    try {
      return await this.prisma.subCategory.findMany({
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('GetAllSubCategories Error:', error);
      throw new InternalServerErrorException('Failed to fetch sub-categories');
    }
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
