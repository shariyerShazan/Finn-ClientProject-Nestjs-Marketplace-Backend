/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

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

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // ১. Create Plan (Admin Only)
  async createPlan(dto: CreateSubscriptionPlanDto) {
    try {
      const plan = await this.prisma.subscriptionPlan.create({
        data: dto,
      });
      return {
        success: true,
        message: 'Subscription plan created successfully',
        data: plan,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to create subscription plan',
      );
    }
  }

  // ২. Get All Plans (For both Admin & Seller)
  async getAllPlans() {
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });
      return {
        success: true,
        data: plans,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error fetching plans');
    }
  }

  // ৩. Get Single Plan
  async getSinglePlan(id: string) {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id },
      });

      if (!plan) throw new NotFoundException('Plan not found');

      return {
        success: true,
        data: plan,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Error fetching plan details');
    }
  }

  // ৪. Update Plan
  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto) {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id },
      });
      if (!plan) throw new NotFoundException('Plan not found');

      const updatedPlan = await this.prisma.subscriptionPlan.update({
        where: { id },
        data: dto,
      });

      return {
        success: true,
        message: 'Plan updated successfully',
        data: updatedPlan,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Update failed');
    }
  }

  // ৫. Delete Plan (Soft Delete recommended but here is Hard Delete)
  async deletePlan(id: string) {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id },
      });
      if (!plan) throw new NotFoundException('Plan not found');

      await this.prisma.subscriptionPlan.delete({ where: { id } });

      return {
        success: true,
        message: 'Plan deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Delete operation failed');
    }
  }
}
