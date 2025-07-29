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
import { TerminalService } from 'src/terminal/terminal.service';

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
        private readonly jwtService: JwtTokenService,
        @Inject(TerminalService)
        private readonly terminalService: TerminalService
    ) { }

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
     * @param x
     * @description 
     * 세션 정보 불러오기
     * */
    @SubscribeMessage("onInitSessions")
    async onInitSessions(
        @ConnectedSocket() sock: Socket
    ) {
        const result = await this.terminalService.findAll(sock.data.user);        

        sock.emit("onInitSessions_Response", {success: true, message: "저장되어있는 세션 목록을 불러왔습니다.", data: result.data});
    }



}
