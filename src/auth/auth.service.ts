/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaService } from './../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/auth.register-dto';
import { VerifyAuthDto } from './dto/verify-auth.dto';
import { OtpMailService } from 'src/mail/otp-mail.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/auth.login-dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpMailService: OtpMailService,
    private readonly jwtService: JwtService,
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
      if (error instanceof ConflictException) throw error;
      console.error(error);
      throw new InternalServerErrorException(
        'Something went wrong in the server',
      );
    }
  }

  async verifyUser(verifyAutDto: VerifyAuthDto) {
    const { otp, email } = verifyAutDto;
    try {
      const user = await this.prisma.auth.findFirst({
        where: { email },
      });

      if (!user) {
        throw new Error('User not found with this email');
      }

      if (user.isVerified) {
        throw new BadRequestException('User is already verified');
      }

      if (!user.otp || !user.otpExpires) {
        throw new BadRequestException('OTP is invalid');
      }

      if (new Date() > user.otpExpires) {
        throw new BadRequestException('OTP expired');
      }

      if (user.otp !== otp) {
        if (user.otpAttemp >= 5) {
          throw new ForbiddenException('Too many attempts');
        }
        await this.prisma.auth.update({
          where: { email },
          data: { otpAttemp: { increment: 1 } },
        });
        throw new BadRequestException('Invalid OTP');
      }

      await this.prisma.auth.update({
        where: { email },
        data: {
          isVerified: true,
          otp: null,
          otpExpires: null,
        },
      });
      return { message: 'Verification successful', success: true };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      console.error(error);
      throw new InternalServerErrorException(
        'Something went wrong in the server',
      );
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      const user = await this.prisma.auth.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('No user found with this email!');
      }

      if (!user.isVerified) {
        throw new ForbiddenException('Please verify your email first');
      }

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

      return {
        message: 'Login successful',
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      console.error(error);
      throw new InternalServerErrorException(
        'Something went wrong in the server',
      );
    }
  }
}
