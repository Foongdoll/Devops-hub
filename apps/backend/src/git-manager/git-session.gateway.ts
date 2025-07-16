import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger, UseGuards } from '@nestjs/common';
import { promisify } from 'util';
import { exec } from 'child_process';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/common/decorator/rols.decorator';
import { JwtTokenService } from 'src/auth/jwt.service';
const execAsync = promisify(exec);

@WebSocketGateway({
  namespace: '/git', // ★★★ "/git" 네임스페이스(중요)
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class GitGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;
  private readonly logger = new Logger(GitGateway.name);
  constructor(
    @Inject(JwtTokenService)
    private readonly jwtService: JwtTokenService) { }

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('No token'));
        const payload = this.jwtService.verifyAccessToken(token);
        if (!payload) return next(new Error('Invalid'));
        socket.data.user = payload;
        next();
      } catch (e) {
        next(new Error('Auth failed: ' + e.message));
      }
    });
  }

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
      // 0. fetch 모든 브랜치 정보
      await execAsync(`git -C "${repoPath}" fetch --all --prune`);
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


  @SubscribeMessage('git-pull')
  async handleGitPull(
    @MessageBody() { repoPath, remote = "origin", branch = "main", strategy = "" }: { repoPath: string, remote?: string, branch?: string, strategy?: string },
    @ConnectedSocket() sock: Socket,
  ) {
    try {
      // 1. pull 명령어 조합
      let pullCmd = `git -C "${repoPath}" pull ${remote} ${branch}`;
      if (strategy === "rebase") pullCmd += " --rebase";
      if (strategy === "ff-only") pullCmd += " --ff-only";

      const { stdout, stderr } = await execAsync(pullCmd);

      const out = (stdout + stderr).toLowerCase();

      // 2. 에러/특수상황 분기
      // 1) Unstaged changes (아직 커밋되지 않은 파일이 있다)
      if (
        out.includes("unstaged changes") ||
        out.includes("your local changes to the following files would be overwritten")
      ) {
        sock.emit("git-pull-error", {
          type: "unstaged",
          message: "아직 커밋되지 않은 변경사항이 있습니다.\n먼저 커밋(Commit) 또는 스태시(Stash) 후 Pull을 다시 시도해주세요.",
          details: out,
        });
        return;
      }
      // 2) 권한(인증) 문제
      if (
        out.includes("authentication failed") ||
        out.includes("could not read from remote repository") ||
        out.includes("permission denied")
      ) {
        sock.emit("git-pull-error", {
          type: "auth",
          message: "깃 인증/권한 문제가 발생했습니다.\n깃허브 인증/토큰을 확인해주세요.",
          details: out,
        });
        return;
      }
      // 3) 충돌(Merge conflict)
      if (out.includes("conflict") || out.includes("merge conflict")) {
        // 충돌 파일 목록 추출
        const conflictFiles: string[] = [];
        const conflictRegex = /CONFLICT \(content\): Merge conflict in (.+)/gi;
        let match: RegExpExecArray | null;
        while ((match = conflictRegex.exec(out)) !== null) {
          conflictFiles.push(match[1]);
        }

        sock.emit("git-pull-conflict", {
          type: "conflict",
          message: "Merge/Rebase 중 충돌이 발생했습니다!\n아래 충돌 파일을 수정 후, '충돌 해결 완료'를 눌러주세요.",
          conflictFiles,
          details: out,
        });
        return;
      }
      // 4) 기타 에러 (stderr 존재)
      if (stderr && stderr.trim().length > 0) {
        sock.emit("git-pull-error", {
          type: "unknown",
          message: "알 수 없는 에러가 발생했습니다.",
          details: out,
        });
        return;
      }
      // 5) 성공 (fast-forward 포함)
      sock.emit("git-pull-success", {
        message: stdout || "Pull 완료!",
        details: out,
      });
    } catch (e: any) {
      // execAsync에서 오류 발생 시
      sock.emit("git-pull-error", {
        type: "exception",
        message: "깃 pull 처리 중 예외가 발생했습니다.",
        details: e.stderr || e.stdout || e.message || "",
      });
    }
  }

  @SubscribeMessage('git-conflict-check')
  async handleGitConflictCheck(
    @MessageBody() { repoPath }: { repoPath: string },
    @ConnectedSocket() sock: Socket,
  ) {
    try {
      // git status로 충돌 파일 확인
      const { stdout } = await execAsync(`git -C "${repoPath}" status --porcelain`);
      const conflictLines = stdout
        .split('\n')
        .filter(line => line.startsWith('UU '));
      const remainConflicts = conflictLines.map(line => line.slice(3).trim());
      sock.emit('git-conflict-check-result', { remainConflicts });
    } catch (e: any) {
      sock.emit('git-conflict-check-error', { message: e.message });
    }
  }

  // git-session.gateway.ts 등에서 사용
  @SubscribeMessage('git-push')
  async handleGitPush(
    @MessageBody() { repoPath, remote = "origin", branch = "main" }: { repoPath: string, remote?: string, branch?: string },
    @ConnectedSocket() sock: Socket,
  ) {
    try {
      // 1. push 명령어 구성
      const pushCmd = `git -C "${repoPath}" push ${remote} ${branch}`;

      // 2. 명령 실행
      const { stdout, stderr } = await execAsync(pushCmd);

      // 3. 권한 에러
      if (stderr.includes('Authentication failed') || stderr.includes('Permission denied')) {
        sock.emit('git-push-error', {
          message: '권한 문제가 발생했습니다. 깃허브 인증/토큰을 확인해주세요.',
          stderr,
        });
        return;
      }

      // 4. 충돌/업스트림 에러
      if (stderr.includes('rejected') && stderr.includes('fetch first')) {
        sock.emit('git-push-error', {
          message: '업스트림에 업데이트가 있습니다. 먼저 Pull 후 다시 시도해주세요.',
          stderr,
        });
        return;
      }

      // 5. 기타 에러
      if (stderr && !stdout) {
        sock.emit('git-push-error', {
          message: stderr,
        });
        return;
      }

      // 6. 성공!
      sock.emit('git-push-success', {
        message: stdout || 'Push 완료!',
      });

    } catch (e: any) {
      sock.emit('git-push-error', {
        message: e.message,
      });
    }
  }


  @SubscribeMessage('git-fetch')
  async handleGitFetch(
    @MessageBody() { repoPath, remote = "origin" }: { repoPath: string; remote?: string },
    @ConnectedSocket() sock: Socket,
  ) {
    try {
      const fetchCmd = `git -C "${repoPath}" fetch ${remote}`;
      const { stdout, stderr } = await execAsync(fetchCmd);

      if (stderr && !stdout) {
        // 1. 인증/권한 에러
        if (stderr.includes('Authentication failed') || stderr.includes('Permission denied')) {
          sock.emit('git-fetch-error', { message: "인증/권한 오류: 깃허브 인증/토큰을 확인하세요." });
          return;
        }
        // 2. 원격 저장소 불일치
        if (stderr.includes('could not read from remote repository')) {
          sock.emit('git-fetch-error', { message: "원격 저장소 오류: remote url을 확인하세요." });
          return;
        }
        // 3. 기타 에러
        sock.emit('git-fetch-error', { message: stderr });
        return;
      }

      sock.emit('git-fetch-success', { message: stdout || "Fetch 완료!" });
    } catch (e: any) {
      sock.emit('git-fetch-error', { message: e.message });
    }
  }

  @SubscribeMessage('git-stash')
  async handleGitStash(
    @MessageBody() { repoPath }: { repoPath: string },
    @ConnectedSocket() sock: Socket,
  ) {
    try {
      const stashCmd = `git -C "${repoPath}" stash push -u`;
      const { stdout, stderr } = await execAsync(stashCmd);

      if (stderr && !stdout) {
        // 1. Stash 필요 없는 경우
        if (stderr.includes('No local changes to save')) {
          sock.emit('git-stash-error', { message: "Stash할 변경사항이 없습니다." });
          return;
        }
        // 2. 기타 에러
        sock.emit('git-stash-error', { message: stderr });
        return;
      }

      sock.emit('git-stash-success', { message: stdout || "Stash 완료!" });
    } catch (e: any) {
      sock.emit('git-stash-error', { message: e.message });
    }
  }

  @SubscribeMessage('git-stash-pop')
  async handleGitStashPop(
    @MessageBody() { repoPath }: { repoPath: string },
    @ConnectedSocket() sock: Socket,
  ) {
    try {
      const popCmd = `git -C "${repoPath}" stash pop`;
      const { stdout, stderr } = await execAsync(popCmd);

      if (stderr && !stdout) {
        // 1. 충돌 발생
        if (stderr.includes('Merge conflict')) {
          sock.emit('git-stash-pop-error', { message: "Stash pop 중 충돌이 발생했습니다! 충돌 파일을 수정 후 스테이지 해주세요." });
          return;
        }
        // 2. Stash할 내역 없음
        if (stderr.includes('No stash entries found')) {
          sock.emit('git-stash-pop-error', { message: "Stash 내역이 없습니다." });
          return;
        }
        // 3. 기타 에러
        sock.emit('git-stash-pop-error', { message: stderr });
        return;
      }

      sock.emit('git-stash-pop-success', { message: stdout || "Stash pop 완료!" });
    } catch (e: any) {
      sock.emit('git-stash-pop-error', { message: e.message });
    }
  }


}
