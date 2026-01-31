/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  AdminCreateSellerDto,
  AdminUpdateSellerDto,
} from './dto/admin-seller.dto';
import { AllMailService } from 'src/mail/all-mail.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly allMailService: AllMailService,
  ) {}

  // 1. Create Seller & Send Credentials
  async createSellerByAdmin(dto: AdminCreateSellerDto) {
    try {
      const existingUser = await this.prisma.auth.findFirst({
        where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
      });

      if (existingUser)
        throw new ConflictException('Email or Phone already exists');

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      await this.prisma.$transaction(async (tx) => {
        const auth = await tx.auth.create({
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            nickName: dto.nickName,
            email: dto.email,
            phone: dto.phone,
            password: hashedPassword,
            isSeller: true,
            isVerified: true,
          },
        });

        await tx.sellerProfile.create({
          data: {
            authId: auth.id,
            companyName: dto.companyName,
            companyWebSite: dto.companyWebSite,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            zip: dto.zip,
            country: dto.country,
            status: 'APPROVED',
          },
        });
      });

      try {
        await this.allMailService.sendSellerCredentials(
          dto.email,
          dto.password,
          dto.firstName,
        );
      } catch (mailError) {
        console.error('Email sending failed:', mailError);
      }

      return {
        success: true,
        message: 'Seller created and credentials sent to mail',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to create seller');
    }
  }

  async updateSellerByAdmin(sellerId: string, dto: AdminUpdateSellerDto) {
    try {
      const auth = await this.prisma.auth.findUnique({
        where: { id: sellerId },
      });
      if (!auth) throw new NotFoundException('Seller not found');

      let hashedPassword;
      if (dto.password) {
        hashedPassword = await bcrypt.hash(dto.password, 10);
      }

      return await this.prisma.auth.update({
        where: { id: sellerId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          password: hashedPassword,
          sellerProfile: {
            update: {
              companyName: dto.companyName,
              companyWebSite: dto.companyWebSite,
              address: dto.address,
              city: dto.city,
              state: dto.state,
              zip: dto.zip,
              country: dto.country,
            },
          },
        },
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Update failed');
    }
  }

  async toggleSellerSuspension(sellerId: string) {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: sellerId },
        select: { isSuspended: true },
      });

      if (!user) throw new NotFoundException('Seller not found');

      const newStatus = !user.isSuspended;

      await this.prisma.auth.update({
        where: { id: sellerId },
        data: { isSuspended: newStatus },
      });

      return {
        success: true,
        message: newStatus
          ? 'Seller suspended successfully'
          : 'Seller activated successfully',
        currentStatus: newStatus,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.log(error);
      throw new InternalServerErrorException('Status chnage error!');
    }
  }

  async deleteSeller(sellerId: string) {
    try {
      await this.prisma.auth.delete({ where: { id: sellerId } });
      return { success: true, message: 'Seller deleted forever' };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Delete failed');
    }
  }
}
