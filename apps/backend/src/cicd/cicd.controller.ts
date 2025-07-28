import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CicdService } from './cicd.service';
import { CicdConfigEntity } from './entity/cicd-config.entity';
import { CreateCicdConfigDto, UpdateCicdConfigDto } from './dto/cicd-create.dto';
import { ApiResponse } from 'src/common/dto/response.dto';

@Controller('cicd')
export class CicdController {
  constructor(private readonly service: CicdService) { }

  @Post()
  create(
    @Body() dto: CreateCicdConfigDto,
  ): Promise<ApiResponse> {
    return this.service.create(dto);
  }

  @Get()
  findByUser(
    @Query('userCode') userCode: string,
  ): Promise<ApiResponse> {
    return this.service.findByUser(userCode);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse> {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCicdConfigDto,
  ): Promise<ApiResponse> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ): Promise<void> {
    return this.service.remove(id);
  }

}
