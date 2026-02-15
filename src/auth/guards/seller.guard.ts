/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SellerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // JWT theke user id neoa
    const userId = request.user?.id || request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Please login first');
    }

    // Database theke fresh data ana
    const user = await this.prisma.auth.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // 1. Basic Verification Check
    if (!user.isVerified) {
      throw new ForbiddenException(
        'Access denied. Your account is not verified yet.',
      );
    }

    // 2. Suspension Check
    if (user.isSuspended) {
      throw new ForbiddenException(
        'Access denied. Your account is currently suspended. Please contact support.',
      );
    }

    // 3. Seller Role Check
    // Note: Database-e jodi user.role thake tahole (user.role !== 'SELLER') check korben
    if (user.role !== 'SELLER') {
      throw new ForbiddenException(
        'Access denied. This resource is only for active sellers.',
      );
    }

    // Update request user with database info
    request.user = user;

    return true;
  }
}
