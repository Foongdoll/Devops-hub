import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class GlobalConfigService {

  get(key: string): string | undefined {
    return process.env[key];
  }

  getOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }
}
