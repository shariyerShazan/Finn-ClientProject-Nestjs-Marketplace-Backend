/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
  ApiParam,
  ApiQuery,
  ApiResponse,
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

  // --- SELLER MANAGEMENT ---

  @Post('create-seller')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'Create a verified seller with auto Stripe account',
  })
  async createSeller(@Body() dto: AdminCreateSellerDto) {
    return await this.adminService.createSellerByAdmin(dto);
  }

  @Patch('update-seller/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Update seller auth and profile info' })
  @ApiParam({ name: 'userId', description: 'UUID of the user/seller' })
  async updateSeller(
    @Param('userId', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminUpdateSellerDto,
  ) {
    return await this.adminService.updateSellerByAdmin(id, dto);
  }

  @Patch('toggle-suspension/:userId')
  @ApiOperation({ summary: 'Suspend or Activate a user' })
  @ApiParam({ name: 'userId', description: 'UUID of the user' })
  async toggleSuspension(@Param('userId', new ParseUUIDPipe()) id: string) {
    return await this.adminService.toggleSellerSuspension(id);
  }

  @Delete('delete-seller/:userId')
  @ApiOperation({ summary: 'Permanently delete a user' })
  @ApiParam({ name: 'userId', description: 'UUID of the user' })
  async deleteSeller(@Param('userId', new ParseUUIDPipe()) id: string) {
    return await this.adminService.deleteSeller(id);
  }

  // --- LISTING & PAGINATION ---
  @Get('users')
  @ApiOperation({ summary: 'Get all users with advanced filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['USER', 'SELLER', 'ADMIN'],
  })
  @ApiQuery({
    name: 'isSeller',
    required: false,
    type: Boolean,
    description: 'Filter by seller status',
  })
  @ApiQuery({
    name: 'isSuspended',
    required: false,
    type: Boolean,
    description: 'Filter by suspension status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by Nickname or Email',
  })
  async getUsers(@Query() query: any) {
    return await this.adminService.getAllUsers(query);
  }

  // --- 2. GET ALL PAYMENTS ---
  @Get('payments')
  @ApiOperation({ summary: 'Get all payment transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
  })
  async getPayments(@Query() query: any) {
    return await this.adminService.getAllPayments(query);
  }

  // --- 3. GET ALL ADS ---
  @Get('ads')
  @ApiOperation({ summary: 'Get all advertisements/listings' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'type', required: false, enum: ['FIXED', 'AUCTION'] })
  @ApiQuery({ name: 'isSold', required: false, type: Boolean })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by Title or City',
  })
  async getAllAds(@Query() query: any) {
    return await this.adminService.getAllAds(query);
  }

  // --- 4. SINGLE ITEM DETAILS (With UUID Validation) ---

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get detailed history of a single user' })
  @ApiParam({ name: 'userId', description: 'Valid UUID of the user' })
  async getSingleUser(@Param('userId', new ParseUUIDPipe()) id: string) {
    return await this.adminService.getSingleUser(id);
  }

  @Get('ads/:adId')
  @ApiOperation({ summary: 'Get detailed information of a single ad' })
  @ApiParam({ name: 'adId', description: 'Valid UUID of the ad' })
  async getSingleAd(@Param('adId', new ParseUUIDPipe()) id: string) {
    return await this.adminService.getSingleAd(id);
  }

  @Get('payments/:paymentId')
  @ApiOperation({ summary: 'Get detailed information of a single payment' })
  @ApiParam({ name: 'paymentId', description: 'Valid UUID of the payment' })
  async getSinglePayment(@Param('paymentId', new ParseUUIDPipe()) id: string) {
    return await this.adminService.getSinglePayment(id);
  }

  @Get('requested-sellers')
  @ApiOperation({ summary: 'Get all pending seller approval requests' })
  @ApiResponse({ status: 200, description: 'List of pending sellers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by email, name or company',
  })
  async getRequestedSellers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllRequestedSellers({ page, limit, search });
  }

  @Patch('toggle-approval/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve or Reject a seller profile' })
  @ApiParam({ name: 'userId', description: 'UUID of the user/seller' })
  async toggleApproval(@Param('userId', new ParseUUIDPipe()) id: string) {
    return await this.adminService.toggleSellerApproval(id);
  }
}
