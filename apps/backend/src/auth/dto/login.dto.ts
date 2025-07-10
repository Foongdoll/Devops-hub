import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '사용자 ID', example: 'user123' })
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '사용자 PW', example: 'Abcdef1234@' })
  userPw: string;
}
