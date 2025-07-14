import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  

  return (
    <div className="flex h-screen bg-[#3f2256]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main: TopBar + Outlet */}
      <div className="flex-1 flex flex-col bg-white">
        <TopBar onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <div className="flex-1 overflow-auto">
          <Outlet />  {/* 이 자리에서만 렌더링 */}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
