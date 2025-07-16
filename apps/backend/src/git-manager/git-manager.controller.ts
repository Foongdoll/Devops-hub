import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GitManagerService } from './git-manager.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/common/decorator/rols.decorator';

@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('USER')
@Controller('git-manager')
export class GitManagerController {
  constructor(private readonly gitManagerService: GitManagerService) { }

  @Post('addRemote')
  async addRemote(@Body() remote: { name: string; url: string; path: string }) {
    return await this.gitManagerService.addRemote(remote);
  }

  @Get('getRemotes')
  async getRemotes() {
    return await this.gitManagerService.getRemotes();
  }

  @Delete('deleteRemote/:id')
  async deleteRemote(@Param('id') id: string) {
    return await this.gitManagerService.deleteRemote(id);
  }

}
