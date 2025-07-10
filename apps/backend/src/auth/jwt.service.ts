import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { GlobalConfigService } from 'src/global/global-config.service';

@Injectable()
export class JwtTokenService {
  private accessSecret: string;
  private refreshSecret: string;
  constructor(private readonly globalConfig: GlobalConfigService) {
    this.accessSecret = this.globalConfig.get('JWT_SECRET') || 'access-secret';
    this.refreshSecret = this.globalConfig.get('JWT_REFRESH_SECRET') || 'refresh-secret';
  }
  /**
   * JWT 토큰을 생성하는 서비스
   * @param payload - JWT에 담을 페이로드
   * @returns 생성된 JWT 토큰 문자열
   */
  signAccessToken(payload: any): string {
    return jwt.sign(payload, this.accessSecret, { expiresIn: '15m' });
  }

  signRefreshToken(payload: any): string {
    return jwt.sign(payload, this.refreshSecret, { expiresIn: '7d' });
  }

  verifyAccessToken(token: string): any {
    return jwt.verify(token, this.accessSecret);
  }

  verifyRefreshToken(token: string): any {
    return jwt.verify(token, this.refreshSecret);
  }
}
