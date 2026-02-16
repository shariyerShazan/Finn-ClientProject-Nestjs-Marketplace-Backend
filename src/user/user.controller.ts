/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateSellerProfileDto } from 'src/user/dto/create-seller-profile.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/UpdateProfileDto';
import { SellerGuard } from 'src/auth/guards/seller.guard';
import { SellerBankGuard } from 'src/auth/guards/seller-bank.guard';

@ApiTags('User & Seller Dashboard')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create-seller-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  // @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateSellerProfileDto })
  // @ApiOperation({ summary: 'Create a seller profile (Only for Sellers)' })
  async createProfile(@Req() req: any, @Body() dto: CreateSellerProfileDto) {
    // console.log(req.user.id, dto);
    return await this.userService.createSellerProfile(req.user.id, dto);
  }

  @Patch('update-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update user or seller profile info' })
  async updateProfile(@Req() req: any, @Body() updateDto: UpdateProfileDto) {
    return await this.userService.updateProfile(req.user.id, updateDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current logged-in user details' })
  async getMe(@Req() req: any) {
    return await this.userService.getMe(req.user.id);
  }

  // --- SELLER SECTION ---

  @Get('my-ads')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard, SellerBankGuard)
  @Roles('SELLER')
  @ApiOperation({ summary: 'Seller: Get own ads with pagination & search' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by title or description',
  })
  async getMyAds(@Req() req: any, @Query() query: any) {
    return await this.userService.getMyAds(req.user.id, query);
  }

  @Get('my-ads/:adId')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard, SellerBankGuard)
  @Roles('SELLER')
  @ApiOperation({ summary: 'Seller: Get single ad details' })
  @ApiParam({ name: 'adId', description: 'UUID of the Advertisement' })
  async getSingleMyAd(
    @Req() req: any,
    @Param('adId', new ParseUUIDPipe()) adId: string,
  ) {
    return await this.userService.getSingleMyAd(req.user.id, adId);
  }

  @Get('my-earnings')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard, SellerBankGuard)
  @Roles('SELLER')
  @ApiOperation({ summary: 'Seller: Get payments received' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async getMyEarnings(@Req() req: any, @Query() query: any) {
    return await this.userService.getMyEarnings(req.user.id, query);
  }

  // --- BUYER SECTION ---

  @Get('my-purchases')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Buyer: Get own purchase history' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async getMyPurchases(@Req() req: any, @Query() query: any) {
    return await this.userService.getMyPurchases(req.user.id, query);
  }

  @Get('payment/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get single payment details (For Buyer or Seller)' })
  @ApiParam({ name: 'paymentId', description: 'UUID of the Payment' })
  async getSinglePayment(
    @Req() req: any,
    @Param('paymentId', new ParseUUIDPipe()) id: string,
  ) {
    return await this.userService.getSinglePayment(req.user.id, id);
  }

  // --- SELLER DASHBOARD SECTION ---

  @Get('seller-stats')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard, SellerBankGuard)
  @Roles('SELLER')
  @ApiOperation({
    summary:
      'Seller: Get dashboard statistics (Total Ads, Income, Sold, Views)',
  })
  async getSellerStats(@Req() req: any) {
    return await this.userService.getSellerDashboardStats(req.user.id);
  }

  @Get('seller-recent-ads')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard, SellerBankGuard)
  @Roles('SELLER')
  @ApiOperation({ summary: 'Seller: Get latest 10 ads with search' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search recent ads by title or description',
  })
  async getRecentAds(@Req() req: any, @Query('search') search?: string) {
    return await this.userService.getSellerRecentAds(req.user.id, { search });
  }
}
