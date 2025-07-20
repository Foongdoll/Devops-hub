import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Remote } from './entity/remote.entity';
import { Repository } from 'typeorm';
import { ApiResponse } from 'src/common/dto/response.dto';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import { UserType } from 'src/common/decorator/user.decorator';
import { AddRemoteDto } from './dto/addRemote.dto';
const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

@Injectable()
export class GitManagerService {

  private readonly logger = new Logger(GitManagerService.name);
  constructor(
    @InjectRepository(Remote)
    private readonly remoteRepository: Repository<Remote>,
  ) { }

  async getRemotes(user: UserType): Promise<ApiResponse<Remote[]>> {    
    const remotes = await this.remoteRepository.find({ where: { userCd: user.sub } });    
    return ApiResponse.success(remotes, '원격 저장소 목록을 가져왔습니다.');
  }
  /**
    * 원격 저장소 추가
    * @param remote 원격 저장소
    * @returns Promise<Remote>
    * @throws 에러 발생 시 예외 처리
  */
  async addRemote(remote: AddRemoteDto, user: UserType): Promise<ApiResponse<Remote>> {
    const remoteEntity = new Remote();
    remoteEntity.name = remote.name;
    remoteEntity.url = remote.url;
    remoteEntity.path = remote.path;
    remoteEntity.userCd = user.sub; 
    const newRemote = this.remoteRepository.create(remoteEntity);    
    const result = await this.remoteRepository.save(newRemote)
    console.log('새로운 원격 저장소 추가:', result);
    return ApiResponse.success(result, '원격 저장소가 추가되었습니다.');
  }
    
  /**
    * 원격 저장소 수정
    * @param remote 수정할 원격 저장소 정보
    * @returns Promise<Remote | null>
    * @throws 에러 발생 시 예외 처리
  */
  async editRemote(remote: Remote): Promise<ApiResponse<Remote | null>> {
    await this.remoteRepository.update(remote.id, remote);
    const updatedRemote = await this.remoteRepository.findOne({ where: { id: remote.id } });
    return updatedRemote ? ApiResponse.success(updatedRemote) : ApiResponse.error('Remote not found', {code : '404'});
  }
  
  /**
    * 원격 저장소 삭제
    * @param id 원격 저장소 ID
    * @returns Promise<void>
    * @throws 에러 발생 시 예외 처리
  */
  async deleteRemote(id: string): Promise<ApiResponse<void>> {
    await this.remoteRepository.delete({ id });
    return ApiResponse.success();
  }
  
  
  

}
