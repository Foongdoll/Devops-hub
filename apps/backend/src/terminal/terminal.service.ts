import { Injectable } from '@nestjs/common';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { UpdateTerminalDto } from './dto/update-terminal.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { Repository } from 'typeorm';
import { ApiResponse } from 'src/common/dto/response.dto';
import { UserType } from 'src/common/decorator/user.decorator';

@Injectable()
export class TerminalService {
  constructor(
    @InjectRepository(Session)
    private readonly repo: Repository<Session>,
  ) { }

  async findAll(user: UserType) {
    return ApiResponse.success(await this.repo.find({ where: { userCd: user.sub } }), '세션 목록을 불러왔습니다.');
  }

  async findOne(id: string) {
    return ApiResponse.success(await this.repo.findOneBy({ id }), '세션을 불러왔습니다.');
  }

  async create(data: Partial<Session>) {
    const sess = this.repo.create(data);
    return ApiResponse.success(await this.repo.save(sess), '세션을 생성했습니다.');
  }

  async remove(id: string) {
    return ApiResponse.success(await this.repo.delete(id), '세션을 삭제했습니다.');
  }
}
