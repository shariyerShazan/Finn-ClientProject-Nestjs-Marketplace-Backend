/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
  //   ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateAdDto, UpdateAddDto } from './dto/CreateAdDto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Ads Management')
@Controller('ads')
export class AddController {
  constructor(private readonly addService: AddService) {}

  @Get()
  @ApiOperation({ summary: 'Get all ads with filters' })
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
    description: 'Filter by sold status',
  })
  @ApiQuery({
    name: 'sortByPrice',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort by price',
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('isSold') isSold?: string,
    @Query('sortByPrice') sortByPrice?: 'asc' | 'desc',
  ) {
    return await this.addService.getAllAds({
      page,
      limit,
      search,
      isSold,
      sortByPrice,
    });
  }

  @Get(':adId')
  @ApiOperation({ summary: 'Get a single ad by ID' })
  async getAdById(@Param('adId') adId: string) {
    return await this.addService.getAdById(adId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Create a new ad with images' })
  async createAd(
    @Body() createAdDto: CreateAdDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const sellerId = req.user?.id;
    return await this.addService.createAd(sellerId, createAdDto, files);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Patch(':adId')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Update an existing ad' })
  async updateAd(
    @Param('adId') adId: string,
    @Body() updateAdDto: UpdateAddDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const sellerId = req.user?.id;
    return await this.addService.updateAd(adId, sellerId, updateAdDto, files);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @Delete(':adId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an ad' })
  async deleteAd(@Param('adId') adId: string, @Req() req: any) {
    const sellerId = req.user?.id;
    return await this.addService.deleteAd(adId, sellerId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  //   @Roles('SELLER')
  @Patch(':adId/toggle-sold')
  @ApiOperation({ summary: 'Toggle Ad sold status (true/false)' })
  async toggleSold(@Param('adId') adId: string, @Req() req: any) {
    const sellerId = req.user?.id;
    return await this.addService.toggleSoldStatus(adId, sellerId);
  }
}
