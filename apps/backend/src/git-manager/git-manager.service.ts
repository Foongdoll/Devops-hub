import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Remote, UserRemoteJoin } from './entity/remote.entity';
import { In, Repository } from 'typeorm';
import { ApiResponse } from 'src/common/dto/response.dto';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { UserType } from 'src/common/decorator/user.decorator';
import { AddRemoteDto } from './dto/addRemote.dto';
import {v4 as uuid} from 'uuid';
const execFileAsync = promisify(execFile);

@Injectable()
export class GitManagerService {

  private readonly logger = new Logger(GitManagerService.name);
  constructor(
    @InjectRepository(Remote)
    private readonly remoteRepository: Repository<Remote>,
    @InjectRepository(UserRemoteJoin)
    private readonly userRemoteJoinRepository: Repository<UserRemoteJoin>,
  ) { }

  async getRemotes(user: UserType): Promise<ApiResponse<Remote[]>> {
    const remoteIds = await this.userRemoteJoinRepository.find({ where: { userCd: user.sub } });
    const remotes = await this.remoteRepository.find({ where: { id: In(remoteIds.map(remote => remote.remoteId)) } });
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
      const isGit = fs.existsSync(remote.path.replace(/\\/g, '/'));
      const remoteEntity = new Remote();
      remoteEntity.id = uuid();
      remoteEntity.name = remote.name;
      remoteEntity.url = remote.url;
      remoteEntity.path = remote.path.replace(/\\/g, '/');
            
      const userRemoteJoinEntity = this.userRemoteJoinRepository.create({
        userCd: user.sub,
        remoteId: remoteEntity.id
      });
      
      // 경로가 존재하지 않으면 디렉토리 생성
      if (!isGit) {
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
      }

      this.logger.log(`새로운 원격 저장소 추가: ${JSON.stringify(remoteEntity)}`);

      const newRemote = this.remoteRepository.create(remoteEntity);
      await this.userRemoteJoinRepository.save(userRemoteJoinEntity);
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
      const { stdout, stderr } = await execFileAsync('git', ['-C', remote.path, 'fetch', '--all']);

      const { stdout: remoteB, stderr: remoteErr } = await execFileAsync('git', ['-C', remote.path, 'branch', '-a']);
      const { stdout: localB, stderr: branchErr } = await execFileAsync('git', ['-C', remote.path, 'branch']);
      if (branchErr) {
        this.logger.error(`Git branch error: ${branchErr}`);
        return ApiResponse.error('브랜치 목록 조회에 실패했습니다.', { code: '500' });
      }

      const localBranches = localB
        .split('\n')
        .filter(b => b.trim() !== '')
        .map(b => ({ name: b.replace('* ', '').trim(), current: b.startsWith('*') }))

      const { stdout: trackingBranches, stderr: trackErr } = await execFileAsync('git', ['-C', remote.path, 'branch', '-vv']);

      var current = trackingBranches.split('\n').map(b => {
        if (b.startsWith('*')) {
          return b.split('[')[1].split(']')[0];
        }
      }).find(Boolean);

      if (current?.includes(":")) {
        current = current.split(':')[0].trim();
      }

      const remoteBranches = remoteB.split('\n').filter(b =>
        b.trim().startsWith('remotes/')).map(b =>
          ({ name: b.replace('remotes/', '').trim(), current: b.replace('remotes/', '').trim() === current ? true : false }));

      // console.log(`로컬 브랜치 목록: ${JSON.stringify(localBranches)}`);
      // console.log(`원격 브랜치 목록: ${JSON.stringify(remoteBranches)}`);


      return ApiResponse.success({ local: localBranches, remote: remoteBranches });
    } catch (error) {
      this.logger.error(`브랜치 목록 조회 중 오류 발생: ${error}`);
      return ApiResponse.error('브랜치 목록 조회에 실패했습니다.', { code: '500' });
    }
  }


}
