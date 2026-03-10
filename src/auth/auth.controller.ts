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
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiTags,
  ApiOperation,
  // ApiResponse,
  ApiBearerAuth,
  // ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/auth.register-dto';
import { VerifyAuthDto } from './dto/verify-auth.dto';
import { LoginDto } from './dto/auth.login-dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.authService.register(registerDto, lang);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email using OTP' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async verify(
    @Body() verifyAuthDto: VerifyAuthDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.authService.verifyUser(verifyAuthDto, lang);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res() res: any,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.authService.login(loginDto, res, lang);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and clear cookie' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async logout(
    @Res({ passthrough: true }) res: any,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.authService.logout(res, lang);
  }

  // @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any,
    @Query('lang') lang: string = 'en',
  ) {
    const userId = req.user?.id;
    return await this.authService.changePassword(
      userId,
      changePasswordDto,
      lang,
    );
  }

  // @ApiConsumes('multipart/form-data')
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to email for password reset' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.authService.forgotPassword(forgotPasswordDto.email, lang);
  }

  // @ApiConsumes('multipart/form-data')
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Query('lang') lang: string = 'en',
  ) {
    const { email, otp, newPassword } = resetPasswordDto;
    return await this.authService.resetPassword(email, otp, newPassword, lang);
  }
}
