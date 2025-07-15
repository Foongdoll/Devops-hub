import { Module } from '@nestjs/common';
import { GitManagerService } from './git-manager.service';
import { GitManagerController } from './git-manager.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Remote } from './entity/remote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Remote])],
  controllers: [GitManagerController],
  providers: [GitManagerService],
})
export class GitManagerModule {}
