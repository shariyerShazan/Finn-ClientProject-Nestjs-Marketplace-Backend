/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;

    const user = await this.prisma.auth.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!user || !user.isSeller) {
      throw new ForbiddenException('Seller account not verified or found.');
    }

    const subscription = user.subscription;

    if (!subscription) {
      throw new ForbiddenException('No active subscription found.');
    }

    if (new Date(subscription.endDate) < new Date()) {
      throw new ForbiddenException('Your subscription has expired.');
    }

    const totalPostedAds = subscription.usedAdIds.length;
    const limit = subscription.plan.postLimit;

    if (totalPostedAds >= limit) {
      throw new ForbiddenException(
        `You have reached your limit of ${limit} ads. Please upgrade your plan.`,
      );
    }

    return true;
  }
}
