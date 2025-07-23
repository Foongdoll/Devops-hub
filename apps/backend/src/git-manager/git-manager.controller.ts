import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { GitManagerService } from './git-manager.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/common/decorator/rols.decorator';
import { Remote } from './entity/remote.entity';
import { ApiResponse } from 'src/common/dto/response.dto';
import { User } from 'src/common/decorator/user.decorator';
import { AddRemoteDto } from './dto/addRemote.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TrackingBranch } from 'src/common/type/git.interface';

@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('USER')
@ApiBearerAuth()
@Controller('git-manager')
export class GitManagerController {
  constructor(private readonly gitManagerService: GitManagerService) { }

  @Get('getRemotes')
  @ApiOperation({ summary: '원격 저장소 목록 조회', description: '사용자의 원격 저장소 목록을 조회합니다.', parameters: [] })
  async getRemote(@User() user: any): Promise<ApiResponse<Remote[]>> {
    return await this.gitManagerService.getRemotes(user);
  }

  @Post('addRemote')
  @ApiOperation({ summary: '원격 저장소 추가', description: '사용자의 원격 저장소를 추가합니다.', parameters: [] })
  async addRemote(@Body() remote: AddRemoteDto, @User() user: any): Promise<ApiResponse<Remote>> {
    return await this.gitManagerService.addRemote(remote, user);
  }

  @Put('editRemote')
  @ApiOperation({ summary: '원격 저장소 수정', description: '사용자의 원격 저장소를 수정합니다.', parameters: [] })
  async editRemote(@Body() remote: Remote): Promise<ApiResponse<Remote | null>> {
    return await this.gitManagerService.editRemote(remote);
  }

  @Post('deleteRemote')
  @ApiOperation({ summary: '원격 저장소 삭제', description: '사용자의 원격 저장소를 삭제합니다.', parameters: [] })
  async deleteRemote(@Body() { id }: { id: string }): Promise<ApiResponse<void>> {
    return await this.gitManagerService.deleteRemote(id);
  }
  
  @Post('fetchBranches')
  @ApiOperation({ summary: '브랜치 목록 조회', description: '특정 원격 저장소의 브랜치 목록을 조회합니다.', parameters: [] })
  async fetchBranches(@Body() { remote }: { remote: Remote }): Promise<ApiResponse> {
    return await this.gitManagerService.fetchBranches(remote);
  } 
}
