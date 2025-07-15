import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Remote } from './entity/remote.entity';
import { Repository } from 'typeorm';
import { ApiResponse } from 'src/common/dto/response.dto';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

@Injectable()
export class GitManagerService {
  constructor(
    @InjectRepository(Remote)
    private readonly remoteRepository: Repository<Remote>,
  ) { }


  async addRemote(remote: { name: string; url: string; path: string }) {
    // 1. DB에 저장
    const newRemote = this.remoteRepository.create(remote);
    const savedRemote = await this.remoteRepository.save(newRemote);

    const { path, name, url } = remote;

    try {
      // 1. git init (이미 초기화 되어도 에러 없음)
      await execAsync(`git -C "${path}" init`);

      // 2. remote remove (이미 존재하면 삭제, 없으면 무시)
      await execAsync(`git -C "${path}" remote remove "${name}"`).catch(() => { });

      // 3. remote add (덮어쓰기)
      await execAsync(`git -C "${path}" remote add "${name}" "${url}"`);

      // 4. fetch --all (브랜치, 커밋 로그 등 최신화)
      await execAsync(`git -C "${path}" fetch --all --prune`);

    } catch (e: any) {
      // 1) DB에는 저장됐지만, 로컬 repo에는 실패!
      // 실제로는 롤백 또는 관리자 경고 등 처리 권장
      // (여기선 일단 에러 메시지 반환)
      return ApiResponse.error(
        `리모트 저장(폴더 작업) 실패: ${e.message}\n폴더/경로/권한/네트워크/Git 설치 여부를 확인하세요.`
      );
    }

    return ApiResponse.success(savedRemote, '리모트를 저장하였습니다.');
  }

  async getRemotes(): Promise<ApiResponse<Remote[]>> {
    return ApiResponse.success(await this.remoteRepository.find(), '리모트 목록을 가져왔습니다.');
  }

  async deleteRemote(id: string): Promise<ApiResponse> {
    const result = await this.remoteRepository.delete(id);
    if (result.affected === 0) {
      return ApiResponse.error('리모트를 찾을 수 없습니다.');
    }
    return ApiResponse.success(result, '리모트를 삭제하였습니다.');
  }
}
