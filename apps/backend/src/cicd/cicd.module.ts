import { Module } from '@nestjs/common';
import { CicdService } from './cicd.service';
import { CicdController } from './cicd.controller';
import { CicdGateway } from './cicd.gateway';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from 'src/app.module';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CicdConfigEntity } from './entity/cicd-config.entity';
import { Session } from 'src/terminal/entities/session.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([CicdConfigEntity, Session])],
  exports: [CicdGateway],
  controllers: [CicdController],
  providers: [CicdService, CicdGateway],
})
export class CicdModule {}
