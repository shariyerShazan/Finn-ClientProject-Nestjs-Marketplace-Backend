/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CreateCategoryDto,
  CreateSubCategoryDto,
  UpdateCategoryDto,
  UpdateSubCategoryDto,
} from './dto/categoryCrud.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Admin Categories & Sub-Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories with their sub-categories' })
  async findAll() {
    return await this.categoryService.getAllCategories();
  }

  @Get(':categoryId')
  @ApiOperation({ summary: 'Get a single category by ID' })
  @ApiParam({
    name: 'categoryId',
    description: 'The unique ID of the category',
  })
  async findOne(@Param('categoryId') categoryId: string) {
    return await this.categoryService.getSingleCategory(categoryId);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  async createCat(@Body() dto: CreateCategoryDto) {
    return await this.categoryService.createCategory(dto);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':categoryId')
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiParam({
    name: 'categoryId',
    description: 'The ID of the category to update',
  })
  async updateCat(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return await this.categoryService.updateCategory(categoryId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':categoryId')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({
    name: 'categoryId',
    description: 'The ID of the category to delete',
  })
  async removeCat(@Param('categoryId') categoryId: string) {
    return await this.categoryService.deleteCategory(categoryId);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('sub')
  @ApiOperation({ summary: 'Create a new sub-category under a category' })
  async createSub(@Body() dto: CreateSubCategoryDto) {
    return await this.categoryService.createSubCategory(dto);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('sub/:subCategoryId')
  @ApiOperation({ summary: 'Update a sub-category' })
  @ApiParam({
    name: 'subCategoryId',
    description: 'The ID of the sub-category to update',
  })
  async updateSub(
    @Param('subCategoryId') subCategoryId: string,
    @Body() dto: UpdateSubCategoryDto,
  ) {
    return await this.categoryService.updateSubCategory(subCategoryId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('sub/:subCategoryId')
  @ApiOperation({ summary: 'Delete a sub-category' })
  @ApiParam({
    name: 'subCategoryId',
    description: 'The ID of the sub-category to delete',
  })
  async removeSub(@Param('subCategoryId') subCategoryId: string) {
    return await this.categoryService.deleteSubCategory(subCategoryId);
  }
}
