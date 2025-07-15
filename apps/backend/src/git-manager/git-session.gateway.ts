// src/git/git.gateway.ts
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

}
