import { io, Socket } from 'socket.io-client';
import { apiRequest } from '../axios/axiosInstance';

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
  status: 'connected' | 'idle';
}

// HTTP API 호출 (CRUD)
export const fetchSessions = () =>
  apiRequest<Session[]>({ url: 'terminal/getSessions', method: 'GET' });

export const createSession = (data: Omit<Session, 'id' | 'status'>) =>
  apiRequest<Session>({ url: 'terminal/createSession', method: 'POST', data });

export const deleteSession = (id: string) =>
  apiRequest<void>({ url: `terminal/deleteSession/${id}`, method: 'DELETE' });
// Socket.IO 연결
let socket: Socket | null = null;

export function connectSession(
  sessionId: string,
  onOutput: (chunk: string) => void,
  onError: (err: string) => void
) {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io("http://localhost:3000", {
    transports: ['websocket', 'polling'],    
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected to terminals namespace');
    socket!.emit('start', { sessionId });
  });
  
  socket.on('output', (data: string) => onOutput(data));
  socket.on('error', onError);
  
  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    onError(`연결 실패: ${error.message}`);
  });
}

export function sendInput(data: string) {
  if (socket && socket.connected) {
    socket.emit('input', { data });
  }
}

export function disconnectSession() {
  socket?.disconnect();
  socket = null;
}
