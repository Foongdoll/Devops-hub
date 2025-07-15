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
    socket.emit('exit');
    socket.off('output');
    socket.off('error');
    socket.off('disconnect');
    socket.off('connect_error');
  }
}

export const zipDownloadEvent = (callback: (data: boolean) => void) => {
  const socket = socketService.getSocket();
  if (!socket) {
    console.error('Socket not connected');
    return;
  }
  // 3) 필요한 이벤트 리스너 등록
  socket.on('sftp-download-zip-success', (base64data) => {
    // 1. base64 → Blob 변환
    const byteString = atob(base64data);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([uint8Array], { type: 'application/zip' });

    // 2. Blob → URL 만들어 다운로드 트리거
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download.zip'; // 원하는 파일명
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    callback;
  });
}