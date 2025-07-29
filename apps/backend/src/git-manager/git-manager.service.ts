import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Remote, UserRemoteJoin } from './entity/remote.entity';
import { In, Repository } from 'typeorm';
import { ApiResponse } from 'src/common/dto/response.dto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { UserType } from 'src/common/decorator/user.decorator';
import { AddRemoteDto } from './dto/addRemote.dto';
import { v4 as uuid } from 'uuid';
import { Branch, File, Stash } from 'src/common/type/git.interface';
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
      const { stdout: trackingBranches } = await execFileAsync('git', ['-C', remote.path, 'branch', '-vv']);

      // 🧠 Build tracking map from -vv output
      const trackingMap: Record<string, string | undefined> = {};
      trackingBranches.split('\n').forEach(line => {
        const match = line.match(/^\*?\s+(\S+)\s+[a-f0-9]+\s+\[([^\]]+)\]/);
        if (match) {
          const local = match[1]; // branch name
          const upstream = match[2].split(':')[0].trim(); // just 'origin/branch'
          trackingMap[local] = upstream;
        }
      });

      // ✅ Local branches with upstream
      const localBranches: Branch[] = localB
        .split('\n')
        .filter(b => b.trim() !== '')
        .map(line => {
          const current = line.startsWith('*');
          const name = line.replace('* ', '').trim();
          return {
            name,
            current,
            upstream: trackingMap[name] ?? undefined,
          };
        });

      // ✅ Detect current remote branch from -vv output
      let currentRemoteBranch: string | undefined = trackingBranches
        .split('\n')
        .map(b => b.startsWith('*') ? b.split('[')[1]?.split(']')[0] : undefined)
        .find(Boolean);

      if (currentRemoteBranch?.includes(':')) {
        currentRemoteBranch = currentRemoteBranch.split(':')[0].trim();
      }

      const remoteBranches: Branch[] = remoteB
        .split('\n')
        .filter(b => b.trim().startsWith('remotes/'))
        .map(b => {
          const name = b.replace('remotes/', '').trim();
          return {
            name,
            current: name === currentRemoteBranch,
          };
        });

      return ApiResponse.success({ local: localBranches, remote: remoteBranches });
    } catch (error) {
      this.logger.error(`브랜치 목록 조회 중 오류 발생: ${error}`);
      return ApiResponse.error('브랜치 목록 조회에 실패했습니다.', { code: '500' });
    }
  }

  async fetchStashs(remote: Remote): Promise<ApiResponse> {
    try {
      const { stdout, stderr } = await execFileAsync('git', ['-C', remote.path, 'stash', 'list']);
      const lines = stdout.split('\n').filter(line => line.trim() !== '');

      const result = await Promise.all(
        lines.map(async (line) => {
          const name = line.split(':')[0];
          const message = line.split(':')[1];

          if (!name || !message) {
            return null;
          }

          const { stdout: filesStr } = await execFileAsync('git', ['-C', remote.path, 'stash', 'show', '--name-only', name]);
          const files = filesStr
            .split('\n')
            .filter(f => f.trim() !== '')
            .map(f => ({ status: 'M', path: f, name: f, staged: false })) as File[];

          return { name, message, files } as Stash;
        })
      );

      return ApiResponse.success(result, '스태시 목록을 가져왔습니다.');
    } catch (error) {
      return ApiResponse.error('스태시 목록 조회에 실패했습니다.', { code: '500' });
    }
  }

  async applyStash(remote: Remote, stashName: string): Promise<ApiResponse> {
    try {
      const { stdout, stderr } = await execFileAsync('git', ['-C', remote.path, 'stash', 'apply', stashName]);
      this.logger.log(`스태시 적용 성공: ${stdout}`);
      return ApiResponse.success(undefined, '스태시가 적용되었습니다.', { type: 'success' });
    } catch (error) {
      this.logger.error(`스태시 적용 중 오류 발생: ${error}`);
      return ApiResponse.error('스태시 적용에 실패했습니다.', { type: 'error' });
    }
  }

  async dropStash(remote: Remote, stashName: string): Promise<ApiResponse> {
    try {
      const { stdout, stderr } = await execFileAsync('git', ['-C', remote.path, 'stash', 'drop', stashName]);
      this.logger.log(`스태시 삭제 성공: ${stdout}`);
      return ApiResponse.success(undefined, '스태시가 삭제되었습니다.');
    } catch (error) {
      this.logger.error(`스태시 삭제 중 오류 발생: ${error}`);
      return ApiResponse.error('스태시 삭제에 실패했습니다.', { type: 'error' });
    }
  }
}
