import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiResponse } from 'src/common/dto/response.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { User } from 'src/common/decorator/user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from './guard/role.guard';
import { Roles } from 'src/common/decorator/rols.decorator';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
@UseGuards(JwtAuthGuard, RoleGuard) 
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: '로그인', description: '사용자 로그인 API', parameters: [] })
  login(@Body() loginDto: LoginDto): Promise<ApiResponse> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: '회원가입', description: '사용자 회원가입 API', parameters: [] })
  register(@Body() registerDto: RegisterDto): Promise<ApiResponse> {
    return this.authService.register(registerDto);
  }

  @Roles('USER')
  @Post('refresh')
  @ApiOperation({ summary: '토큰 재발급', description: '사용자 토큰 재발급 API' })
  async refresh(@Body() dto: RefreshTokenDto,
    @User() user: any): Promise<ApiResponse> {
    try {
      const newAccessToken = this.authService.refreshToken(dto.refreshToken, user);
      return ApiResponse.success({ accessToken: newAccessToken }, '토큰 재발급 완료');
    } catch (e) {
      return ApiResponse.error('토큰 검증 실패' + e);
    }
  }
}
