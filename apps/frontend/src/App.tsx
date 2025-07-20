import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';

import Login from './pages/Login';
import Join from './pages/Join';
import DashboardLayout from './layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Terminals from './pages/Terminals';
import GitManager from './pages/GitManager';
import { ThemeProvider } from './context/ThemeProvider';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const isAuthed = React.useMemo(() => !!localStorage.getItem('accessToken'), []);
  return isAuthed ? <>{children}</> : <Navigate to="/login" />;
};

const App = () => (
  <SocketProvider>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<Join />} />

          {/* 이 라우트 하나로 대시보드 관련 모든 경로를 감쌉니다 */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            {/* 이 두 개만 이 아래에 둡니다 */}
            <Route index element={<Dashboard />} />
            <Route path="terminals" element={<Terminals />} />
            <Route path="git" element={<GitManager />} />

            {/* 추가로 /settings, /git 등도 이 아래에 계속 추가 */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </SocketProvider>
);

export default App;
