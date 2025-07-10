import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApiResponse } from 'src/common/dto/response.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './entities/auth-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtTokenService } from './jwt.service';
import { RegisterDto } from './dto/register.dto';
import { Role } from './entities/auth-role.entity';
import { RefreshToken } from './entities/auth-refresh-token.entity';
import { RoleType } from './enum/role.enum';
import { createLogger } from 'src/common/Log/logger.service';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @Inject(JwtTokenService)
    private readonly jwtService: JwtTokenService,
  ) { }

  // 로그인 처리
  async login(loginDto: LoginDto): Promise<ApiResponse> {
    const { userId, userPw } = loginDto;

    // 1. 유저 조회
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['roles'],
    });

    if (!user) {
      return ApiResponse.error('존재하지 않는 사용자입니다.');
    }

    // 2. 비밀번호 비교 (bcrypt 사용 시)
    const isValid = await bcrypt.compare(userPw, user.userPw);
    if (!isValid) {
      return ApiResponse.error('비밀번호가 일치하지 않습니다.');
    }

    // 3. 토큰 생성
    const payload = { sub: user.userCd, userId: user.userId, roles: [user.role] };
    const accessToken = this.jwtService.signAccessToken(payload);
    const refreshToken = this.jwtService.signRefreshToken(payload);
    if (!accessToken || !refreshToken) {
      return ApiResponse.error('토큰 생성에 실패했습니다.');
    }
    // TODO: refreshToken DB 저장 (필요시)
    const refreshTokenEntity = this.refreshTokenRepository.create(
      {
        refreshToken,
      }
    )
    await this.refreshTokenRepository.save(refreshTokenEntity);

    Logger.log(createLogger({
      message: '리프레시 토큰 저장 완료',
      level: 'info',
      path: '/auth/login',
      timestamp: new Date(),
    }));
    // 4. 응답 포맷
    return ApiResponse.success({
      message: '로그인 성공',
      data: {
        accessToken,
        refreshToken,
        user,
      },
    });
  }


  // 회원가입
  async register(dto: RegisterDto): Promise<ApiResponse> {
    const { userId, userPw, userName } = dto;

    // 1. 중복 확인
    const exists = await this.userRepository.findOne({ where: { userId } });
    if (exists) {
      return ApiResponse.error('이미 존재하는 아이디입니다.');
    }

    // 2. 비밀번호 해싱
    const hashedPw = await bcrypt.hash(userPw, 10);

    // 3. Role 찾기 (기본값: user)
    let role = await this.roleRepository.findOne({ where: { roleName: RoleType.USER } });
    if (!role) {
      // 만약 'USER' 역할이 없다면 새로 생성
      role = this.roleRepository.create({ roleName: RoleType.USER });
      await this.roleRepository.save(role);
    }


    // 4. 저장
    const user = this.userRepository.create({
      userId,
      userPw: hashedPw,
      userName,
      role,
    });

    await this.userRepository.save(user);

    Logger.log(createLogger({
      message: '회원정보 저장 완료',
      level: 'info',
      path: '/auth/register',
      timestamp: new Date(),
    }));
    return ApiResponse.success(null, '회원가입 성공');
  }

  // Access Token 갱신
  async refreshToken(refreshToken: string, reqUser: any): Promise<string> {
    const decoded = this.jwtService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { userCd: reqUser.userCd },
      relations: ['refreshToken', 'role'],
    });

    if (!user || user.refreshToken.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const newAccessToken = this.jwtService.signAccessToken({
      sub: user.userCd,
      userId: user.userId,
      role: user.role.roleName,
    });

     Logger.log(createLogger({
      message: 'Access Token 갱신 완료',
      level: 'info',
      path: '/auth/refresh',
      timestamp: new Date(),
    }));

    return newAccessToken;
  }

}
