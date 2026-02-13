/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiConsumes,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Query, Post, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import {
  CreateCategoryDto, CreateSubCategoryDto, UpdateCategoryDto, UpdateSubCategoryDto,
} from './dto/categoryCrud.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Admin Categories & Sub-Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // --- SUB-CATEGORY ROUTES (Must be before general dynamic routes) ---

  @Get('sub-categories')
  @ApiOperation({ summary: 'Get all sub-categories' })
  async getAllSubCategories(@Query('page') page?: string, @Query('limit') limit?: string) {
    return await this.categoryService.getAllSubCategories(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Post('sub')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new sub-category' })
  async createSub(@Body() dto: CreateSubCategoryDto) {
    return await this.categoryService.createSubCategory(dto);
  }

  @Patch('sub/:subCategoryId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a sub-category' })
  async updateSub(@Param('subCategoryId') id: string, @Body() dto: UpdateSubCategoryDto) {
    return await this.categoryService.updateSubCategory(id, dto);
  }

  @Delete('sub/:subCategoryId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async removeSub(@Param('subCategoryId') id: string) {
    return await this.categoryService.deleteSubCategory(id);
  }

  @Get('sub-categories/:id')
  async getSingleSubCategory(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.categoryService.getSingleSubCategory(id);
  }

  // --- GENERAL CATEGORY ROUTES ---

  @Get()
  async findAll() {
    return await this.categoryService.getAllCategories();
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('image'))
  async createCat(@Body() dto: CreateCategoryDto, @UploadedFile() file: Express.Multer.File) {
    return await this.categoryService.createCategory(dto, file);
  }

  @Patch(':categoryId')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('image'))
  async updateCat(@Param('categoryId') id: string, @Body() dto: UpdateCategoryDto, @UploadedFile() file: Express.Multer.File) {
    return await this.categoryService.updateCategory(id, dto, file);
  }

  @Delete(':categoryId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async removeCat(@Param('categoryId') id: string) {
    return await this.categoryService.deleteCategory(id);
  }

  @Get(':categoryId')
  async findOne(@Param('categoryId') id: string) {
    return await this.categoryService.getSingleCategory(id);
  }
}
