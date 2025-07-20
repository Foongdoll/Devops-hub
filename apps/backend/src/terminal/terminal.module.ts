import { Module } from '@nestjs/common';
import { TerminalService } from './terminal.service';
import { TerminalController } from './terminal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { AuthModule } from 'src/auth/auth.module';
import { SessionsGateway } from './Session.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), AuthModule],
  controllers: [TerminalController],
  providers: [TerminalService, SessionsGateway],
})
export class TerminalModule { }
