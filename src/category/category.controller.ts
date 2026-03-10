/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
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
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Admin Categories & Sub-Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // --- SUB-CATEGORY ROUTES ---

  @Get('sub-categories')
  @ApiOperation({ summary: 'Get all sub-categories' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '10' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
    description: 'Language preference',
  })
  async getAllSubCategories(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('lang') lang: string = 'en',
  ) {
    return await this.categoryService.getAllSubCategories(
      Number(page),
      Number(limit),
      lang,
    );
  }

  @Post('sub')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new sub-category' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async createSub(
    @Body() dto: CreateSubCategoryDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.categoryService.createSubCategory(dto, lang);
  }

  @Patch('sub/:subCategoryId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a sub-category' })
  @ApiParam({ name: 'subCategoryId', description: 'ID of the sub-category' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async updateSub(
    @Param('subCategoryId') id: string,
    @Body() dto: UpdateSubCategoryDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.categoryService.updateSubCategory(id, dto, lang);
  }

  @Delete('sub/:subCategoryId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a sub-category' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async removeSub(
    @Param('subCategoryId') id: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.categoryService.deleteSubCategory(id, lang);
  }

  @Get('sub-categories/:id')
  @ApiOperation({ summary: 'Get single sub-category details' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getSingleSubCategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.categoryService.getSingleSubCategory(id, lang);
  }

  // --- GENERAL CATEGORY ROUTES ---

  @Get()
  @ApiOperation({ summary: 'Get all categories with translation' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: String,
    description: 'Default is 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
    description: 'Default is 10',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name or slug',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
    description: 'Language code',
  })
  async getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('lang') lang: string = 'en',
  ) {
    return this.categoryService.getAllCategories(
      Number(page),
      Number(limit),
      search,
      lang,
    );
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new category' })
  @UseInterceptors(FileInterceptor('image'))
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async createCat(
    @Body() dto: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.categoryService.createCategory(dto, file, lang);
  }

  @Patch(':categoryId')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a category' })
  @UseInterceptors(FileInterceptor('image'))
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async updateCat(
    @Param('categoryId') id: string,
    @Body() dto: UpdateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.categoryService.updateCategory(id, dto, file, lang);
  }

  @Delete(':categoryId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async removeCat(
    @Param('categoryId') id: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.categoryService.deleteCategory(id, lang);
  }

  @Get(':categoryId')
  @ApiOperation({ summary: 'Get single category details' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async findOne(
    @Param('categoryId') id: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.categoryService.getSingleCategory(id, lang);
  }
}
