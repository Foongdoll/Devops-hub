import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CicdConfigEntity } from './entity/cicd-config.entity';
import { Repository } from 'typeorm';
import { CreateCicdConfigDto, UpdateCicdConfigDto } from './dto/cicd-create.dto';
import { ApiResponse } from 'src/common/dto/response.dto';
import { Session } from 'src/terminal/entities/session.entity';

@Injectable()
export class CicdService {
    constructor(
        @InjectRepository(CicdConfigEntity)
        private readonly repo: Repository<CicdConfigEntity>,
        @InjectRepository(Session)
        private readonly sessionRepo: Repository<CicdConfigEntity>,
    ) { }


    

  
}
