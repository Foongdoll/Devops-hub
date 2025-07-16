import { Module } from '@nestjs/common';
import { GitManagerService } from './git-manager.service';
import { GitManagerController } from './git-manager.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Remote } from './entity/remote.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Remote]), AuthModule],
  controllers: [GitManagerController],
  providers: [GitManagerService],
})
export class GitManagerModule {}
