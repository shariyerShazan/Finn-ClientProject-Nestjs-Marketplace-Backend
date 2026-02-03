/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(
        'Authentication required to access this resource',
      );
    }

    // 1. Check if user is suspended
    if (user.isSuspended) {
      throw new ForbiddenException(
        'Your account has been suspended. Please contact support.',
      );
    }

    // 2. Check if user is verified
    if (!user.isVerified) {
      throw new ForbiddenException(
        'Account not verified. Please verify your email/phone first.',
      );
    }

    // 3. Role validation logic
    if (!requiredRoles) {
      return true;
    }

    if (!user.role) {
      throw new ForbiddenException('User role is not defined');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have the necessary permissions to access this route',
      );
    }

    return true;
  }
}
