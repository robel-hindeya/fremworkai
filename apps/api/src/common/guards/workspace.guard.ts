import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@fremwork/types';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const workspaceId = request.headers['x-workspace-id'] || 'default-workspace-harbor-pine';

    if (!workspaceId) {
      throw new ForbiddenException({
        code: 'forbidden',
        message: 'Missing required X-Workspace-Id header.',
      });
    }

    request.workspaceId = workspaceId;

    // Check required role if @Roles() decorator is present
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const userRole = (request.user?.role || 'owner') as UserRole;
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException({
        code: 'forbidden',
        message: `Your role (${userRole}) does not have permission to perform this action.`,
      });
    }

    return true;
  }
}
