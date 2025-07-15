// src/layout/TopBar.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu as MenuIcon, Search, Bell } from 'lucide-react';
import SocketStatus from '../components/SocketStatus';

interface TopBarProps {
  onToggleSidebar: () => void;
}

const getTitle = (pathname: string) => {  
  if (pathname.startsWith('/terminals')) return '터미널';
  if (pathname.startsWith('/git')) return 'Git-Manager';
  return '대시보드';
};

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const { pathname } = useLocation();
  const title = getTitle(pathname);

  return (
    <header className="flex items-center justify-between px-6 h-14 border-b bg-white z-10">
      {/* 모바일에서만 보이는 햄버거 */}
      <button
        className="lg:hidden p-1 mr-4 text-gray-600 hover:bg-gray-100 rounded"
        onClick={onToggleSidebar}
        aria-label="메뉴 열기"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* 제목 */}
      <h1 className="text-lg font-semibold text-gray-800 truncate flex-1">
        {title}
      </h1>

      {/* 오른쪽 영역 */}
      <div className="flex items-center space-x-4">
        <SocketStatus />

        {/* 검색(태블릿 이상) + 알림 */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="검색"
              className="pl-10 pr-4 py-1.5 w-48 rounded-lg bg-gray-100 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button className="p-2 rounded hover:bg-gray-100 transition">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 모바일 검색/알림 아이콘 */}
        <div className="flex lg:hidden items-center space-x-3">
          <button className="p-1 rounded hover:bg-gray-100 transition">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-1 rounded hover:bg-gray-100 transition">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
