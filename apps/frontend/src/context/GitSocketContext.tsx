// GitSocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { gitService } from "../services/GitManagerService";

interface GitSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  disconnect: () => void;
}

const GitSocketContext = createContext<GitSocketContextType | undefined>(undefined);

export const useGitSocket = () => {
  const ctx = useContext(GitSocketContext);
  if (!ctx) throw new Error("useGitSocket must be used within a GitSocketProvider");
  return ctx;
};

export const GitSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 인스턴스 유지용 ref
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const sock = gitService.connect();
    socketRef.current = sock;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    sock.on("connect", handleConnect);
    sock.on("disconnect", handleDisconnect);

    // 최초 연결상태 반영
    setIsConnected(sock.connected);

    return () => {
      sock.off("connect", handleConnect);
      sock.off("disconnect", handleDisconnect);
      gitService.disconnect();
    };
  }, []);

  return (
    <GitSocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        emit: (event, data) => gitService.emit(event, data),
        on: (event, cb) => gitService.on(event, cb),
        off: (event, cb) => gitService.off(event, cb),
        disconnect: () => gitService.disconnect(),
      }}
    >
      {children}
    </GitSocketContext.Provider>
  );
};
