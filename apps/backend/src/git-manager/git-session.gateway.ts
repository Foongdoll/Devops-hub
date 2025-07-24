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
import { exec, execFile } from 'child_process';
import { JwtTokenService } from 'src/auth/jwt.service';
import { Branch, fetch_commit_history } from 'src/common/type/git.interface';
import { Remote } from './entity/remote.entity';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
const execFileAsync = promisify(execFile);

@ApiBearerAuth()
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

  // (원하는 만큼 상태/맵 등 정의) 키 : 리모트 ID, 값 : 소켓
  private sockets: Socket[] = [];
  private gitClients = new Map<string, Socket[]>();

  handleConnection(sock: Socket) {
    this.logger.log(`Git 소켓 연결됨: ${sock.id}`);
    // 연결 시 로직    
  }

  handleDisconnect(socket: Socket) {
    for (const [remoteId, sockets] of this.gitClients.entries()) {
      const filtered = sockets.filter(s => s.id !== socket.id);
      this.gitClients.set(remoteId, filtered);
    }
  }

  // 같은 리모트 사용중인 회원에게 메시지 전송
  private notifyAll(remote: Remote, message: string, type: 'pull' | 'push' | 'commit') {
    const sockets = this.gitClients.get(remote.id) || [];
    sockets.forEach(socket => {
      socket.emit('git_notify', { message, type, remote });
    });
  }

  /**
    @param data Remote
    @description
    * Git에 연결된 회원 세션 관리 합니다.
  **/
  @ApiOperation({ summary: 'Git 연결', description: '사용자가 Git에 연결합니다.' })
  @SubscribeMessage('connect_git')
  async handleConnectGit(
    @MessageBody() data: { remote: Remote },
    @ConnectedSocket() socket: Socket
  ) {
    const remoteId = data.remote.id;
    socket.join(`git_${remoteId}`); // 그룹 참여

    const existingSockets = this.gitClients.get(remoteId);

    if (existingSockets) {
      // 이미 등록된 remoteId인 경우, 배열에만 추가
      existingSockets.push(socket);
    } else {
      // 없으면 새로 배열 생성해서 set
      this.gitClients.set(remoteId, [socket]);
    }

    socket.emit('connect_git_response', { success: true, message: `Git Manager connet successful` });
  }


  /**
    * 푸시  
    * @param data Remote remoteBranch
    * @Description 
    * 원격 브랜치로 푸시합니다.
    */
  @ApiOperation({ summary: 'Git 푸시', description: '사용자가 Git 원격 브랜치로 푸시합니다.' })
  @SubscribeMessage('git_push')
  async handleGitPush(
    @MessageBody() { remote, remoteBranch }: { remote: Remote; remoteBranch: string },
    @ConnectedSocket() socket: Socket
  ) {
    try {

      // Git 명령어 실행
      const { stdout, stderr } = await execFileAsync("git", [
        "-C", remote.path,
        "push",
        remote.name,
        remoteBranch.split('/')[1],
      ]);

      this.logger.log(`Git push successful: ${stdout}`);
      socket.emit('git_push_response', { success: true, message: 'Push successful', remote: remote, remoteBranch: remoteBranch });
    } catch (error) {
      this.logger.error(`Git push command failed: ${error.message}`);
      socket.emit('git_push_response', { success: false, message: error.message });
    }
  }

  /**
  * 풀
  * @param data Remote remoteBranch
  * @Description
  * 원격 브랜치로부터 풀합니다.
  */
  @ApiOperation({ summary: 'Git Pull', description: '사용자가 Git 원격 브랜치로부터 풀합니다.' })
  @SubscribeMessage('git_pull')
  async handleGitPull(
    @MessageBody() { remote, remoteBranch }: { remote: Remote; remoteBranch: string },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      // Git 명령어 실행
      const { stdout, stderr } = await execFileAsync("git", [
        "-C", remote.path,
        "pull",
        remoteBranch.split('/')[0],
        remoteBranch.split('/')[1]
      ]);

      this.logger.log(`Git pull successful: ${stdout}`);
      this.notifyAll(remote, `Pulled from ${remoteBranch}`, 'pull');
      socket.emit('git_pull_response', { success: true, message: 'Pull successful', remote: remote, remoteBranch: remoteBranch });
    } catch (error) {
      this.logger.error(`Git pull command failed: ${error.message}`);
      socket.emit('git_pull_response', { success: false, message: error.message });
    }
  }

  /**
    * 커밋 히스토리 요청 처리
    * @param data Remote 
  */
  @ApiOperation({ summary: 'Git 커밋 히스토리 조회', description: '사용자가 Git 커밋 히스토리를 조회합니다.' })
  @SubscribeMessage('fetch_commit_history')
  async handleFetchCommitHistory(
    @MessageBody() data: { remote: Remote, branches: Branch[] },
    @ConnectedSocket() socket: Socket
  ) {

    try {
      const { remote, branches } = data;
      const commits: Map<string, fetch_commit_history[]> = new Map();

      this.logger.log(`Fetching commit history for remote: ${remote.name} at ${remote.path}`);
      const { stdout } = await execFileAsync("git", ['-C', remote.path, 'fetch', '--all']);

      for (const branch of branches) {
        // Git 명령어 실행
        const { stdout: history, stderr } = await execFileAsync("git", [
          "-C", remote.path,
          "log",
          branch.name,
          "--pretty=format:{\"hash\":\"%H\",\"parents\":\"%P\",\"message\":\"%s\",\"author\":\"%an\",\"date\":\"%ad\",\"refs\":\"%D\"}",
          "--date=iso"
        ]);

        var result = history.split('\n').map(line => JSON.parse(line)) as fetch_commit_history[];
        // JSON 파싱
        commits.set(branch.name, result);
      }

      // Map -> Object로 변환
      const commitObj = Object.fromEntries(commits);

      socket.emit('fetch_commit_history_response', commitObj);
    } catch (error) {
      this.logger.error(`Git log command failed: ${error.message}`);
      socket.emit('fetch_commit_history_response', []);
    }
  }

  /**
    변경 파일 리스트 조회
    @Param data Remote
  */
  @ApiOperation({ summary: 'Git 변경 파일 조회', description: '사용자가 Git 변경 파일을 조회합니다.' })
  @SubscribeMessage('fetch_changed_files')
  async handleFetchChangedFiles(
    @MessageBody() data: { remote: Remote },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      const { remote } = data;

      // Git 명령어 실행
      const { stdout, stderr } = await execFileAsync("git", [
        "-C", remote.path,
        "status",
        "-s"
      ]);


      // 변경된 파일 목록 파싱
      const changedFiles = stdout.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          let staged = false;
          !line.startsWith(' ') && (staged = true)

          if (line.startsWith('??')) {
            return { status: '??', path: line.split(' ')[1], staged: false };
          }

          const { status, path } = staged ? { status: line.split(' ')[0], path: line.split(' ')[2] } : { status: line.split(' ')[1], path: line.split(' ')[2] };
          return { status: status, path: path, staged };
        });

      // console.log(changedFiles);
      socket.emit('fetch_changed_files_response', changedFiles);
    } catch (error) {
      this.logger.error(`Git diff command failed: 244line: ${error.message}`);
      socket.emit('fetch_changed_files_response', []);
    }
  }

  /**
   * diff 파일 조회
   * @param data Remote
   * @param filePath 파일 경로
   */
  @ApiOperation({ summary: 'Git diff 파일 조회', description: '사용자가 Git diff 파일을 조회합니다.' })
  @SubscribeMessage('fetch_file_diff')
  async handleFetchFileDiff(
    @MessageBody() { remote, filePath, fileStaged, branch }: { remote: Remote; filePath: string, fileStaged: boolean, branch?: string },
    @ConnectedSocket() socket: Socket
  ) {
    try {

      const cmd = [
        "-C", remote.path,
        "diff",
      ]

      fileStaged && cmd.push("--cached")
      cmd.push(filePath);
      // Git 명령어 실행
      const { stdout, stderr } = await execFileAsync("git", cmd);

      socket.emit('fetch_file_diff_response', stdout);
    } catch (error) {
      this.logger.error(`Git diff command failed: ${error.message}`);
      socket.emit('fetch_file_diff_response', '');

    }
  }

  /**
    * diff 파일 조회
    * @param data Remote
    * @param filePath 파일 경로
    */
  @ApiOperation({ summary: 'Git 충돌파일 다른 내용 조회', description: '사용자가 Git 충돌파일 다른 내용을 조회합니다.' })
  @SubscribeMessage('fetch_conflict_file_diff')
  async handleFetchConflictFileDiff(
    @MessageBody() { remote, filePath, fileStaged, conflictBranch, selectedLocalBranch }: { remote: Remote; filePath: string, fileStaged: boolean, conflictBranch: string, selectedLocalBranch: string },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      // 1. 현재 브랜치(예: master)의 파일 내용
      const { stdout: left } = await execFileAsync("git", [
        "-C", remote.path,
        "show",
        `${selectedLocalBranch}:${filePath}`,
      ]);

      // 2. 비교할 브랜치(예: main)의 파일 내용
      const { stdout: right } = await execFileAsync("git", [
        "-C", remote.path,
        "show",
        `${conflictBranch}:${filePath}`,
      ]);

      // 3. diff 내용
      const diffCmd = [
        "-C", remote.path,
        "diff",
        `${selectedLocalBranch}..${conflictBranch}`,
      ];
      if (fileStaged) diffCmd.push("--cached");
      diffCmd.push(filePath);

      const { stdout: diff } = await execFileAsync("git", diffCmd);

      // 4. 응답
      socket.emit('fetch_conflict_file_diff_response', {
        left,   // 현재 브랜치 파일 내용
        right,  // 비교 대상 브랜치 파일 내용
        diff    // diff 결과
      });

    } catch (error) {
      this.logger.error(`Git conflict diff command failed: ${error.message}`);
      const { stdout: left } = await execFileAsync("git", [
        "-C", remote.path,
        "show",
        `${selectedLocalBranch}:${filePath}`,
      ]);

      socket.emit('fetch_conflict_file_diff_response', {
        left: left,
        right: '',
        diff: '',
        conflictBranch: conflictBranch,
        message: `선택한 파일이 ${conflictBranch} 브랜치에 존재하지 않습니다.\n현재 브랜치의 파일 내용만 조회합니다.`
      });
    }
  }


  /**
   * 커밋 파일 처리
   * @Param data Remote, files, message
   * @Description 
   * 커밋할 파일 목록과 커밋 메시지를 받아서 Git commit 명령어를 실행합니다.
   */
  @ApiOperation({ summary: 'Git Commit', description: '현재 Checkout된 로컬 브랜치에 커밋합니다.' })
  @SubscribeMessage('git_commit')
  async handleCommitFiles(
    @MessageBody() {
      remote,
      files,
      message,
      isPush,
      remoteBranch }: { remote: Remote; files: { path: string; staged: boolean; }[]; message: string; isPush: boolean, remoteBranch: string },
    @ConnectedSocket() socket: Socket
  ) {
    try {

      console.log(files);
      console.log(message);
      console.log(remoteBranch);
      console.log(isPush)
      console.log(remote);


      if (!files.length || !message.trim()) {
        socket.emit('git_commit_response', { success: false, message: 'No files to commit or empty commit message' });
        return;
      }

      // Git 명령어 실행
      const fileArgs = files.map(file => file.path);
      const { stdout, stderr } = await execFileAsync("git", [
        "-C", remote.path, // Assuming all files are from the same remote
        "commit",
        ...fileArgs,
        "-m", message
      ]);

      this.logger.log(`Git commit successful: ${stdout}`);

      // 푸쉬
      if (isPush) {
        const { stdout: pushStdout, stderr } = await execFileAsync("git", [
          "-C", remote.path,
          "push",
          remote.name,
          remoteBranch.split('/')[1],
        ]);
        this.logger.log(`Git push successful: ${pushStdout}`);
      }

      this.notifyAll(remote, `Committed files: ${files.map(f => f.path).join(', ')}`, 'commit');
      socket.emit('git_commit_response', { success: true, message: 'Files committed successfully', remote: remote, remoteBranch: remoteBranch });
    } catch (error) {
      this.logger.error(`Git commit command failed: ${error.message}`);
      socket.emit('git_commit_response', { success: false, message: error.message });
    }
  }

  /**
   * commit 개수 조회
   * @param data Remote remoteBranch
   * @Description
   * remoteBranch의 커밋 개수를 조회합니다.
   */
  @ApiOperation({ summary: 'Git 커밋 개수 조회', description: '사용자가 Git 커밋 개수를 조회합니다.' })
  @SubscribeMessage('fetch_commit_count')
  async handleFetchCommitCount(
    @MessageBody() { remote, remoteBranch }: { remote: Remote; remoteBranch: string },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      var tempRemote = '';
      if (remoteBranch === '') {
        const { stdout } = await execFileAsync("git", [
          "-C", remote.path,
          "branch",
          "-vv"
        ]);

        stdout.trim().split('\n').forEach(line => {
          if (line.includes('*')) {
            if (line.split('[')[1].split(']')[0].indexOf(":") < 0) {
              tempRemote = line.split('[')[1].split(']')[0];
            } else {
              tempRemote = line.split('[')[1].split(']')[0].split(':')[0];
            }
          }
        });
      }


      const targetRef = tempRemote !== '' ? tempRemote : remoteBranch;

      if (targetRef === '') {
        socket.emit('fetch_commit_count_response', {
          count: 0, message: `⚠️ There is no upstream(remote) branch set for '${remoteBranch}'.Please set an upstream branch or select a remote branch to pull from.`
        });
        return;
      }
      // Git 명령어 실행
      const { stdout, stderr } = await execFileAsync("git", [
        "-C", remote.path,
        "rev-list",
        "--count",
        `${targetRef}..HEAD`,
      ]);

      // console.log(stdout);

      const count = parseInt(stdout.trim(), 10);
      socket.emit('fetch_commit_count_response', { count: count });
    } catch (error) {
      this.logger.error(`Git rev-list command failed: ${error.message}`);
      socket.emit('fetch_commit_count_response', { count: 0 });
    }
  }

  /**
   * pull request 개수 조회
   * @param data Remote remoteBranch
   * @Description
   * remoteBranch의 pull request 개수를 조회합니다.
   */
  @ApiOperation({ summary: 'Git Pull Request 개수 조회', description: '사용자가 Git Pull Request 개수를 조회합니다.' })
  @SubscribeMessage('fetch_pull_request_count')
  async handleFetchPullRequestCount(
    @MessageBody() { remote, remoteBranch }: { remote: Remote; remoteBranch: string },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      var tempRemote = '';
      if (remoteBranch === '') {
        const { stdout } = await execFileAsync("git", [
          "-C", remote.path,
          "branch",
          "-vv"
        ]);

        stdout.trim().split('\n').forEach(line => {
          if (line.includes('*')) {
            if (line.split('[')[1].split(']')[0].indexOf(":") < 0) {
              tempRemote = line.split('[')[1].split(']')[0];
            } else {
              tempRemote = line.split('[')[1].split(']')[0].split(':')[0];
            }
          }
        });
      }

      const targetRef = tempRemote !== '' ? tempRemote : remoteBranch;
      if (targetRef === '') {
        socket.emit('fetch_commit_count_response', {
          count: 0, message: `⚠️ There is no upstream(remote) branch set for '${remoteBranch}'.Please set an upstream branch or select a remote branch to pull from.`
        });
        return;
      }
      // Git 명령어 실행
      const { stdout, stderr } = await execFileAsync("git", [
        "-C", remote.path,
        "rev-list",
        "--count",
        `HEAD..${targetRef}`,
      ]);
      // console.log(stdout);

      const count = parseInt(stdout.trim(), 10);
      socket.emit('fetch_pull_request_count_response', { count: count });
    } catch (error) {
      this.logger.error(`Git rev-list command failed: ${error.message}`);
      socket.emit('fetch_pull_request_count_response', { count: 0 });
    }
  }


  /**
   * 로컬 브랜치 checkout
   * @param data branch remote
   * @Description
   * 로컬 브랜치를 checkout 합니다.
  */
  @ApiOperation({ summary: 'Git 로컬 브랜치 체크아웃', description: '사용자가 Git 로컬 브랜치를 체크아웃합니다.' })
  @SubscribeMessage('checkout_local_branch')
  async handleCheckoutLocalBranch(
    @MessageBody() { branch, selectedRemoteBranch, remote }: { branch: string; selectedRemoteBranch: string; remote: Remote },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      // console.log([
      //   "-C", remote.path,
      //   "branch",
      //   "--list",
      //   branch
      // ]);
      // 1. 브랜치 존재 여부 확인
      const { stdout: branchList } = await execFileAsync("git", [
        "-C", remote.path,
        "branch",
        "--list",
        branch
      ]);
      const branchExists = branchList.split('\n').map(b => b.replace('*', '').trim()).filter(Boolean).includes(branch);

      let checkoutResult;
      if (branchExists) {
        // 이미 브랜치가 있으면 그냥 이동
        checkoutResult = await execFileAsync("git", [
          "-C", remote.path,
          "checkout",
          branch,
        ]);
      } else {
        // 없으면 -b 옵션으로 생성
        checkoutResult = await execFileAsync("git", [
          "-C", remote.path,
          "checkout",
          "-b",
          branch,
          selectedRemoteBranch // 기준 브랜치로 체크아웃
        ]);
      }

      this.logger.log(`Git checkout local branch successful: ${checkoutResult.stdout}`);
      socket.emit('checkout_local_branch_response', {
        success: true, message: branchExists
          ? `로컬 브랜치 ${branch}로 체크아웃 하였습니다.`
          : `원격 브랜치 ${selectedRemoteBranch}로 체크아웃 후 로컬 브랜치 ${branch}를 생성하였습니다.`
        , branch: branch,
        remote: remote,
      });
    } catch (error) {
      this.logger.error(`Git checkout command failed: ${error.message}`);
      // would be overwritten by checkout 이게 있으면 충돌 난거니까 
      // 커밋하거나 머지한 뒤 브랜치를 바꿔라 안내 메시지
      const message = error.message as string;
      var responseMsg = "로컬 브랜치 변경 실패: 알 수 없는 오류가 발생하였습니다.";
      const conflictFiles: { path: string; name: string; status: string; staged: boolean; }[] = [];
      var isFiles = false;
      if (message.includes('would be overwritten by checkout')) {
        responseMsg = "로컬 브랜치 변경 실패: 현재 작업 중인 내용이 있습니다. 커밋하거나 머지한 뒤 다시 시도해주세요.";
        message.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed.includes('would be overwritten by checkout')) {
            isFiles = true;
            return;
          }
          if (trimmed.startsWith('Please commit your changes') || trimmed === 'Aborting') {
            isFiles = false;
            return;
          }
          if (isFiles && trimmed && !trimmed.startsWith('error:')) {
            conflictFiles.push({
              path: trimmed,
              name: trimmed.split('/').pop() || trimmed, // 파일명 추출
              status: "",
              staged: false
            });
          }
        });
      }


      socket.emit('checkout_local_branch_response', { success: false, message: responseMsg, conflictFiles: conflictFiles, branch: branch });
    }
  }

  /**
   * @param data { branch: string, remote: Remote }
   * @description 원격 브랜치 체크아웃
   */
  @SubscribeMessage('checkout_remote_branch')
  async handleCheckoutRemoteBranch(
    @MessageBody() data: { conflictBranch: string; remoteBranch: string; remote: Remote },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      const { remoteBranch, conflictBranch, remote } = data;

      const { stdout } = await execFileAsync("git", [
        "-C", remote.path,
        "branch",
        "--set-upstream-to=" + remoteBranch,
        conflictBranch
      ]);

      this.logger.log(`Git checkout remote branch successful: ${stdout}`);
      socket.emit('checkout_remote_branch_response', { success: true, message: `로컬 브랜치 '${conflictBranch}'를 원격 브랜치 '${remoteBranch}'로 체크아웃 하였습니다.`, branch: conflictBranch, remote: remote });
    } catch (error) {
      this.logger.error(`Git checkout remote branch command failed: ${error.message}`);
      socket.emit('checkout_remote_branch_response', { success: false, message: error.message });
    }
  }

  /**
   * @param data { remote: Remote }
   * @description 로컬, 리모트 브랜치 전달
  */
  @SubscribeMessage('git_get_branches')
  async handleGitGetBranches(
    @MessageBody() data: { remote: Remote },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      // 1. 모든 로컬 브랜치
      const { stdout: localStdout } = await execFileAsync("git", [
        "-C", data.remote.path,
        "branch",
        "--list"
      ]);

      // 2. 모든 원격 브랜치
      const { stdout: remoteStdout } = await execFileAsync("git", [
        "-C", data.remote.path,
        "branch",
        "-r"
      ]);

      // 파싱 (이름만 추출, 공백/문자열 정리)
      const localBranches = localStdout
        .split('\n')
        .map(x => x.replace(/^[* ]+/, '').trim())
        .filter(Boolean);

      const remoteBranches = remoteStdout
        .split('\n')
        .map(x => x.trim())
        .filter(Boolean);

      // 결과 전송
      socket.emit('git_get_branches_response', {
        local: localBranches,
        remote: remoteBranches
      });

    } catch (e) {
      socket.emit('git_get_branches_error', { message: e.message });
    }
  }


  /** 
    @param data { remote: Remote, filePath: string }
    @description 변경 사항 전체 버리기
  */
  @SubscribeMessage('discard_all')
  async handleDiscardAll(
    @MessageBody() data: { remote: any; filePath: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`Discard All Changes 요청: ${JSON.stringify(data)}`);
    const { remote, filePath } = data;

    // TODO: 실제 git checkout -- filePath 로직 호출
    try {
      // 예시: discardChanges 함수가 실제 로컬에서 git checkout 실행
      const { stdout, stderr } = await execFileAsync("git", [
        "-C", remote.path,
        "checkout",
        "--",
        filePath
      ]);

      const { stdout: res } = await execFileAsync("git", ["-C", remote.path, "clean", "-fd"]);
      this.logger.log(`Discard All Changes 성공: ${stdout} ${res}`);
      socket.emit('discard_all_success', { filePath });
    } catch (error) {
      this.logger.error('Discard All Error', error);
      socket.emit('discard_all_error', { filePath, error: error?.message ?? error });
    }
  }

  @SubscribeMessage('fetch_change_count')
  async handleFetchChangeCount(
    @MessageBody() data: { remote: Remote },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      const { remote } = data;
      const { stdout } = await execFileAsync("git", [
        "-C", remote.path, // 또는 remote.path
        "status",
        "--porcelain"
      ]);

      const changedFiles = stdout
        .split('\n')         // 줄 단위로 분리
        .filter(line => line.trim() !== ''); // 빈 줄 제외
      const count = changedFiles.length;

      socket.emit('fetch_change_count_response', { count });
    } catch (error) {
      this.logger.error(`Git status command failed: ${error.message}`);
      socket.emit('fetch_change_count_response', { count: 0, message: error.message });
    }
  }
}