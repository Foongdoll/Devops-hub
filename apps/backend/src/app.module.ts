import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { GlobalConfigModule } from './global/global-config.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { User } from './auth/entities/auth-user.entity';
import { Role } from './auth/entities/auth-role.entity';
import { RefreshToken } from './auth/entities/auth-refresh-token.entity';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminalModule } from './terminal/terminal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 어디서든 process.env 사용 가능

    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,      // 1분
      limit: 30,    // 분당 30회까지
    }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT') || "3307") || 3307,
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true, // 실서비스에서는 false로!
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
      }),
    }),
    GlobalConfigModule,
    AuthModule,
    TerminalModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    }
  ],
})
export class AppModule { }
