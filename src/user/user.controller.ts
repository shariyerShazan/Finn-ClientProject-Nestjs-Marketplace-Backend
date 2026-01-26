/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateSellerProfileDto } from 'src/auth/dto/create-seller-profile.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserService } from './user.service';
import { UpdateProfileDto } from 'src/auth/dto/UpdateProfileDto';

@ApiTags('user and seler')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create-seller-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a seller profile (Only for Sellers)' })
  async createProfile(@Req() req: any, @Body() dto: CreateSellerProfileDto) {
    const userId = req.user.id;
    return await this.userService.createSellerProfile(userId, dto);
  }

  @Patch('update-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user or seller profile info' })
  async updateProfile(@Req() req: any, @Body() updateDto: UpdateProfileDto) {
    const userId = req.user.id;
    return await this.userService.updateProfile(userId, updateDto);
  }
}
