// src/layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu as MenuIcon,
  X as CloseIcon,
  Home,
  Server,
  Terminal,
  GitBranch,
  Cloud,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainMenus = [
  { icon: <Home />, label: '대시보드', path: '/' },
  { icon: <Server />, label: '서버 관리', path: '/servers' },
  { icon: <Terminal />, label: 'SSH/FTP/SFTP 접속', path: '/terminals' },
  { icon: <GitBranch />, label: 'Git 저장소', path: '/git' },
  { icon: <Cloud />, label: 'S3 & 파일 관리', path: '/storage' },
  { icon: <Settings />, label: '설정', path: '/settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { pathname } = useLocation();

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#322446] text-white
          transform transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:block
        `}
      >
        {/* 모바일용 닫기 버튼 */}
        <div className="lg:hidden flex justify-end p-2">
          <button onClick={onClose}>
            <CloseIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* 로고/헤더 */}
        <div className="px-6 py-4 flex items-center border-b border-[#4d335d]">
          <img src="/logo192.png" alt="logo" className="w-8 h-8 rounded-full mr-2" />
          <span className="font-bold text-xl">DevOps Hub</span>
        </div>

        {/* 메뉴 리스트 */}
        <nav className="mt-4 space-y-1 px-2">
          {mainMenus.map(({ icon, label, path }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={`
                  flex items-center px-4 py-2 rounded-l-full font-medium transition
                  ${active
                    ? 'bg-white text-[#7e4cff]'
                    : 'text-gray-200 hover:bg-[#5b3f7d]'}
                `}
              >
                <span className="w-5 h-5 mr-2">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
