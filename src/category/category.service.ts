/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

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

      if (!category) {
        throw new BadRequestException('Invalid categoryId');
      }

      const existingSubCategory = await this.prisma.subCategory.findFirst({
        where: { slug: dto.slug },
      });

      if (existingSubCategory) {
        throw new ConflictException('Sub-category slug already exists');
      }

      return await this.prisma.subCategory.create({
        data: dto,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('CreateSubCategory Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong while creating sub-category',
      );
    }
  }

  async updateSubCategory(id: string, dto: UpdateSubCategoryDto) {
    try {
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id },
      });

      if (!subCategory) {
        throw new NotFoundException('Sub-category not found');
      }

      if (dto.categoryId) {
        const category = await this.prisma.category.findUnique({
          where: { id: dto.categoryId },
        });

        if (!category) {
          throw new BadRequestException('Invalid categoryId');
        }
      }

      if (dto.slug && dto.slug !== subCategory.slug) {
        const slugExists = await this.prisma.subCategory.findFirst({
          where: { slug: dto.slug },
        });

        if (slugExists) {
          throw new ConflictException('Sub-category slug already exists');
        }
      }

      return await this.prisma.subCategory.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('UpdateSubCategory Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong while updating sub-category',
      );
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
}
