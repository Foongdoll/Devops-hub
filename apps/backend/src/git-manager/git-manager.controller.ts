import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { GitManagerService } from './git-manager.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/common/decorator/rols.decorator';
import { Remote } from './entity/remote.entity';
import { ApiResponse } from 'src/common/dto/response.dto';
import { User } from 'src/common/decorator/user.decorator';
import { AddRemoteDto } from './dto/addRemote.dto';

@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('USER')
@Controller('git-manager')
export class GitManagerController {
  constructor(private readonly gitManagerService: GitManagerService) { }

  @Get('getRemotes')
  async getRemote(@User() user: any): Promise<ApiResponse<Remote[]>> {
    return await this.gitManagerService.getRemotes(user);
  }

  @Post('addRemote')
  async addRemote(@Body() remote: AddRemoteDto, @User() user: any): Promise<ApiResponse<Remote>> {
    return await this.gitManagerService.addRemote(remote, user);
  }
  
  @Put('editRemote')
  async editRemote(@Body() remote: Remote): Promise<ApiResponse<Remote | null>> {
    return await this.gitManagerService.editRemote(remote);
  }

  @Post('deleteRemote')
  async deleteRemote(@Body() { id }: { id: string }): Promise<ApiResponse<void>> {
    return await this.gitManagerService.deleteRemote(id);
  }
}
