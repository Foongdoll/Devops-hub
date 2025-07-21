import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Remote } from './entity/remote.entity';
import { Repository } from 'typeorm';
import { ApiResponse } from 'src/common/dto/response.dto';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import { UserType } from 'src/common/decorator/user.decorator';
import { AddRemoteDto } from './dto/addRemote.dto';
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
  async addRemote(remote: AddRemoteDto, user: UserType): Promise<ApiResponse> {
    try {
      const remoteEntity = new Remote();
      remoteEntity.name = remote.name;
      remoteEntity.url = remote.url;
      remoteEntity.path = remote.path.replace(/\\/g, '/');
      remoteEntity.userCd = user.sub;

      this.logger.log(`새로운 원격 저장소 추가: ${JSON.stringify(remoteEntity)}`);
      // Git 초기화 및 원격 저장소 추가
      const initArgs = ['-C', remoteEntity.path, 'init'];
      const { stdout: initOut, stderr: initErr } = await execFileAsync('git', initArgs)

      this.logger.log(`Git init output: ${initOut}`);

      // 원격 저장소 추가
      const addRemoteArgs = ['-C', remoteEntity.path, 'remote', 'add', remoteEntity.name, remoteEntity.url];
      const { stdout: addRemoteOut, stderr: addRemoteErr } = await execFileAsync('git', addRemoteArgs);
      
      this.logger.log(`Git add remote output: ${addRemoteOut}`);

      // 원격 저장소 업데이트
      const updateArgs = ['-C', remoteEntity.path, 'remote', 'update'];
      const { stdout: updateOut, stderr: updateErr } = await execFileAsync('git', updateArgs);

      this.logger.log(`Git update remote output: ${updateOut}`);

      const { stdout: branches, stderr: branchErr } = await execFileAsync('git', ['-C', remoteEntity.path, 'branch', '-r']);
      const remoteBranch = branches.split('\n')[0].split('/')[1].trim();

      // 원격 저장소 트래킹 브랜치 생성
      const trackingBranchArgs = ['-C', remoteEntity.path, 'checkout', remoteBranch];
      const { stdout: trackingBranchOut, stderr: trackingBranchErr } = await execFileAsync('git', trackingBranchArgs);

      this.logger.log(`Git tracking branch output: ${trackingBranchOut}`);

      const newRemote = this.remoteRepository.create(remoteEntity);
      const result = await this.remoteRepository.save(newRemote)

      this.logger.log('새로운 원격 저장소 추가:', result);
      return ApiResponse.success(result, '원격 저장소가 추가되었습니다.');
    } catch (error) {
      this.logger.error(`원격 저장소 추가 중 오류 발생: ${error}`);
      return ApiResponse.error('원격 저장소 추가에 실패했습니다.', { code: '500' });
    }
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
    return updatedRemote ? ApiResponse.success(updatedRemote) : ApiResponse.error('Remote not found', { code: '404' });
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


  /**
    * 브랜치 목록 조회
    * @param remote 원격 저장소 정보
    * @returns Promise<{ local: Remote[], remote: Remote[], tracking: TrackingBranch[] }>
    * @throws 에러 발생 시 예외 처리
  */
  async fetchBranches(remote: Remote): Promise<ApiResponse> {
    try {
      const { stdout: branches, stderr: branchErr } = await execFileAsync('git', ['-C', remote.path, 'branch', '-a']);
      if (branchErr) {
        this.logger.error(`Git branch error: ${branchErr}`);
        return ApiResponse.error('브랜치 목록 조회에 실패했습니다.', { code: '500' });
      }

      const localBranches = branches.split('\n').filter(b => b.startsWith('*')).map(b => ({ name: b.replace('* ', '').trim(), current: true }));
      const remoteBranches = branches.split('\n').filter(b => b.startsWith('remotes/')).map(b => ({ name: b.replace('remotes/', '').trim() }));
      const trackingBranches = []; // 트래킹 브랜치 로직은 추가 필요

      return ApiResponse.success({ local: localBranches, remote: remoteBranches, tracking: trackingBranches });
    } catch (error) {
      this.logger.error(`브랜치 목록 조회 중 오류 발생: ${error}`);
      return ApiResponse.error('브랜치 목록 조회에 실패했습니다.', { code: '500' });
    }
  }


}
