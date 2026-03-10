/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  Body,
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AddService } from './add.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateAdDto, UpdateAddDto } from './dto/CreateAdDto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SellerGuard } from 'src/auth/guards/seller.guard';
import { SubscriptionGuard } from 'src/auth/guards/subscription.guard';

@ApiTags('Seller Ads Management')
@Controller('ads')
export class AddController {
  constructor(private readonly addService: AddService) {}

  @Get()
  @ApiOperation({ summary: 'Get all ads with filters and translation' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Ads per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by title',
  })
  @ApiQuery({
    name: 'isSold',
    required: false,
    type: String,
    enum: ['true', 'false'],
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by Category ID',
  }) // Required False
  @ApiQuery({
    name: 'subCategoryId',
    required: false,
    type: String,
    description: 'Filter by Sub-Category ID',
  }) // Required False
  @ApiQuery({ name: 'sortByPrice', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
    description: 'Language code',
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isSold') isSold?: string,
    @Query('sortByPrice') sortByPrice?: 'asc' | 'desc',
    @Query('categoryId') categoryId?: string,
    @Query('subCategoryId') subCategoryId?: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.addService.getAllAds({
      page,
      limit,
      search,
      isSold,
      sortByPrice,
      categoryId,
      subCategoryId,
      lang, // সার্ভিস-এ পাস করা হলো
    });
  }

  @Get(':adId')
  @ApiOperation({ summary: 'Get a single ad by ID with translation' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getAdById(
    @Param('adId') adId: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.addService.getAdById(adId, lang);
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Get all ads of a specific seller' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isSold', required: false, enum: ['true', 'false'] })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getAdsBySeller(
    @Param('sellerId') sellerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isSold') isSold?: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.addService.getAdsBySellerId(sellerId, {
      page,
      limit,
      isSold,
      lang,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard, SubscriptionGuard)
  @Roles('SELLER')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Create a new ad with images' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async createAd(
    @Body() createAdDto: CreateAdDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
    @Query('lang') lang: string = 'en',
  ) {
    const sellerId = req.user?.id;
    return await this.addService.createAd(sellerId, createAdDto, files, lang);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard)
  @Roles('SELLER')
  @Patch(':adId')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Update an existing ad' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async updateAd(
    @Param('adId') adId: string,
    @Body() updateAdDto: UpdateAddDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
    @Query('lang') lang: string = 'en',
  ) {
    const sellerId = req.user?.id;
    return await this.addService.updateAd(
      adId,
      sellerId,
      updateAdDto,
      files,
      lang,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard)
  @Roles('SELLER')
  @Delete(':adId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an ad' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async deleteAd(
    @Param('adId') adId: string,
    @Req() req: any,
    @Query('lang') lang: string = 'en',
  ) {
    const sellerId = req.user?.id;
    return await this.addService.deleteAd(adId, sellerId, lang);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard)
  @Roles('SELLER')
  @Patch(':adId/toggle-sold')
  @ApiOperation({ summary: 'Toggle Ad sold status (true/false)' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async toggleSold(
    @Param('adId') adId: string,
    @Req() req: any,
    @Query('lang') lang: string = 'en',
  ) {
    const sellerId = req.user?.id;
    return await this.addService.toggleSoldStatus(adId, sellerId, lang);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':adId/view')
  @ApiOperation({ summary: 'Record a view for an ad' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async viewAd(
    @Param('adId') adId: string,
    @Req() req: any,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.addService.recordView(adId, req.user.id, lang);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':adId/viewers')
  @ApiOperation({ summary: 'Get list of viewers (Seller only)' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getAdViewers(
    @Param('adId') adId: string,
    @Req() req: any,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.addService.getAdViewers(adId, req.user.id, lang);
  }
}
