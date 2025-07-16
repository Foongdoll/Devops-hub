import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { TerminalService } from './terminal.service';
import { Session } from './entities/session.entity';
import { ApiResponse } from 'src/common/dto/response.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/common/decorator/rols.decorator';

@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('USER')
@Controller('terminal')
export class TerminalController {
  constructor(private readonly svc: TerminalService) { }

  @Get('getSessions')
  async list(): Promise<ApiResponse> {
    return await this.svc.findAll();
  }

  @Get('getSessions/:id')
  async get(@Param('id') id: string): Promise<ApiResponse> {
    const session = await this.svc.findOne(id);
    if (!session) {
      throw new NotFoundException(`Terminal session with id ${id} not found`);
    }
    return session;
  }

  @Post('createSession')
  create(@Body() dto: Partial<Session>): Promise<ApiResponse> {
    return this.svc.create(dto);
  }

  @Delete('deleteSession/:id')
  remove(@Param('id') id: string): Promise<ApiResponse> {
    return this.svc.remove(id);
  }
}