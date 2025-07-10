import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @ApiProperty({ description: '리프레시 토큰', example: 'your-refresh-token' })
  refreshToken: string;
}
