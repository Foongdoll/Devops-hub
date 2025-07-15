import { apiRequest } from "../axios/axiosInstance";
import type { Remote } from "../customhook/useGitManager";
import { io, Socket } from "socket.io-client";

export const addRemote = async (remote: { name: string; url: string; path: string }) => {
  return await apiRequest<Remote>({
    url: "git-manager/addRemote",
    method: "POST",
    data: remote,
  });
};

export const getRemotes = async (): Promise<Remote[]> => {
  return await apiRequest<Remote[]>({
    url: "git-manager/getRemotes",
    method: "GET",
  });
};

export const deleteRemote = async (id: string): Promise<Remote> => {
  return await apiRequest<Remote>({
    url: `git-manager/deleteRemote/${id}`,
    method: "DELETE",
  });
};

// gitSocket.ts (싱글턴)
// 한 번만 인스턴스를 만든다!
class GitSocket {
  private gitSocket: Socket;
  constructor() {
    this.gitSocket = io("ws://localhost:3000/git", {
      withCredentials: true,
      transports: ["websocket"],
    });
  }
  public on(event: string, callback: (...args: any[]) => void) {
    this.gitSocket.on(event, callback);
  }
  public emit(event: string, data: any) {
    this.gitSocket.emit(event, data);
  }
  public disconnect() {
    this.gitSocket.disconnect();
  }
  public getSocket(): Socket {
    return this.gitSocket;
  }
}

// 딱 한 번 생성해서 export!
export const gitSocket = new GitSocket();
