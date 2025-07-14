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
import { ConnectConfig, SFTPWrapper, Client as SSHClient } from 'ssh2';
import { TerminalService } from './terminal.service';
import { Logger } from '@nestjs/common';
import { createLogger } from 'src/common/Log/logger.service';
import SftpClient from 'ssh2-sftp-client'


interface StartPayload { sessionId: string; }
interface InputPayload { data: string; }
// SFTP 업로드 페이로드 타입
interface UploadPayload {
  /** 원격에 업로드할 디렉터리 경로 (예: '/home/ubuntu') */
  remotePath: string;
  /** 업로드할 파일 이름 */
  fileName: string;
  /** FileReader로 읽은 base64 인코딩 문자열 */
  data: string;
}
interface ListPayload {
  remotePath: string;
}
// SFTP 다운로드 페이로드 타입
interface DownloadPayload {
  /** 다운로드할 원격 파일 전체 경로 (예: '/home/ubuntu/logs/app.log') */
  remoteFile: string;
}

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
  private sftpClients = new Map<string, SftpClient>();
  private readonly logger = new Logger(SessionsGateway.name);
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
    // --- 1. Fetch session ---
    const apiRes = await this.sessions.findOne(payload.sessionId);
    const sess = apiRes.data;
    if (!sess) {
      sock.emit('error', 'Session not found');
      return;
    }
    this.logger.log(`Session loaded: ${JSON.stringify(sess)}`);

    // --- 2. Auto-select username by platform ---
    let username = sess.username?.trim();
    if (!username) {
      switch (sess.platform) {
        case 'AWS':
          username = 'ec2-user';
          break;
        case 'Oracle':
          username = 'opc';
          break;
        case 'Azure':
          username = 'azureuser';
          break;
        case 'GCP':
          username = 'gcp-user';
          break;
        case 'Local':
        case 'Other':
        default:
          username = sess.username?.trim() || 'root';
          break;
      }
    }

    // --- 3. Build SSH connect options ---
    const connectOpts: ConnectConfig = {
      host: sess.host,
      port: sess.port || 22,
      username,
      tryKeyboard: true,
      hostHash: 'sha256',
      hostVerifier: (hashedKey: string) => {
        this.logger.debug(`Host key fingerprint: ${hashedKey}`);
        return true; // TODO: 지문 매칭 로직으로 강화
      },
    };

    // --- 4. Authentication ---
    if (sess.authMethod === 'key' && sess.privateKey) {
      // DB에 PEM 키 내용 자체 저장
      connectOpts.privateKey = sess.privateKey;
    } else if (sess.password) {
      connectOpts.password = sess.password;
    }

    this.logger.log(`Connecting with options: ${JSON.stringify({
      host: connectOpts.host,
      port: connectOpts.port,
      username: connectOpts.username,
      hasKey: !!connectOpts.privateKey,
    })}`);

    // --- 5. Connect and forward data ---
    const ssh = new SSHClient();
    ssh.on('ready', () => {
      ssh.shell(
        {
          term: 'xterm-256color',  // 터미널 타입
          cols: 80,                // 초기 컬럼 수
          rows: 24,                // 초기 로우 수
        },
        (err, stream) => {
          if (err) {
            sock.emit('error', `Shell error: ${err.message}`);
            return ssh.end();
          }
          // 이제 이 shell 채널은 “인터랙티브 로그인 셸” 취급되어
          // 로그인 배너·MOTD·Last login 메시지가 자동으로 나옵니다.
          this.clients.set(sock.id, { ssh, stream });

          stream.on('data', buf => sock.emit('output', buf.toString()));
          stream.on('close', () => ssh.end());
          sock.on('input', inp => stream.write(inp.data));

          // 2. SFTP 클라이언트 생성도 이 안으로 옮기기
          ssh.sftp((err, sftp: SFTPWrapper) => {
            if (err) return sock.emit('error', `SFTP error: ${err.message}`);
            const client = new SftpClient();
            client.sftp = () => Promise.resolve(sftp);
            this.sftpClients.set(sock.id, client);
          });

          
          ssh.exec('pwd', (err, pwdStream) => {
            if (!err) {
              let cwd = '';
              pwdStream.on('data', c => (cwd += c.toString()));
              pwdStream.on('close', () => {
                cwd = cwd.trim();
                sock.emit('sftp-pwd', cwd);
              });
            }
          });
        }
      );    
    });

    ssh.on('error', (err) => {
      this.logger.error(`SSH connection error [${sess.id}]: ${err.message}`);
      sock.emit('error', `SSH error: ${err.message}`);
    });



    ssh.connect(connectOpts);
  }

  // @SubscribeMessage('sftp-upload')
  // async handleUpload(
  //   @MessageBody() { remotePath, fileName, data }: UploadPayload,
  //   @ConnectedSocket() sock: Socket,
  // ) {
  //   const client = this.sftpClients.get(sock.id);
  //   if (!client) return sock.emit('error', 'No SFTP client');

  //   const temp = Buffer.from(data, 'base64');  // 클라이언트가 base64로 보낼 경우
  //   try {
  //     await client.put(temp, `${remotePath}/${fileName}`);
  //     sock.emit('sftp-upload-success', { fileName, remotePath });
  //   } catch (e) {
  //     sock.emit('sftp-upload-error', e.message);
  //   }
  // }

  // @SubscribeMessage('sftp-download')
  // async handleDownload(
  //   @MessageBody() { remoteFile }: DownloadPayload,
  //   @ConnectedSocket() sock: Socket,
  // ) {
  //   const client = this.sftpClients.get(sock.id);
  //   if (!client) return sock.emit('error', 'No SFTP client');

  //   try {
  //     const buffer = await client.get(remoteFile);
  //     sock.emit('sftp-download-data', {
  //       remoteFile,
  //       data: buffer.toString('base64'),
  //     });
  //   } catch (e) {
  //     sock.emit('sftp-download-error', e.message);
  //   }
  // }



}