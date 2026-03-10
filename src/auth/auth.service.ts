import { PrismaService } from './../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/auth.register-dto';
import { VerifyAuthDto } from './dto/verify-auth.dto';
import { AllMailService } from 'src/mail/all-mail.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/auth.login-dto';
import { ChangePasswordDto } from './dto/password.dto';
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly allMailService: AllMailService,
    private readonly translationService: TranslationService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto, lang: string = 'en') {
    const { email, phone, password, firstName, lastName, role, nickName } =
      registerDto;
    try {
      const existingUser = await this.prisma.auth.findFirst({
        where: { OR: [{ email }, { phone }] },
      });
      if (existingUser) {
        throw new ConflictException(
          await this.translationService.translate(
            'Email or Phone already in use',
            lang,
          ),
        );
      }

      const saltOrRounds = 10;
      const hash = await bcrypt.hash(password, saltOrRounds);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date();
      otpExpires.setMinutes(otpExpires.getMinutes() + 5);

      const name = `${firstName} ${lastName}`;
      await this.prisma.auth.create({
        data: {
          firstName,
          lastName,
          phone,
          email,
          role,
          nickName,
          isVerified: false,
          password: hash,
          otp,
          otpAttemp: 0,
          otpExpires,
        },
      });

      await this.allMailService.sendOtpEmail(email, otp, name, lang);

      return {
        message: await this.translationService.translate(
          'Registration successful! Please enter the OTP sent to your email to verify your account.',
          lang,
        ),
        success: true,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Something went wrong in the server',
          lang,
        ),
      );
    }
  }

  async verifyUser(verifyAutDto: VerifyAuthDto, lang: string = 'en') {
    const { otp, email } = verifyAutDto;
    const normalizedEmail = email.toLowerCase();
    try {
      const user = await this.prisma.auth.findFirst({
        where: { email: normalizedEmail },
      });

      if (!user)
        throw new NotFoundException(
          await this.translationService.translate('User not found', lang),
        );
      if (user.isVerified)
        throw new BadRequestException(
          await this.translationService.translate(
            'User already verified',
            lang,
          ),
        );
      if (user.isSuspended) {
        throw new ForbiddenException(
          await this.translationService.translate(
            'Your account is suspended due to too many failed attempts. Please contact support.',
            lang,
          ),
        );
      }

      if (!user.otp || !user.otpExpires || new Date() > user.otpExpires) {
        throw new BadRequestException(
          await this.translationService.translate(
            'OTP expired or invalid',
            lang,
          ),
        );
      }

      if (user.otp !== otp) {
        const updatedUser = await this.prisma.auth.update({
          where: { email: normalizedEmail },
          data: { otpAttemp: { increment: 1 } },
        });

        if (updatedUser.otpAttemp >= 5) {
          await this.prisma.auth.update({
            where: { email: normalizedEmail },
            data: { isSuspended: true },
          });
          throw new ForbiddenException(
            await this.translationService.translate(
              'Too many attempts. Account suspended.',
              lang,
            ),
          );
        }

        const leftAttempts = 5 - updatedUser.otpAttemp;
        throw new BadRequestException(
          `${await this.translationService.translate('Invalid OTP. Attempts left', lang)}: ${leftAttempts}`,
        );
      }

      await this.prisma.auth.update({
        where: { email },
        data: { isVerified: true, otp: null, otpExpires: null, otpAttemp: 0 },
      });
      return {
        message: await this.translationService.translate(
          'Verification successful',
          lang,
        ),
        success: true,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Something went wrong in the server',
          lang,
        ),
      );
    }
  }

  async login(loginDto: LoginDto, res: Response, lang: string = 'en') {
    const { email, password } = loginDto;
    try {
      const user = await this.prisma.auth.findUnique({
        where: { email },
        include: { sellerProfile: true },
      });

      if (!user)
        throw new UnauthorizedException(
          await this.translationService.translate(
            'No user found with this email!',
            lang,
          ),
        );
      if (!user.isVerified)
        throw new ForbiddenException(
          await this.translationService.translate(
            'Please verify your email first',
            lang,
          ),
        );
      if (user.isSuspended)
        throw new ForbiddenException(
          await this.translationService.translate(
            'Your account is suspended. Please contact support.',
            lang,
          ),
        );

      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch)
        throw new UnauthorizedException(
          await this.translationService.translate(
            'Invalid email or password',
            lang,
          ),
        );

      await this.prisma.auth.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isSuspended: user.isSuspended,
        isSeller: user.isSeller,
      };
      const token = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'super-secret',
        expiresIn: '7d',
      });

      res.cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      let msgKey = 'Login successful';
      if (user.role === 'USER') msgKey = `Welcome back, ${user.firstName}!`;
      else if (user.role === 'SELLER')
        msgKey = user.isSeller
          ? `Welcome to your Dashboard, ${user.firstName}!`
          : `Hi ${user.firstName}, please create your profile to get started!`;
      else msgKey = `Welcome back Boss, ${user.firstName}!`;

      return res.status(200).json({
        message: await this.translationService.translate(msgKey, lang),
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          role: user.role,
          isSeller: user.isSeller,
          isVerified: user.isVerified,
          isSuspended: user.isSuspended,
          sellerProfile: user.sellerProfile,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Something went wrong in the server',
          lang,
        ),
      );
    }
  }

  async logout(res: Response, lang: string = 'en') {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return {
      success: true,
      message: await this.translationService.translate(
        'Logged out successfully',
        lang,
      ),
    };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    lang: string = 'en',
  ) {
    const { currentPassword, newPassword } = changePasswordDto;
    try {
      const user = await this.prisma.auth.findUnique({ where: { id: userId } });
      if (!user)
        throw new NotFoundException(
          await this.translationService.translate('User not found', lang),
        );

      const isPasswordMatch = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordMatch)
        throw new UnauthorizedException(
          await this.translationService.translate(
            'Current password is incorrect',
            lang,
          ),
        );

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prisma.auth.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        message: await this.translationService.translate(
          'Password changed successfully',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Something went wrong in the server',
          lang,
        ),
      );
    }
  }

  async forgotPassword(email: string, lang: string = 'en') {
    const normalizedEmail = email.toLowerCase();
    try {
      const user = await this.prisma.auth.findFirst({
        where: { email: normalizedEmail },
      });
      if (!user)
        throw new NotFoundException(
          await this.translationService.translate(
            'No user found with this email',
            lang,
          ),
        );
      if (user.isSuspended)
        throw new ForbiddenException(
          await this.translationService.translate(
            'Your account is suspended. Please contact support.',
            lang,
          ),
        );

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date();
      otpExpires.setMinutes(otpExpires.getMinutes() + 5);

      await this.prisma.auth.update({
        where: { email: normalizedEmail },
        data: { otp, otpExpires, otpAttemp: 0 },
      });
      await this.allMailService.sendForgotOtp(
        normalizedEmail,
        otp,
        `${user.firstName} ${user.lastName}`,
        lang,
      );

      return {
        success: true,
        message: await this.translationService.translate(
          'OTP has been sent to your email',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Something went wrong in the server',
          lang,
        ),
      );
    }
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
    lang: string = 'en',
  ) {
    const normalizedEmail = email.toLowerCase();
    try {
      const user = await this.prisma.auth.findFirst({
        where: { email: normalizedEmail },
      });
      if (!user)
        throw new NotFoundException(
          await this.translationService.translate('User not found', lang),
        );

      if (!user.otp || !user.otpExpires || new Date() > user.otpExpires) {
        throw new BadRequestException(
          await this.translationService.translate(
            'OTP expired or invalid',
            lang,
          ),
        );
      }

      if (user.otp !== otp) {
        const updatedUser = await this.prisma.auth.update({
          where: { email: normalizedEmail },
          data: { otpAttemp: { increment: 1 } },
        });
        if (updatedUser.otpAttemp >= 5) {
          await this.prisma.auth.update({
            where: { email: normalizedEmail },
            data: { isSuspended: true },
          });
          throw new ForbiddenException(
            await this.translationService.translate(
              'Too many failed attempts. Account suspended.',
              lang,
            ),
          );
        }
        throw new BadRequestException(
          `${await this.translationService.translate('Invalid OTP. Attempts left', lang)}: ${5 - updatedUser.otpAttemp}`,
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prisma.auth.update({
        where: { email: normalizedEmail },
        data: {
          password: hashedPassword,
          otp: null,
          otpExpires: null,
          otpAttemp: 0,
        },
      });

      return {
        success: true,
        message: await this.translationService.translate(
          'Password reset successful',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Something went wrong in the server',
          lang,
        ),
      );
    }
  }
}
