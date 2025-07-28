import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CicdConfigEntity } from './entity/cicd-config.entity';
import { Repository } from 'typeorm';
import { CreateCicdConfigDto, UpdateCicdConfigDto } from './dto/cicd-create.dto';
import { ApiResponse } from 'src/common/dto/response.dto';

@Injectable()
export class CicdService {
    constructor(
        @InjectRepository(CicdConfigEntity)
        private readonly repo: Repository<CicdConfigEntity>,
    ) { }

    async create(dto: CreateCicdConfigDto): Promise<ApiResponse> {
        const entity = this.repo.create(dto);
        return ApiResponse.success(this.repo.save(entity), 'CICD 설정이 저장되었습니다.');
    }

    async findByUser(userCode: string): Promise<ApiResponse> {
        return ApiResponse.success(this.repo.find({ where: { userCode } }), "CICD 목록을 불러왔습니다.");
    }

    async findOne(id: string): Promise<ApiResponse> {
        const cfg = await this.repo.findOne({ where: { id } });
        if (!cfg) throw new NotFoundException(`Config ${id} not found`);
        return ApiResponse.success(cfg);
    }

    async update(id: string, dto: UpdateCicdConfigDto): Promise<ApiResponse> {
        await this.repo.update(id, dto);
        return ApiResponse.success(this.findOne(id));
    }

    async remove(id: string): Promise<void> {
        await this.repo.delete(id);
    }

}
