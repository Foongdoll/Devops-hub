// src/cicd/cicd.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtTokenService } from 'src/auth/jwt.service';

@WebSocketGateway({
    namespace: 'cicd',    
    cors: { origin: '*' },
})
@Injectable()
export class CicdGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(CicdGateway.name);

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

    handleConnection(client: Socket) {
        this.logger.log(`CICD 소켓 연결 됨: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }


    /**
     * @param giturl
     * @dscription 깃 레퍼지토리의 브랜치 목록 불러오기
     */
    /**
  * 깃 레퍼지토리 URL을 받아서 원격 브랜치 목록을 조회해 클라이언트로 반환
  */
    @SubscribeMessage('fetch_remote_branches')
    async handleFetchRemoteBranches(
        @MessageBody() payload: { giturl: string },
        @ConnectedSocket() client: Socket,
    ) {
        this.logger.log(`fetch_remote_branches: ${payload.giturl}`);

        try {
            // 예시: child_process 로 git ls-remote 실행
            const { exec } = await import('child_process');
            exec(
                `git ls-remote --heads ${payload.giturl}`,
                (err, stdout, stderr) => {
                    if (err) {
                        client.emit('fetch_remote_branches_response', {
                            success: false,
                            error: stderr || err.message,
                        });
                        return;
                    }
                    const branches = stdout
                        .split('\n')
                        .filter((l) => l)
                        .map((l) => l.split('\t')[1].replace('refs/heads/', ''));
                        
                    client.emit('fetch_remote_branches_response', {
                        success: true,
                        branches,
                    });
                },
            );
        } catch (e) {
            client.emit('fetch_remote_branches_response', {
                success: false,
                error: e.message,
            });
        }
    }

}
