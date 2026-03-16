/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TranslationService } from 'src/translation/translation.service';
import {
  ApplyBoostDto,
  CreateBoostPackageDto,
  UpdateBoostPackageDto,
} from './dto/add-boost.dto';

@Injectable()
export class AdBoostService {
  constructor(
    private prisma: PrismaService,
    private readonly translationService: TranslationService,
  ) {}

  // ১. Create Boost Package (Admin)
  async createPackage(dto: CreateBoostPackageDto, lang: string = 'en') {
    try {
      const pkg = await this.prisma.adBoostPackage.create({ data: dto });
      return {
        success: true,
        message: await this.translationService.translate(
          'Boost package created',
          lang,
        ),
        data: pkg,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Failed to create package',
          lang,
        ),
      );
    }
  }

  // ২. Apply Boost to Ad (Seller)
  async applyBoost(dto: ApplyBoostDto, sellerId: string, lang: string = 'en') {
    try {
      const pkg = await this.prisma.adBoostPackage.findUnique({
        where: { id: dto.packageId, isActive: true },
      });

      if (!pkg) {
        throw new NotFoundException(
          await this.translationService.translate(
            'Package not found or inactive',
            lang,
          ),
        );
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + pkg.durationDays);

      const boost = await this.prisma.$transaction(async (tx) => {
        const newBoost = await tx.adBoost.create({
          data: {
            adId: dto.adId,
            packageId: pkg.id,
            sellerId: sellerId,
            endDate: endDate,
            status: 'ACTIVE',
          },
        });

        await tx.ad.update({
          where: { id: dto.adId },
          data: { isBoosted: true },
        });

        return newBoost;
      });

      return {
        success: true,
        message: await this.translationService.translate(
          'Ad boosted successfully',
          lang,
        ),
        data: boost,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate('Failed to apply boost', lang),
      );
    }
  }

  // ৩. Get All Packages (With Translation)
  async getAllPackages(lang: string = 'en') {
    try {
      const packages = await this.prisma.adBoostPackage.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });

      const translated = await Promise.all(
        packages.map((pkg) =>
          this.translationService.translateData(
            pkg,
            ['name', 'description'],
            lang,
          ),
        ),
      );

      return { success: true, data: translated };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error fetching boost packages');
    }
  }

  // ৪. Update Package
  async updatePackage(
    id: string,
    dto: UpdateBoostPackageDto,
    lang: string = 'en',
  ) {
    try {
      const updated = await this.prisma.adBoostPackage.update({
        where: { id },
        data: dto,
      });
      return {
        success: true,
        message: await this.translationService.translate(
          'Package updated',
          lang,
        ),
        data: updated,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Update failed');
    }
  }

  // ৫. Delete Package
  async deletePackage(id: string, lang: string = 'en') {
    try {
      await this.prisma.adBoostPackage.delete({ where: { id } });
      return {
        success: true,
        message: await this.translationService.translate(
          'Package deleted',
          lang,
        ),
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Delete failed');
    }
  }
}
