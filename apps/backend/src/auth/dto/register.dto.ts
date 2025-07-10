import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  @ApiProperty({ description: '사용자 ID', example: 'user123' })
  userId: string;

  @IsString()
  @ApiProperty({ description: '사용자 PW', example: 'Abcdef1234@' })
  userPw: string;

  @IsString()
  @ApiProperty({ description: '사용자 이름', example: '홍길동' })
  userName: string;

}
