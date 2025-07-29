import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CicdService } from './cicd.service';
import { CicdConfigEntity } from './entity/cicd-config.entity';
import { CreateCicdConfigDto, UpdateCicdConfigDto } from './dto/cicd-create.dto';
import { ApiResponse } from 'src/common/dto/response.dto';

@Controller('cicd')
export class CicdController {
  constructor(private readonly service: CicdService) { }
  
  

}
