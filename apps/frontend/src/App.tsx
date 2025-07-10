import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import Login from './pages/Login';
import DashboardLayout from './layout/DashboardLayout.tsx';
import Dashboard from './pages/Dashboard';
import Join from './pages/Join.tsx';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  // 토큰 기반 로그인 여부 체크
  const isAuthed = !!localStorage.getItem('accessToken');
  return isAuthed ? <>{children}</> : <Navigate to="/login" />;
};

const App = () => (
  <BrowserRouter>    
      <Routes>
        {/* 로그인 전용 경로 */}
        <Route path="/login" element={<Login />} />
        <Route path='/join' element={<Join />} />
        {/* 로그인 이후 레이아웃(사이드바/탑바/메인) */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <DashboardLayout>
                <Outlet />
              </DashboardLayout>
            </RequireAuth>
          }
        >
          {/* 메인 대시보드 */}
          <Route index element={<Dashboard />} />                   
        </Route>
      </Routes>    
  </BrowserRouter>
);

export default App;
