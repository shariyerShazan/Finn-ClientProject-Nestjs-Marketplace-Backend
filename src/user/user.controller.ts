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
  UploadedFile,
  UseGuards,
  UseInterceptors,
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
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('User & Seller Dashboard')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create-seller-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBody({ type: CreateSellerProfileDto })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async createProfile(
    @Req() req: any,
    @Body() dto: CreateSellerProfileDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.userService.createSellerProfile(req.user.id, dto, lang);
  }

  @Patch('update-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'USER')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async updateProfile(
    @Req() req: any,
    @Body() updateDto: UpdateProfileDto,
    @UploadedFile() file: Express.Multer.File,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.userService.updateProfile(
      req.user.id,
      updateDto,
      file,
      lang,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current logged-in user details' })
  async getMe(@Req() req: any) {
    return await this.userService.getMe(req.user.id);
  }

  @Get('my-ads')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard)
  @Roles('SELLER')
  @ApiOperation({ summary: 'Seller: Get own ads with pagination & search' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by title or description',
  })
  async getMyAds(@Req() req: any, @Query() query: any) {
    return await this.userService.getMyAds(req.user.id, query);
  }

  @Get('my-ads/:adId')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard)
  @Roles('SELLER')
  @ApiOperation({ summary: 'Seller: Get single ad details' })
  @ApiParam({ name: 'adId', description: 'UUID of the Advertisement' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getSingleMyAd(
    @Req() req: any,
    @Param('adId', new ParseUUIDPipe()) adId: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.userService.getSingleMyAd(req.user.id, adId, lang);
  }

  @Get('my-earnings')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard)
  @Roles('SELLER')
  @ApiOperation({ summary: 'Seller: Get payments received' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getMyEarnings(@Req() req: any, @Query() query: any) {
    return await this.userService.getMyEarnings(req.user.id, query);
  }

  @Get('my-purchases')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Buyer: Get own purchase history' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getMyPurchases(@Req() req: any, @Query() query: any) {
    return await this.userService.getMyPurchases(req.user.id, query);
  }

  @Get('payment/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get single payment details (For Buyer or Seller)' })
  @ApiParam({ name: 'paymentId', description: 'UUID of the Payment' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getSinglePayment(
    @Req() req: any,
    @Param('paymentId', new ParseUUIDPipe()) id: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.userService.getSinglePayment(req.user.id, id, lang);
  }

  @Get('seller-stats')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard)
  @Roles('SELLER')
  @ApiOperation({ summary: 'Seller: Get dashboard statistics' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getSellerStats(@Req() req: any, @Query('lang') lang: string = 'en') {
    return await this.userService.getSellerDashboardStats(req.user.id, lang);
  }

  @Get('seller-recent-ads')
  @UseGuards(JwtAuthGuard, RolesGuard, SellerGuard)
  @Roles('SELLER')
  @ApiOperation({ summary: 'Seller: Get latest 10 ads with search' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getRecentAds(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.userService.getSellerRecentAds(req.user.id, {
      search,
      lang,
    });
  }

  @Get('subscription/my-history')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current seller payment history' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getMyHistory(@Req() req: any, @Query('lang') lang: string = 'en') {
    return await this.userService.getMySubscriptions(req.user.id, lang);
  }
}
