import { Module } from '@nestjs/common';
import { TerminalService } from './terminal.service';
import { TerminalController } from './terminal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { SessionsGateway } from './Session.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Session])],
  controllers: [TerminalController],
  providers: [TerminalService, SessionsGateway],
  exports: [SessionsGateway]
})
export class TerminalModule {}
