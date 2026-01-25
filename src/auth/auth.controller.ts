/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/auth.register-dto';
import { VerifyAuthDto } from './dto/verify-auth.dto';
import { LoginDto } from './dto/auth.login-dto';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CreateSellerProfileDto } from './dto/create-seller-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/UpdateProfileDto';

@ApiTags('Authentication') // Swagger-e grouping-er jonno
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered. Please check email for OTP.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email using OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  async verify(@Body() verifyAuthDto: VerifyAuthDto) {
    return await this.authService.verifyUser(verifyAuthDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns JWT token.',
  })
  async login(@Body() loginDto: LoginDto, @Res() res: any) {
    return await this.authService.login(loginDto, res);
  }

  @Post('create-seller-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a seller profile (Only for Sellers)' })
  async createProfile(@Req() req: any, @Body() dto: CreateSellerProfileDto) {
    const userId = req.user.id;
    return await this.authService.createSellerProfile(userId, dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and clear cookie' })
  async logout(@Res({ passthrough: true }) res: any) {
    return await this.authService.logout(res);
  }

  @Patch('update-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user or seller profile info' })
  async updateProfile(@Req() req: any, @Body() updateDto: UpdateProfileDto) {
    const userId = req.user.id;
    return await this.authService.updateProfile(userId, updateDto);
  }
}
