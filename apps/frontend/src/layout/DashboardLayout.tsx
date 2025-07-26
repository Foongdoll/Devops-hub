import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex"
      style={{
        position: "relative",
        top: 40, // 타이틀바 높이만큼 내림!
        height: 'calc(100vh - 40px)',
        minHeight: 0
      }}
    >
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main: TopBar + Outlet */}
      <div className="flex-1 flex flex-col bg-white overflow-y-hidden">
        <TopBar onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <div className="flex-1 overflow-y-hidden h-fit p-2 border-l border-[0.5px] border-gray-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
