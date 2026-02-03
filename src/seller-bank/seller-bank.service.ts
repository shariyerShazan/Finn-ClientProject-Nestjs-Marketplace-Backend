/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SellerBankService {
  constructor(private readonly prisma: PrismaService) {}

  async addOrUpdateBank(userId: string, dto: any) {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: userId },
      });

      if (!user) throw new NotFoundException('User not found');

      if (!user.isVerified) {
        throw new ForbiddenException('Please verify your account first');
      }

      if (user.isSuspended) {
        throw new ForbiddenException('Your account is suspended');
      }

      if (!user.isSeller) {
        throw new ForbiddenException('Only sellers can add bank details');
      }

      const profile = await this.prisma.sellerProfile.findUnique({
        where: { authId: userId },
      });

      if (!profile) {
        throw new BadRequestException(
          'You need to create a Seller Profile first',
        );
      }

      return await this.prisma.sellerBank.upsert({
        where: { sellerProfileId: profile.id },
        update: {
          accountHolder: dto.accountHolder,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          routingNumber: dto.routingNumber,
        },
        create: {
          accountHolder: dto.accountHolder,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          routingNumber: dto.routingNumber,
          sellerProfileId: profile.id,
        },
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException('Failed to save bank details');
    }
  }

  async getBankDetails(userId: string) {
    try {
      const profile = await this.prisma.sellerProfile.findUnique({
        where: { authId: userId },
        include: { sellerBank: true, auth: true },
      });

      if (!profile) throw new NotFoundException('Seller profile not found');

      if (profile.auth.isSuspended)
        throw new ForbiddenException('Account suspended');
      if (!profile.sellerBank)
        throw new NotFoundException('No bank details found');

      return profile.sellerBank;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      throw new InternalServerErrorException('Error fetching bank details');
    }
  }
}
