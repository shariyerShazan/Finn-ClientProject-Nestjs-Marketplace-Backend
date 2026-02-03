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
export class SellerBankGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 1. Basic User & Status Check
    if (!user) throw new UnauthorizedException('Please login first');

    if (user.isVerified !== true) {
      throw new ForbiddenException('Your account is not verified yet.');
    }

    if (user.isSuspended === true) {
      throw new ForbiddenException('Your account is suspended.');
    }

    if (user.isSeller !== true) {
      throw new ForbiddenException('Only sellers can access this resource.');
    }

    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { authId: user.id },
      include: { sellerBank: true },
    });

    if (!sellerProfile) {
      throw new ForbiddenException('Seller profile not found.');
    }

    if (!sellerProfile.sellerBank) {
      throw new ForbiddenException(
        'Please add your bank account details before creating or managing ads.',
      );
    }

    return true;
  }
}
