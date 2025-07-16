import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorator/rols.decorator';
import { JwtPayload } from 'src/common/type/jwt.interface';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    if (!user ||
      !user.roles ||
      requiredRoles.map(role => user.roles.map(r => r.roleName.toUpperCase() === role.toUpperCase())).length === 0) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return true;
  }
}
