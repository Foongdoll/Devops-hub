import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { promisify } from 'util';
import { exec } from 'child_process';
const execAsync = promisify(exec);

@WebSocketGateway({
  namespace: '/git', // ★★★ "/git" 네임스페이스(중요)
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class GitGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;
  private readonly logger = new Logger(GitGateway.name);

  // (원하는 만큼 상태/맵 등 정의)
  private gitClients = new Map<string, any>();

  handleConnection(sock: Socket) {
    this.logger.log(`Git 소켓 연결됨: ${sock.id}`);
    // 연결 시 로직
    this.gitClients.set(sock.id, {});
  }
  handleDisconnect(sock: Socket) {
    this.logger.log(`Git 소켓 연결 해제: ${sock.id}`);
    this.gitClients.delete(sock.id);
  }


  // 선택된 원격 저장소의 커밋 히스토리 반환
  @SubscribeMessage('git-all-branches-commits')
  async handleAllBranchesCommits(
    @MessageBody() { repoPath, limit }: { repoPath: string; limit?: number },
    @ConnectedSocket() sock: Socket,
  ) {
    try {
      // 1. 모든 브랜치 이름 가져오기
      const branchRes = await execAsync(`git -C "${repoPath}" branch -r --format="%(refname:short)"`);
      const branches = branchRes.stdout.split('\n').map(b => b.trim()).filter(Boolean);

      // 2. 각 브랜치별 커밋 히스토리 가져오기 (최대 30개씩)
      const branchCommitList = await Promise.all(
        branches.map(async branch => {
          const logCmd = `git -C "${repoPath}" log ${branch} --pretty=format:"%h|%d|%an|%ad|%s" --date=iso --max-count=${limit || 30}`;
          const { stdout } = await execAsync(logCmd);
          const commits = stdout.split('\n').filter(Boolean).map(line => {
            const [hash, decorate, author, date, message] = line.split('|');
            // decorate 파싱(브랜치/HEAD/태그)
            const refs: string[] = [];
            if (decorate && decorate.includes('->')) {
              const refStr = decorate.replace(/^\s*\(|\)\s*$/g, '');
              refStr.split(',').forEach(ref => {
                const refName = ref.replace(/HEAD\s*->\s*/, '').trim();
                if (refName) refs.push(refName);
              });
            }
            return { hash, message, branches: refs, date, author };
          });
          return { branch, commits };
        })
      );

      sock.emit('git-all-branches-commits-data', branchCommitList);
    } catch (e: any) {
      sock.emit('git-all-branches-commits-error', e.message);
    }
  }

  @SubscribeMessage('git-status')
  async getGitStatus(
    @MessageBody() { repoPath }: { repoPath: string; },
    @ConnectedSocket() sock: Socket,
  ) {
    try {
      this.logger.log(`Git status 요청: ${repoPath}`);
      const { stdout } = await execAsync(`git -C "${repoPath}" status --porcelain`);
      this.logger.log(`Git status stdout: ${stdout}`);

      const result = stdout.split('\n')
        .filter(Boolean)
        .map(line => {
          // 예: ' M src/App.tsx'
          const [statusA, statusB, ...fileArr] = line.split('');
          const file = line.slice(3).trim();
          return {
            file,
            staged: statusA !== ' ' && statusA !== '?',
            status: (statusA + statusB).trim() || statusB.trim(), // 예: 'M', 'A', 'D', '??'
          };
        });

      this.logger.log(`Git status 결과: ${result.length}개 파일`);
      sock.emit('git-status-data', result);
    } catch (e) {
      this.logger.error(`Git status 에러: ${e.message}`);
      sock.emit('git-status-error', e.message)
    }
  }

  @SubscribeMessage('git-diff-file')
  async handleGitDiffFile(
    @MessageBody() { repoPath, file }: {
      repoPath: string, file: { file: string; staged: boolean; status: string; }
    },
    @ConnectedSocket() sock: Socket,
  ) {
    try {
      this.logger.log(`Git diff 요청: ${repoPath}, 파일: ${file.file}, staged: ${file.staged}`);
      const diffCmd = file.staged
        ? `git -C "${repoPath}" diff --cached -- ${file.file}`
        : `git -C "${repoPath}" diff -- ${file.file}`;
      const { stdout } = await execAsync(diffCmd);
      // this.logger.log(`Git diff 결과: ${stdout}`);
      sock.emit('git-diff-file-data', { file, diff: stdout });
    } catch (e) {
      sock.emit('git-diff-file-error', { file, error: e.message });
    }
  }
  
  @SubscribeMessage('git-commit')
  async handleGitCommit(
    @MessageBody() payload: {
      stagedFiles: { file: string; staged: boolean; status: string }[];
      commitMsg: string;
      repoPath: string;
      isPushForward?: boolean;
    },
    @ConnectedSocket() sock: Socket,
  ) {
    const { stagedFiles, commitMsg, repoPath, isPushForward } = payload;

    try {
      if (!repoPath || !commitMsg || !Array.isArray(stagedFiles) || stagedFiles.length === 0) {
        throw new Error('필수 정보 누락: repoPath, commitMsg, stagedFiles');
      }

      // 1. git add (스테이지에 안올라간게 있으면)
      const unstaged = stagedFiles.filter(f => !f.staged);
      if (unstaged.length > 0) {
        // 보안상 경로 체크 (필요시 추가)
        for (const f of unstaged) {
          if (!/^[\w.\-\\/]+$/.test(f.file)) {
            throw new Error(`유효하지 않은 파일명: ${f.file}`);
          }
        }
        const addFiles = unstaged.map(f => `"${f.file}"`).join(' ');
        await execAsync(`git -C "${repoPath}" add ${addFiles}`);
      }

      // 2. git commit
      // (메시지에 쌍따옴표/특수문자 처리)
      const safeMsg = commitMsg.replace(/"/g, '\\"');
      const commitCmd = `git -C "${repoPath}" commit -m "${safeMsg}"`;
      const { stdout: commitStdout, stderr: commitStderr } = await execAsync(commitCmd);

      this.logger.log(`[${repoPath}] commit stdout: ${commitStdout}`);
      if (commitStderr) this.logger.warn(`[${repoPath}] commit stderr: ${commitStderr}`);

      // 3. (선택) git push
      let pushResult = '';
      if (isPushForward) {
        // 안전하게 기본 remote(branch 자동 감지)
        // (실제 운영엔 브랜치, remote명 파라미터화 권장)
        try {
          const { stdout: branchStdout } = await execAsync(`git -C "${repoPath}" rev-parse --abbrev-ref HEAD`);
          const branch = branchStdout.trim();
          const { stdout: remoteStdout } = await execAsync(`git -C "${repoPath}" remote`);
          const remote = remoteStdout.split('\n')[0]?.trim() || 'origin';

          const pushCmd = `git -C "${repoPath}" push ${remote} ${branch}`;
          const { stdout: pushOut, stderr: pushErr } = await execAsync(pushCmd);
          pushResult = pushOut + (pushErr || '');
        } catch (pushErr: any) {
          this.logger.error(`[${repoPath}] git push error: ${pushErr.message}`);
          sock.emit('git-commit-error', `커밋 성공, 푸시 실패: ${pushErr.message}`);
          return;
        }
      }

      // 4. 성공 응답
      sock.emit('git-commit-success', {
        message: '커밋 성공',
        commitStdout,
        pushResult,
      });

    } catch (e: any) {
      this.logger.error(`git-commit-error: ${e.message}`);
      sock.emit('git-commit-error', e.message || '커밋 과정에서 오류 발생');
    }
  }


}
