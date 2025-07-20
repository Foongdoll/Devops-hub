import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type UserType = {
  sub: string;
  userId: string;
  roles: rolesType[];
  iat: number;
  exp: number;
}

export type rolesType = {
  roleCd: string;
  roleName: string;
}

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserType;
  },
);