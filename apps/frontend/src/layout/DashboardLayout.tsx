import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-[calc(100vh-40px)] bg-[#3f2256]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main: TopBar + Outlet */}
      <div className="flex-1 flex flex-col bg-white overflow-y-hidden">
        <TopBar onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <div className="flex-1 overflow-y-auto p-1 border-l border-gray-200">
          <Outlet />  {/* 이 자리에서만 렌더링 */}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
