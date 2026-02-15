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

    // Passport/JWT usually attaches user to request. Check for both id or id.
    const userId = request.user?.id || request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Please login first');
    }

    // Ekbarei database theke sellerProfile shoho data niye asha
    const user = await this.prisma.auth.findUnique({
      where: { id: userId },
      include: { sellerProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // 1. Verification Check
    if (!user.isVerified) {
      throw new ForbiddenException('Your account is not verified yet.');
    }

    // 2. Suspension Check
    if (user.isSuspended) {
      throw new ForbiddenException('Your account is suspended.');
    }

    // 3. Seller Role Check
    // (Jodi user.role === 'SELLER' thake, oitao check korte paren)
    if (user.role !== 'SELLER') {
      throw new ForbiddenException('Only sellers can access this resource.');
    }

    // 4. Stripe Verification Check
    // Seller profile thakte hobe ebong stripe verified thakte hobe
    if (!user.sellerProfile) {
      throw new ForbiddenException(
        'Seller profile not found. Please setup your profile.',
      );
    }

    if (!user.sellerProfile.isStripeVerified) {
      throw new ForbiddenException(
        'Please complete your Stripe onboarding to access bank features.',
      );
    }

    // Updated user object request-e rekhe dewa jate controller-e direct use kora jay
    request.user = user;

    return true;
  }
}
