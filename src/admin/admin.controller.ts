import {
  Body,
  Controller,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
  UseInterceptors,
  Get,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  // ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  AdminCreateSellerDto,
  AdminUpdateSellerDto,
} from './dto/admin-seller.dto';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('create-seller')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'Create a verified seller with auto Stripe account',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async createSeller(
    @Body() dto: AdminCreateSellerDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.adminService.createSellerByAdmin(dto, lang);
  }

  @Patch('update-seller/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Update seller auth and profile info' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async updateSeller(
    @Param('userId', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminUpdateSellerDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.adminService.updateSellerByAdmin(id, dto, lang);
  }

  @Patch('toggle-suspension/:userId')
  @ApiOperation({ summary: 'Suspend or Activate a user with a reason' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async toggleSuspension(
    @Param('userId', new ParseUUIDPipe()) id: string,
    @Body('reason') reason?: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.adminService.toggleSellerSuspension(id, reason, lang);
  }

  @Delete('delete-seller/:userId')
  @ApiOperation({ summary: 'Permanently delete a user' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async deleteSeller(
    @Param('userId', new ParseUUIDPipe()) id: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.adminService.deleteSeller(id, lang);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with advanced filters' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getUsers(@Query() query: any) {
    return await this.adminService.getAllUsers(query);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get all payment transactions' })
  async getPayments(@Query() query: any) {
    return await this.adminService.getAllPayments(query);
  }

  @Get('ads')
  @ApiOperation({ summary: 'Get all advertisements/listings' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getAllAds(@Query() query: any) {
    return await this.adminService.getAllAds(query);
  }

  @Get('users/:userId')
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getSingleUser(
    @Param('userId', new ParseUUIDPipe()) id: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.adminService.getSingleUser(id, lang);
  }

  @Get('ads/:adId')
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getSingleAd(
    @Param('adId', new ParseUUIDPipe()) id: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.adminService.getSingleAd(id, lang);
  }

  @Get('requested-sellers')
  async getRequestedSellers(@Query() query: any) {
    return this.adminService.getAllRequestedSellers(query);
  }

  @Patch('toggle-approval/:userId')
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async toggleApproval(
    @Param('userId', new ParseUUIDPipe()) id: string,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.adminService.toggleSellerApproval(id, lang);
  }

  @Get('dashboard-stats')
  async getStats() {
    return await this.adminService.getAdminStats();
  }

  @Get('recent-users')
  async getRecentUsers() {
    return await this.adminService.getRecentUsers();
  }
}
