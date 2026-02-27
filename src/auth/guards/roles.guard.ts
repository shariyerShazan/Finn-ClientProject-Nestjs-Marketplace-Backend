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
import { PrismaService } from 'src/prisma/prisma.service';
// import { PrismaService } from '../prisma/prisma.service'; // Apnar PrismaService er path din

@Injectable()
export class RolesGuard implements CanActivate {
  // Constructor-e PrismaService inject koren
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    console.log(request.user.id);
    const tokenUser = request.user; // Eita ashole JWT theke asha payload

    if (!tokenUser || !tokenUser.id) {
      throw new UnauthorizedException('Authentication required');
    }

    // --- DATABASE THEKE FRESH USER DATA FIND KORA ---
    const user = await this.prisma.auth.findUnique({
      where: { id: tokenUser.id }, // payload-e 'sub' e thake user id
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const isAdmin = user.role === 'ADMIN';

    if (!isAdmin) {
      // 1. Suspended check (Database theke real value)
      if (user.isSuspended) {
        const reasonMsg = user.suspensionReason
          ? `Reason: ${user.suspensionReason}`
          : 'Please contact support for more details.';

        throw new ForbiddenException(
          `Access denied. Your account is currently suspended. ${reasonMsg}`,
        );
      }

      // 2. Verified check (Database theke real value)
      if (!user.isVerified) {
        throw new ForbiddenException(
          'Account not verified. Please verify your email first.',
        );
      }
    }

    // 3. Role validation
    if (!requiredRoles) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('You do not have the necessary permissions');
    }

    // Chotto Tip: Database theke pawa fresh user object-ta request-e abar set kore dewa bhalo
    // jate controller-e @GetCurrentUser() korle updated data pawa jay.
    request.user = user;

    return true;
  }
}
