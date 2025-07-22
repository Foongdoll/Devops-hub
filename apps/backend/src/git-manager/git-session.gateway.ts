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
import { fetch_commit_history } from 'src/common/type/git.interface';
import { Remote } from './entity/remote.entity';
const execFileAsync = promisify(execFile);


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


  /**
    * 커밋 히스토리 요청 처리
    * @param data Remote 
  */
  @SubscribeMessage('fetch_commit_history')
  async handleFetchCommitHistory(
    @MessageBody() remote: Remote,
    @ConnectedSocket() socket: Socket
  ) {

    try {
      // Git 명령어 실행
      const { stdout: history, stderr } = await execFileAsync("git", [
        "-C", remote.path,
        "log",
        "--pretty=format:{\"hash\":\"%H\",\"parents\":\"%P\",\"message\":\"%s\",\"author\":\"%an\",\"date\":\"%ad\",\"refs\":\"%D\"}",
        "--date=iso"
      ]);

      if (stderr) {
        this.logger.error(`Git log error: ${stderr}`);
        socket.emit('fetch_commit_history_response', []);
        return;
      }
      // JSON 파싱
      const commits = history.split('\n').map(line => JSON.parse(line)) as fetch_commit_history[];

      socket.emit('fetch_commit_history_response', commits);
    } catch (error) {
      this.logger.error(`Git log command failed: ${error.message}`);
      socket.emit('fetch_commit_history_response', []);
    }
  }
  /**
    변경 파일 리스트 조회
    @Param data Remote
  */
  @SubscribeMessage('fetch_changed_files')
  async handleFetchChangedFiles(
    @MessageBody() remote: Remote,
    @ConnectedSocket() socket: Socket
  ) {

    try {
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

          const { status, path } = staged ? { status: line.split(' ')[0], path: line.split(' ')[2] } : { status: line.split(' ')[1], path: line.split(' ')[2] };
          return { status: status, path: path, staged };
        });

      // console.log(changedFiles);
      socket.emit('fetch_changed_files_response', changedFiles);
    } catch (error) {
      this.logger.error(`Git diff command failed: ${error.message}`);
      socket.emit('fetch_changed_files_response', []);
    }
  }

  /**
     * diff 파일 조회
     * @param data Remote
     * @param filePath 파일 경로
     */
  @SubscribeMessage('fetch_file_diff')
  async handleFetchFileDiff(
    @MessageBody() { remote, filePath, fileStaged }: { remote: Remote; filePath: string, fileStaged: boolean },
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
   * 커밋 파일 처리
   * @Param data Remote, files, message
   * @Description 
   * 커밋할 파일 목록과 커밋 메시지를 받아서 Git commit 명령어를 실행합니다.
   */
  @SubscribeMessage('commit_files')
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
      if (!files.length || !message.trim()) {
        socket.emit('commit_files_response', { success: false, message: 'No files to commit or empty commit message' });
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
        const { stdout: pushStdout, stderr: pushStderr } = await execFileAsync("git", [
          "-C", remote.path,
          "push"
        ]);
        this.logger.log(`Git push successful: ${pushStdout}`);
      }

      socket.emit('commit_files_response', { success: true, message: 'Files committed successfully' });
    } catch (error) {
      this.logger.error(`Git commit command failed: ${error.message}`);
      socket.emit('commit_files_response', { success: false, message: error.message });
    }
  }

  /**
   * commit 개수 조회
   * @param data Remote remoteBranch
   * @Description
   * remoteBranch의 커밋 개수를 조회합니다.
   */
  @SubscribeMessage('fetch_commit_count')
  async handleFetchCommitCount(
    @MessageBody() { remote, remoteBranch }: { remote: Remote; remoteBranch: string },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      // Git 명령어 실행
      const { stdout, stderr } = await execFileAsync("git", [
        "-C", remote.path,
        "rev-list",
        "--count",
        remoteBranch + "..HEAD"
      ]);

      console.log(stdout);

      const count = parseInt(stdout.trim(), 10);
      socket.emit('fetch_commit_count_response', { count });
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
  @SubscribeMessage('fetch_pull_request_count')
  async handleFetchPullRequestCount(
    @MessageBody() { remote, remoteBranch }: { remote: Remote; remoteBranch: string },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      // Git 명령어 실행
      const { stdout, stderr } = await execFileAsync("git", [
        "-C", remote.path,
        "rev-list",
        "--count",
        "HEAD.." + remoteBranch
      ]);
      console.log(stdout);

      const count = parseInt(stdout.trim(), 10);
      socket.emit('fetch_pull_request_count_response', { count });
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
  @SubscribeMessage('checkout_local_branch')
  async handleCheckoutLocalBranch(
    @MessageBody() { branch, selectedRemoteBranch, selectedRemote }: { branch: string; selectedRemoteBranch: string; selectedRemote: Remote },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      // 1. 브랜치 존재 여부 확인
      const { stdout: branchList } = await execFileAsync("git", [
        "-C", selectedRemote.path,
        "branch",
        "--list",
        branch
      ]);
      const branchExists = branchList.split('\n').map(b => b.replace('*', '').trim()).filter(Boolean).includes(branch);

      let checkoutResult;
      if (branchExists) {
        // 이미 브랜치가 있으면 그냥 이동
        checkoutResult = await execFileAsync("git", [
          "-C", selectedRemote.path,
          "checkout",
          branch,
        ]);
      } else {
        // 없으면 -b 옵션으로 생성
        checkoutResult = await execFileAsync("git", [
          "-C", selectedRemote.path,
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
      });
    } catch (error) {
      this.logger.error(`Git checkout command failed: ${error.message}`);
      socket.emit('checkout_local_branch_response', { success: false, message: error.message });
    }
  }



}