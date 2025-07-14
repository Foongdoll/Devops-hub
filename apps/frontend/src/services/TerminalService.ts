import { apiRequest } from '../axios/axiosInstance';
import { socketService } from './SocketService';

export type SessionType = 'SSH' | 'FTP' | 'SFTP';
export type PlatformType = 'AWS' | 'Oracle' | 'Azure' | 'GCP' | 'Local' | 'Other';

export interface Session {
  id: string;
  label: string;
  type: SessionType;
  platform: PlatformType;
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key';
  password?: string;
  privateKey?: string;
  status?: string;
}

// HTTP API 호출 (CRUD)
export const fetchSessions = () =>
  apiRequest<Session[]>({ url: 'terminal/getSessions', method: 'GET' });

export const createSession = (data: Omit<Session, 'id' | 'status'>) =>
  apiRequest<Session>({ url: 'terminal/createSession', method: 'POST', data });

export const deleteSession = (id: string) =>
  apiRequest<void>({ url: `terminal/deleteSession/${id}`, method: 'DELETE' });

// WebSocket 연결 관리
export function connectSession(
  sessionId: string,
  onOutput: (chunk: string) => void,
  onError: (err: string) => void
) {
  // 1) 이미 생성된 소켓 인스턴스 가져오기
  const socket = socketService.getSocket();
  if (!socket) {
    onError('소켓이 초기화되지 않았습니다.');
    return;
  }

  // 2) 이전에 등록된 리스너 제거
  socket.off('output');
  socket.off('error');
  socket.off('disconnect');
  socket.off('connect_error');

  // 3) 필요한 이벤트 리스너 등록
  socket.on('output', (data: string) => {
    onOutput(data);
  });
  socket.on('error', (err: string) => {
    onError(err);
  });
  socket.on('disconnect', reason => {
    console.log('WebSocket disconnected:', reason);
  });
  socket.on('connect_error', error => {
    console.error('Connection error:', error);
    onError(`연결 실패: ${error.message}`);
  });

  // 4) 터미널 세션 시작 요청
  socket.emit('start', { sessionId });
}

export function sendInput(data: string) {
  socketService.emit('input', { data });
}

export function disconnectSession() {
  const socket = socketService.getSocket();
  if (socket && socket.connected) {
    socket.emit('stop');
    socket.off('output');
    socket.off('error');
    socket.off('disconnect');
    socket.off('connect_error');
  }
}
