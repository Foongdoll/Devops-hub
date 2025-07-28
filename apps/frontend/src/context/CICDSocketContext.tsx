// GitSocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { cicdSocketService } from "../services/CICDService";

interface CICDSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  disconnect: () => void;
}

const CICDSocketContext = createContext<CICDSocketContextType | undefined>(undefined);

export const useCICDSocket = () => {
  const ctx = useContext(CICDSocketContext);
  if (!ctx) throw new Error("useGitSocket must be used within a GitSocketProvider");
  return ctx;
};

export const CICDSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 인스턴스 유지용 ref
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const sock = cicdSocketService.connect();
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
      cicdSocketService.disconnect();
    };
  }, []);

  return (
    <CICDSocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        emit: (event, data) => cicdSocketService.emit(event, data),
        on: (event, cb) => cicdSocketService.on(event, cb),
        off: (event, cb) => cicdSocketService.off(event, cb),
        disconnect: () => cicdSocketService.disconnect(),
      }}
    >
      {children}
    </CICDSocketContext.Provider>
  );
};
