import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider, useSocket } from './context/SocketContext';

import Login from './pages/Login';
import Join from './pages/Join';
import DashboardLayout from './layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Terminals from './pages/Terminals';
import GitManager from './pages/GitManager';
import { ThemeProvider } from './context/ThemeProvider';
import { GitSocketProvider, useGitSocket } from './context/GitSocketContext';
import { RemoteProvider } from './context/RemoteContext';
import CustomTitleBar from './components/electron/CustomTitleBar';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const isAuthed = React.useMemo(() => !!localStorage.getItem('accessToken'), []);
  return isAuthed ? <>{children}</> : <Navigate to="/login" />;
};


function isElectron() {
  // (1) preload에서 isElectron 값을 넘긴 경우
  if (window.env?.isElectron) return true;
  // (2) User Agent에 Electron이 있는 경우
  if (navigator.userAgent.toLowerCase().includes("electron")) return true;
  return false;
}


const SocketCheck = () => {
  const { socket: ws, isConnected: isWsConnected } = useGitSocket();
  const { socket: socketIO, isConnected: isSocketConnected } = useSocket();
  useEffect(() => {
    if (ws && !isWsConnected) {
      ws.connect();
    }
    if (socketIO && !isSocketConnected) {
      socketIO.connect();
    }
  }, [ws, isWsConnected, socketIO, isSocketConnected]);

  return null; // 이 컴포넌트는 소켓 연결 상태를 확인하는 용도로 사용됩니다.
}

const App = () => (
  <ThemeProvider>
    {isElectron() && (<CustomTitleBar />) }
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />
        {/* 이 라우트 하나로 대시보드 관련 모든 경로를 감쌉니다 */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <SocketProvider>
                <GitSocketProvider>
                  <SocketCheck />
                  <DashboardLayout />
                </GitSocketProvider>
              </SocketProvider>
            </RequireAuth>
          }
        >
          {/* 이 두 개만 이 아래에 둡니다 */}

          <Route index element={<Dashboard />} />
          <Route path="terminals" element={<Terminals />} />
          <Route path="git" element={
            <RemoteProvider>
              <GitManager />
            </RemoteProvider>
          } />
          {/* 추가로 /settings, /git 등도 이 아래에 계속 추가 */}
        </Route>
      </Routes>
    </BrowserRouter >
  </ThemeProvider >

);

export default App;
