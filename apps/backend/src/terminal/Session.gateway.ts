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
import { ConnectConfig, Client as SSHClient } from 'ssh2';
import { TerminalService } from './terminal.service';
import { Logger } from '@nestjs/common';
import SftpClient from 'ssh2-sftp-client';
import { Buffer } from 'buffer';
import archiver from 'archiver';




interface StartPayload { sessionId: string; }
interface InputPayload { data: string; }
interface ListPayload { remotePath: string; }

interface UploadPayload {
  remotePath: string;  // 업로드할 디렉토리
  fileName: string;    // 업로드 파일명
  data: string;        // base64 인코딩된 파일
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class SessionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io: Server;

  private clients = new Map<string, { ssh: SSHClient; stream: any; sftp?: SftpClient }>();
  private readonly logger = new Logger(SessionsGateway.name);

  constructor(private readonly sessions: TerminalService) { }

  handleConnection(sock: Socket) {
    this.logger.log(`WebSocket connected: ${sock.id}`);
  }

  handleDisconnect(sock: Socket) {
    const entry = this.clients.get(sock.id);
    if (entry) {
      entry.stream?.end();
      entry.ssh?.end();
      entry.sftp?.end();
      this.clients.delete(sock.id);
    }
    this.logger.log(`WebSocket disconnected: ${sock.id}`);
  }

  @SubscribeMessage('start')
  async onStart(
    @MessageBody() { sessionId }: StartPayload,
    @ConnectedSocket() sock: Socket,
  ) {
    const apiRes = await this.sessions.findOne(sessionId);
    const sess = apiRes.data;
    if (!sess) {
      sock.emit('error', 'Session not found');
      return;
    }

    // Determine username
    let username = sess.username?.trim();
    if (!username) {
      switch (sess.platform) {
        case 'AWS': username = 'ec2-user'; break;
        case 'Oracle': username = 'opc'; break;
        case 'Azure': username = 'azureuser'; break;
        case 'GCP': username = 'gcp-user'; break;
        default: username = sess.username?.trim() || 'root';
      }
    }

    // SSH connect options
    const connectOpts: ConnectConfig = {
      host: sess.host,
      port: sess.port || 22,
      username,
      tryKeyboard: true,
      hostHash: 'sha256',
      hostVerifier: () => true,
    };

    if (sess.authMethod === 'key' && sess.privateKey) {
      connectOpts.privateKey = sess.privateKey;
    } else if (sess.password) {
      connectOpts.password = sess.password;
    }

    this.logger.log(`Connecting: ${JSON.stringify({ host: connectOpts.host, port: connectOpts.port, username })}`);

    const ssh = new SSHClient();

    ssh.on('ready', () => {
      this.logger.log(`SSH connection ready for ${sock.id}`);

      // 1. Create shell first
      ssh.shell({ term: 'xterm-256color', cols: 80, rows: 24 }, async (err, stream) => {
        if (err) {
          sock.emit('error', `Shell error: ${err.message}`);
          return ssh.end();
        }
        this.clients.set(sock.id, { ssh, stream });

        // Shell event handlers
        stream.on('data', buf => sock.emit('output', buf.toString()));
        stream.on('close', () => ssh.end());
        sock.on('input', ({ data }: InputPayload) => stream.write(data));

        // 2. Create SFTP client separately
        await this.createSftpClient(sock.id, sess, connectOpts);

        // 3. Get current directory
        ssh.exec('pwd', (e2, pwdStream) => {
          if (!e2) {
            let cwd = '';
            pwdStream.on('data', c => cwd += c.toString());
            pwdStream.on('close', () => sock.emit('sftp-pwd', cwd.trim()));
          }
        });
      });
    });

    ssh.on('error', err => {
      this.logger.error(`SSH error for ${sock.id}: ${err.message}`);
      sock.emit('error', `SSH error: ${err.message}`);
    });

    ssh.connect(connectOpts);
  }

  @SubscribeMessage('exit')
  async onExit(
    @ConnectedSocket() sock: Socket,
  ) {
    const client = this.clients.get(sock.id);
    if (client) {
      client.stream.end();
      client.ssh.end();
      client.sftp?.end();
      this.clients.delete(sock.id);
      this.logger.log(`Session exited for ${sock.id}`);
    } else {
      this.logger.warn(`No session found for ${sock.id}`);
    }
  }

  private async createSftpClient(socketId: string, sess: any, connectOpts: ConnectConfig) {
    try {
      const sftpClient = new SftpClient();

      await sftpClient.connect(connectOpts);

      // Add SFTP client to existing entry
      const existingClient = this.clients.get(socketId);
      if (existingClient) {
        existingClient.sftp = sftpClient;
        this.clients.set(socketId, existingClient);
        this.logger.log(`SFTP client created for ${socketId}`);
      }

    } catch (error) {
      this.logger.error(`SFTP client creation failed for ${socketId}: ${error.message}`);
      // Don't emit error here, as it might interrupt the main SSH connection
    }
  }

