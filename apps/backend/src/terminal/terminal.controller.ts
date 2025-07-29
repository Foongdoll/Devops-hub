import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { TerminalService } from './terminal.service';
import { Session } from './entities/session.entity';
import { ApiResponse } from 'src/common/dto/response.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/common/decorator/rols.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from 'src/common/decorator/user.decorator';

@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('USER')
@ApiBearerAuth()
@Controller('terminal')
export class TerminalController {
  constructor(private readonly svc: TerminalService) { }

  @Get('getSessions')
  @ApiOperation({ summary: '세션 목록 조회', description: '사용자의 세션 목록을 조회합니다.', parameters: [] })
  async list(@User() user): Promise<ApiResponse> {
    return await this.svc.findAll(user);
  }

  @Get('getSessions/:id')
  @ApiOperation({ summary: '세션 조회', description: '특정 세션을 조회합니다.', parameters: [] })
  async get(@Param('id') id: string): Promise<ApiResponse> {
    const session = await this.svc.findOne(id);
    if (!session) {
      throw new NotFoundException(`Terminal session with id ${id} not found`);
    }
    return session;
  }

  @Post('createSession')
  @ApiOperation({ summary: '세션 생성', description: '사용자 세션을 생성합니다.', parameters: [] })
  create(@Body() dto: Partial<Session>): Promise<ApiResponse> {
    return this.svc.create(dto);
  }

  @Delete('deleteSession/:id')
  @ApiOperation({ summary: '세션 삭제', description: '특정 세션을 삭제합니다.', parameters: [] })
  remove(@Param('id') id: string): Promise<ApiResponse> {
    return this.svc.remove(id);
  }
}