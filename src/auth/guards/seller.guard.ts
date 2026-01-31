/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class SellerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Please login first');
    }

    if (user.isVerified !== true) {
      throw new ForbiddenException(
        'Access denied. Your seller account is not verified yet.',
      );
    }

    if (user.isSuspended === true) {
      throw new ForbiddenException(
        'Access denied. Your account is currently suspended. Please contact support.',
      );
    }

    if (user.isSeller !== true) {
      throw new ForbiddenException(
        'Access denied. This resource is only for sellers.',
      );
    }

    return true;
  }
}
