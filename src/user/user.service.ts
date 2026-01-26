/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSellerProfileDto } from 'src/auth/dto/create-seller-profile.dto';
import { UpdateProfileDto } from 'src/auth/dto/UpdateProfileDto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createSellerProfile(userId: string, sellerDto: CreateSellerProfileDto) {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: userId },
        include: { sellerProfile: true },
      });

      if (!user) throw new NotFoundException('User not found');
      if (user.role !== 'SELLER')
        throw new ForbiddenException('Only sellers can create a profile');
      if (user.sellerProfile)
        throw new ConflictException('Profile already exists');

      const profile = await this.prisma.sellerProfile.create({
        data: {
          authId: user.id,
          companyName: sellerDto.companyName,
          city: sellerDto.city,
          address: sellerDto.address,
          zip: sellerDto.zip,
          companyWebSite: sellerDto.companyWebSite,
          country: sellerDto.country,
          state: sellerDto.state,
        },
      });

      return {
        success: true,
        message: 'Seller profile submitted. Waiting for admin approval.',
        data: profile,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error creating seller profile:', error);
      throw new InternalServerErrorException('Failed to create seller profile');
    }
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    try {
      const user = await this.prisma.auth.findUnique({
        where: { id: userId },
        include: { sellerProfile: true },
      });

      if (!user) throw new NotFoundException('User not found');

      const {
        firstName,
        lastName,
        nickName,
        phone,
        profilePicture,
        sellerData,
      } = updateData;

      const updatedAuth = await this.prisma.auth.update({
        where: { id: userId },
        data: {
          firstName: firstName ?? user.firstName,
          lastName: lastName ?? user.lastName,
          nickName: nickName ?? user.nickName,
          phone: phone ?? user.phone,
          profilePicture: profilePicture ?? user.profilePicture,
        },
      });

      if (user.role === 'SELLER' && sellerData) {
        if (!user.sellerProfile) {
          throw new BadRequestException(
            'Seller profile not found. Please create one first.',
          );
        }

        if (!user.isSeller) {
          throw new ForbiddenException(
            'Your seller profile is pending approval. You cannot update it until admin approves it.',
          );
        }

        await this.prisma.sellerProfile.update({
          where: { authId: userId },
          data: {
            companyName:
              sellerData.companyName ?? user.sellerProfile.companyName,
            companyWebSite:
              sellerData.companyWebSite ?? user.sellerProfile.companyWebSite,
            address: sellerData.address ?? user.sellerProfile.address,
            city: sellerData.city ?? user.sellerProfile.city,
            state: sellerData.state ?? user.sellerProfile.state,
            zip: sellerData.zip ?? user.sellerProfile.zip,
            country: sellerData.country ?? user.sellerProfile.country,
          },
        });
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        data: updatedAuth,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Update Profile Error:', error);
      throw new InternalServerErrorException('Failed to update profile');
    }
  }
}
