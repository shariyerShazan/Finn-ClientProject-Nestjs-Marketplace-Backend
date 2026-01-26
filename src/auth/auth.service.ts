/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaService } from './../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
// import * as cookieParser from 'cookie-parser';
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
import { OtpMailService } from 'src/mail/otp-mail.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/auth.login-dto';
import { ChangePasswordDto } from './dto/password.dto';
// import { CreateSellerProfileDto } from './dto/create-seller-profile.dto';
// import { UpdateProfileDto } from './dto/UpdateProfileDto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpMailService: OtpMailService,
    private readonly jwtService: JwtService,
    // private readonly cookie: cookieParser,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, phone, password, firstName, lastName, role, nickName } =
      registerDto;
    try {
      const existingUser = await this.prisma.auth.findFirst({
        where: { OR: [{ email }, { phone }] },
      });
      if (existingUser) {
        throw new ConflictException('Email or Phone already in use');
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
          isVerified: false,
          nickName,
          password: hash,
          otp,
          otpAttemp: 0,
          otpExpires,
        },
      });
      await this.otpMailService.sendOtpEmail(email, otp, name);
      return {
        message:
          'Registration successful! Please enter the OTP sent to your email to verify your account.',
        success: true,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Unexpected Registration Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong in the server',
      );
    }
  }

  async verifyUser(verifyAutDto: VerifyAuthDto) {
    const { otp, email } = verifyAutDto;
    const normalizedEmail = email.toLowerCase();
    try {
      const user = await this.prisma.auth.findFirst({
        where: { email: normalizedEmail },
      });

      if (!user) throw new NotFoundException('User not found');
      if (user.isVerified)
        throw new BadRequestException('User already verified');
      if (user.isSuspended) {
        throw new ForbiddenException(
          'Your account is suspended due to too many failed attempts. Please contact support.',
        );
      }

      if (!user.otp || !user.otpExpires || new Date() > user.otpExpires) {
        throw new BadRequestException('OTP expired or invalid');
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
          throw new ForbiddenException('Too many attempts. Account suspended.');
        }

        throw new BadRequestException(
          `Invalid OTP. Attempts left: ${5 - updatedUser.otpAttemp}`,
        );
      }

      await this.prisma.auth.update({
        where: { email },
        data: {
          isVerified: true,
          otp: null,
          otpExpires: null,
          otpAttemp: 0,
        },
      });
      return { message: 'Verification successful', success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Unexpected Verification Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong in the server',
      );
    }
  }

  async login(loginDto: LoginDto, res: Response) {
    const { email, password } = loginDto;

    try {
      const user = await this.prisma.auth.findUnique({
        where: { email },
        include: { sellerProfile: true },
      });

      if (!user) {
        throw new UnauthorizedException('No user found with this email!');
      }

      if (!user.isVerified) {
        throw new ForbiddenException('Please verify your email first');
      }

      if (user.isSuspended) {
        throw new ForbiddenException(
          'Your account is suspended. Please contact support.',
        );
      }

      await this.prisma.auth.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // if (!user.sellerProfile) {
      //   throw new NotFoundException('Create a seller profile first!');
      // }
      // if (user.role === 'SELLER' && !user.isSeller) {
      //   throw new ForbiddenException(
      //     'Your seller account is pending admin approval. You will be able to login once approved.',
      //   );
      // }

      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not defined');
      }

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

      return res.status(200).json({
        message: 'Login successful',
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Unexpected Login Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong in the server',
      );
    }
  }

  async logout(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordMatch = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!isPasswordMatch) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltOrRounds);

      await this.prisma.auth.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Unexpected ChangePassword Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong in the server',
      );
    }
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();

    try {
      const user = await this.prisma.auth.findFirst({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new NotFoundException('No user found with this email');
      }

      if (user.isSuspended) {
        throw new ForbiddenException(
          'Your account is suspended. Please contact support.',
        );
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date();
      otpExpires.setMinutes(otpExpires.getMinutes() + 5);

      await this.prisma.auth.update({
        where: { email: normalizedEmail },
        data: {
          otp,
          otpExpires,
          otpAttemp: 0,
        },
      });

      const name = `${user.firstName} ${user.lastName}`;
      await this.otpMailService.sendOtpEmail(normalizedEmail, otp, name);

      return {
        success: true,
        message: 'OTP has been sent to your email',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Unexpected ForgotPassword Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong in the server',
      );
    }
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const normalizedEmail = email.toLowerCase();

    try {
      const user = await this.prisma.auth.findFirst({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.otp || !user.otpExpires || new Date() > user.otpExpires) {
        throw new BadRequestException('OTP expired or invalid');
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
            'Too many failed attempts. Account suspended.',
          );
        }

        throw new BadRequestException(
          `Invalid OTP. Attempts left: ${5 - updatedUser.otpAttemp}`,
        );
      }

      const saltOrRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltOrRounds);

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
        message: 'Password reset successful',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Unexpected ResetPassword Error:', error);
      throw new InternalServerErrorException(
        'Something went wrong in the server',
      );
    }
  }
}
