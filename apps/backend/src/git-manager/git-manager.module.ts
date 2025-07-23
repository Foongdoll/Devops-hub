import { Module } from '@nestjs/common';
import { GitManagerService } from './git-manager.service';
import { GitManagerController } from './git-manager.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Remote, UserRemoteJoin } from './entity/remote.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Remote, UserRemoteJoin]), AuthModule],
  controllers: [GitManagerController],
  providers: [GitManagerService],
})
export class GitManagerModule {}