  @SubscribeMessage('sftp-list')
  async handleList(
    @MessageBody() { remotePath }: ListPayload,
    @ConnectedSocket() sock: Socket,
  ) {
    const client = this.clients.get(sock.id);
    if (!client) {
      this.logger.error(`No client found for socket ${sock.id}`);
      return sock.emit('sftp-list-error', 'Connection not found');
    }
    if (!client.sftp) {
      this.logger.error(`SFTP client not ready for socket@@ ${sock.id}`);
      return sock.emit('sftp-list-error', 'SFTP not ready');
    }
    try {
      this.logger.log(`Listing directory: ${remotePath} for ${sock.id}`);
      const list = await client.sftp.list(remotePath); // ✅ FIXED: remotePath 사용!
      this.logger.log(`Directory listing success: ${list.length} items`);
      sock.emit('sftp-list-data', { remotePath, list });
    } catch (err: any) {
      this.logger.error(`SFTP list error: ${err.message}`);
      sock.emit('sftp-list-error', err.message);
    }
  }

  // 🔥 파일 더블클릭 → vi/vim 실행용 신규 이벤트
  @SubscribeMessage('explorer-open-file')
  handleExplorerOpenFile(
    @MessageBody() { filePath, editor }: { filePath: string, editor: 'vi' | 'vim' },
    @ConnectedSocket() sock: Socket,
  ) {
    const client = this.clients.get(sock.id);
    if (!client || !client.stream) {
      sock.emit('error', '터미널 세션이 없습니다.');
      return;
    }
    client.stream.write(`${editor} '${filePath.replace(/'/g, "'\\''")}'\n`);
  }

  @SubscribeMessage('sftp-move')
  async handleSftpMove(
    @MessageBody() { src, dest }: { src: string, dest: string },
    @ConnectedSocket() sock: Socket,
  ) {
    const client = this.clients.get(sock.id);
    if (!client?.sftp) return sock.emit('sftp-move-error', 'SFTP not ready');
    try {
      await client.sftp.rename(src, dest);
      sock.emit('sftp-move-success', { src, dest });
    } catch (e) {
      sock.emit('sftp-move-error', e.message);
    }
  }

  @SubscribeMessage('sftp-upload')
  async handleSftpUpload(
    @MessageBody() payload: UploadPayload,
    @ConnectedSocket() sock: Socket,
  ) {
    const client = this.clients.get(sock.id);
    if (!client?.sftp) {
      this.logger.error(`SFTP client not ready for socket ${sock.id}`);
      return sock.emit('sftp-upload-error', 'SFTP not ready');
    }
    try {
      // base64를 Buffer로 변환
      const buffer = Buffer.from(payload.data, 'base64');
      // 업로드할 전체 경로
      const targetPath =
        payload.remotePath.endsWith("/")
          ? payload.remotePath + payload.fileName
          : payload.remotePath + "/" + payload.fileName;
      await client.sftp.put(buffer, targetPath);
      this.logger.log(`파일 업로드 완료: ${targetPath} (${buffer.length} bytes)`);
      sock.emit('sftp-upload-success', { targetPath, size: buffer.length });
      // 업로드 후 새로고침 용: 트리/탐색기에서 사용
      sock.emit('sftp-list', { remotePath: payload.remotePath });
    } catch (e: any) {
      this.logger.error(`SFTP upload error: ${e.message}`);
      sock.emit('sftp-upload-error', e.message); 
    }
  }

  @SubscribeMessage("sftp-download-zip")
  async handleSftpDownloadZip(
    @MessageBody() { files }: { files: string[] },
    @ConnectedSocket() sock: Socket,
  ) {
    const client = this.clients.get(sock.id);
    if (!client?.sftp) {
      this.logger.error(`SFTP client not ready for socket ${sock.id}`);
      return sock.emit('sftp-download-zip-error', 'SFTP not ready');
    }
    try {
      this.logger.log(`SFTP download zip request for files: ${files.join(', ')}`);
      // 실제 zip 생성 함수
      const zipBuffer = await this.getSftpZip(client.sftp, files);
      sock.emit('sftp-download-zip-success', zipBuffer.toString('base64'));
    } catch (e: any) {
      this.logger.error(`SFTP download zip error: ${e.message}`);
      sock.emit('sftp-download-zip-error', e.message);
    }
  }

  async getSftpZip(sftp: SftpClient, files: string[]): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const outBuf: Buffer[] = [];
      archive.on('data', d => outBuf.push(d));
      archive.on('error', reject);
      archive.on('end', () => resolve(Buffer.concat(outBuf)));

      // 파일 하나씩 SFTP에서 읽어서 ZIP에 append
      for (const remotePath of files) {
        const filename = remotePath.split('/').pop();
        // ssh2-sftp-client에서 파일을 stream으로 읽어오기
        // get(path, [dst], {encoding, stream: true}) 쓰면 stream 리턴됨
        // (패키지 버전에 따라 get에서 stream 바로 안 될 수도 있음 → getBuffer로도 가능)
        const fileBuf = await sftp.get(remotePath); // Buffer 리턴
        archive.append(fileBuf, { name: filename || 'unknown' });
      }

      archive.finalize();
    });
  }

  @SubscribeMessage("sftp-download")
  async handleSftpDownload(
    @MessageBody() { file }: { file: string },
    @ConnectedSocket() sock: Socket,
  ) {
    const client = this.clients.get(sock.id);
    if (!client?.sftp) return sock.emit('sftp-download-error', 'SFTP not ready');
    try {
      const filename = file.split("/").pop()!;
      const buf = await client.sftp.get(file);
      sock.emit("sftp-download-success", { filename, data: buf.toString("base64") });
    } catch (e: any) {
      sock.emit("sftp-download-error", e.message);
    }
  }

}
