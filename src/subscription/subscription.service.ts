/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './dto/subscription-plan.dto';
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private readonly translationService: TranslationService,
  ) {}

  // ১. Create Plan (Admin Only)
  async createPlan(dto: CreateSubscriptionPlanDto, lang: string = 'en') {
    try {
      const plan = await this.prisma.subscriptionPlan.create({
        data: dto,
      });
      return {
        success: true,
        message: await this.translationService.translate(
          'Subscription plan created successfully',
          lang,
        ),
        data: plan,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Failed to create subscription plan',
          lang,
        ),
      );
    }
  }

  // ২. Get All Plans (For both Admin & Seller)
  async getAllPlans(lang: string = 'en') {
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });

      // ডাইনামিক ডাটা (নাম এবং ডেসক্রিপশন) ট্রান্সলেট করা হচ্ছে
      const translatedPlans = await Promise.all(
        plans.map((plan) =>
          this.translationService.translateData(
            plan,
            ['name', 'description'],
            lang,
          ),
        ),
      );

      return {
        success: true,
        data: translatedPlans,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        await this.translationService.translate('Error fetching plans', lang),
      );
    }
  }

  // ৩. Get Single Plan
  async getSinglePlan(id: string, lang: string = 'en') {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id },
      });

      if (!plan) {
        throw new NotFoundException(
          await this.translationService.translate('Plan not found', lang),
        );
      }

      const translatedPlan = await this.translationService.translateData(
        plan,
        ['name', 'description'],
        lang,
      );

      return {
        success: true,
        data: translatedPlan,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Error fetching plan details',
          lang,
        ),
      );
    }
  }

  // ৪. Update Plan
  async updatePlan(
    id: string,
    dto: UpdateSubscriptionPlanDto,
    lang: string = 'en',
  ) {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id },
      });
      if (!plan) {
        throw new NotFoundException(
          await this.translationService.translate('Plan not found', lang),
        );
      }

      const updatedPlan = await this.prisma.subscriptionPlan.update({
        where: { id },
        data: dto,
      });

      return {
        success: true,
        message: await this.translationService.translate(
          'Plan updated successfully',
          lang,
        ),
        data: updatedPlan,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate('Update failed', lang),
      );
    }
  }

  // ৫. Delete Plan
  async deletePlan(id: string, lang: string = 'en') {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id },
      });
      if (!plan) {
        throw new NotFoundException(
          await this.translationService.translate('Plan not found', lang),
        );
      }

      await this.prisma.subscriptionPlan.delete({ where: { id } });

      return {
        success: true,
        message: await this.translationService.translate(
          'Plan deleted successfully',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Delete operation failed',
          lang,
        ),
      );
    }
  }
}
