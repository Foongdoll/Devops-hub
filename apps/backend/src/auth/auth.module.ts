import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from './jwt.service';
import { RefreshToken } from './entities/auth-refresh-token.entity';
import { Role } from './entities/auth-role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/auth-user.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([User, Role, RefreshToken]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtTokenService],
})
export class AuthModule {}
