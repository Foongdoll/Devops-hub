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
import path from 'path';
const execAsync = promisify(exec);
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


}