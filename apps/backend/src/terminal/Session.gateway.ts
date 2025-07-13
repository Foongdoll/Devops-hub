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
import { Client as SSHClient } from 'ssh2';
import { TerminalService } from './terminal.service';
import { Logger } from '@nestjs/common';
import { createLogger } from 'src/common/Log/logger.service';

interface StartPayload { sessionId: string; }
interface InputPayload { data: string; }

@WebSocketGateway({
  cors: {
    // origin: 'http://13.124.87.223', // 배포 주소/
    origin: 'http://localhost:5173', // 개발 주소/
    credentials: true,
  },
})
export class SessionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;

  // 맵: socket.id → { ssh: SSHClient, stream: any }
  private clients = new Map<string, { ssh: SSHClient; stream: any }>();

  constructor(private readonly sessions: TerminalService) { }

  handleConnection(sock: Socket) {
    // 연결 시 로그
    Logger.log(createLogger({
      message: '웹소켓 연결',
      level: 'info',
      path: '/terminal/connect',
      timestamp: new Date(),
    }));
  }

  handleDisconnect(sock: Socket) {
    const entry = this.clients.get(sock.id);
    if (entry) {
      entry.stream.end();
      entry.ssh.end();
      this.clients.delete(sock.id);
    }
    Logger.log(createLogger({
      message: '웹소켓 연결 해제 - ' + sock.id,
      level: 'info',
      path: '/terminal/disconnect',
      timestamp: new Date(),
    }));
  }

  @SubscribeMessage('start')
  async onStart(
    @MessageBody() payload: StartPayload,
    @ConnectedSocket() sock: Socket,
  ) {
    const sess = await this.sessions.findOne(payload.sessionId);
    if (!sess) {
      sock.emit('error', 'Session not found');
      return;
    }
    Logger.log(sess);

    // ==== 1. platform에 따라 username 자동 선택 ====
    let username = sess.username;
    if (!username || username.trim() === "") {
      if (sess.platform === "aws" || sess.host?.includes('amazonaws.com')) {
        // aws: ec2-user, ubuntu, centos 등
        username = sess.osType === 'ubuntu' ? 'ubuntu' :
          sess.osType === 'centos' ? 'centos' : 'ec2-user';
      } else if (sess.platform === "oracle" || sess.host?.includes('oraclecloud.com')) {
        username = "opc";
      }
      // 필요시 기타 플랫폼 추가
    }

    // ==== 2. SSH 옵션 세팅 ====
    const ssh = new SSHClient();
    ssh.on('ready', () => {
      ssh.shell((err, stream) => {
        if (err) {
          Logger.log(createLogger({
            message: `세션 연결 실패 - ${sess.id} - ${err}`,
            level: 'error',
            path: '/terminal/connect',
            timestamp: new Date(),
          }));
          sock.emit('error', 'Shell error: ' + err.message);
          return ssh.end();
        }
        this.clients.set(sock.id, { ssh, stream });

        // SSH → WS
        stream.on('data', (data: Buffer) => {
          sock.emit('output', data.toString());
        });
        stream.on('close', () => ssh.end());

        // WS → SSH
        sock.on('input', (inp: InputPayload) => {
          stream.write(inp.data);
        });
      });
    });

    // ==== 3. connect 옵션 조립 ====
    const connectOpts: any = {
      host: sess.host,
      port: sess.port || 22,
      username,
      tryKeyboard: true,  // keyboard-interactive도 fallback 허용
      // passphrase: 필요시 pem의 비번
    };
    if (sess.authMethod === 'key' && sess.privateKey) {
      connectOpts.privateKey = sess.privateKey;
      if (sess.passphrase) connectOpts.passphrase = sess.passphrase;
    } else if (sess.password) {
      connectOpts.password = sess.password;
    }

    Logger.log(createLogger({
      message: `SSH 옵션: ${JSON.stringify({
        host: connectOpts.host,
        port: connectOpts.port,
        username: connectOpts.username,
        hasKey: !!connectOpts.privateKey,
      })}`,
      level: 'info',
      path: '/terminal/connect',
      timestamp: new Date(),
    }));

    ssh.connect(connectOpts);
  }
}