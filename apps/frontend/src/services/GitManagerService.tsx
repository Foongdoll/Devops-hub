import { io, Socket } from "socket.io-client";
import { apiRequest } from "../axios/axiosInstance";
import type { Remote } from "../customhook/git/useRemote";
import type { Branch, TrackingBranch } from "../customhook/git/useBranches";
import type { Stash } from "../customhook/git/useStash";
import { showToast } from "../utils/notifyStore";

// Remote Fetch
export async function fetchRemotesImpl(): Promise<Remote[]> {
  return apiRequest<Remote[]>({
    url: 'git-manager/getRemotes',
    method: 'GET',
  });
}

// Remote Add
export async function addRemoteImpl(remote: Remote): Promise<Remote> {
  return apiRequest<Remote>({
    url: 'git-manager/addRemote',
    method: 'POST',
    data: remote,
  });
}
// Remote Edit
export async function editRemoteImpl(remote: Remote): Promise<Remote> {
  return apiRequest<Remote>({
    url: 'git-manager/editRemote',
    method: 'PUT',
    data: remote
  })
}

// Remote Delete
export async function deleteRemoteImpl(remote: Remote): Promise<void> {
  return apiRequest<void>({
    url: `git-manager/deleteRemote`,
    method: 'POST',
    data: { id: remote.id }
  });
}

// Branch Fetch
export async function fetchBranchesImpl(remote: Remote): Promise<{ local: Branch[], remote: Branch[], tracking: TrackingBranch[] }> {
  return apiRequest<{ local: Branch[], remote: Branch[], tracking: TrackingBranch[] }>({
    url: 'git-manager/fetchBranches',
    method: 'POST',
    data: { remote }
  });
}

// 스테시 목록 가져오기
export async function fetchStashsImpl(remote: Remote): Promise<Stash[]> {
  return apiRequest<Stash[]>({
    url: 'git-manager/fetchStashs',
    method: 'POST',
    data: { remote }
  });
}

// 스테시 적용
export async function applyStashImpl(remote: Remote, stashName: string): Promise<any> {
  return apiRequest<void>({
    url: 'git-manager/applyStash',
    method: 'POST',
    data: { remote, stashName }
  });
}

// 스테시 삭제
export async function dropStashImpl(remote: Remote, stashName: string): Promise<any> {
  return apiRequest<void>({
    url: 'git-manager/dropStash',
    method: 'POST',
    data: { remote, stashName }
  });
}

class GitService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io('ws://localhost:3000/git', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token: localStorage.getItem('accessToken') }
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (String(error).includes('jwt expired')) {
        showToast('세션이 만료되었습니다.\n로그인 페이지로 이동합니다.', 'error');
        window.location.href = '/login';
      }
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  emit(event: string, data?: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected');
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const gitService = new GitService();
