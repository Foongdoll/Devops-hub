
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'src/common/type/jwt.interface';
import { GlobalConfigService } from 'src/global/global-config.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly globalConfigService: GlobalConfigService) {}
  canActivate(context: ExecutionContext): boolean {
     const req = context.switchToHttp().getRequest();
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Access Token 없음');

    try {
      const payload = jwt.verify(token, this.globalConfigService.get('JWT_SECRET')!) as JwtPayload;
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Access Token 검증 실패');
    }
  }
}
