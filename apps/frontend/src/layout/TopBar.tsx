import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu as MenuIcon, Search, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import SocketStatus from '../components/SocketStatus';

interface TopBarProps {
  onToggleSidebar: () => void;
}

const getTitle = (pathname: string) => {  
  if (pathname.startsWith('/terminals')) return '터미널';
  if (pathname.startsWith('/git')) return 'Git 관리';
  if (pathname.startsWith('/cicd')) return 'CICD 관리';
  return '대시보드';
};

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const { pathname } = useLocation();
  const title = getTitle(pathname);

  return (
    <motion.header
      className="flex items-center justify-between px-6 h-14 border-b bg-gradient-to-r from-[#ede9fe] via-[#f3e8ff] to-[#f1f5ff] z-10 shadow"
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 80, damping: 16 }}
      style={{
        boxShadow: '0 2px 18px 0 rgba(140, 115, 255, 0.07)',
        width: '100%',
        position: 'sticky', // <-- sticky로도 가능
        top: 0, // DashboardLayout 내부에서는 필요시 top: 0으로도!
        zIndex: 20,
      }}
    >
      {/* 모바일 햄버거 */}
      <motion.button
        whileTap={{ scale: 0.85, rotate: -15 }}
        whileHover={{ scale: 1.12, backgroundColor: '#d1c4ff' }}
        className="lg:hidden p-1 mr-4 text-[#7e4cff] hover:bg-[#e9d5ff] rounded transition"
        onClick={onToggleSidebar}
        aria-label="메뉴 열기"
      >
        <MenuIcon className="w-6 h-6" />
      </motion.button>

      {/* 제목 */}
      <motion.h1
        className="text-lg font-bold text-[#7e4cff] drop-shadow tracking-wide truncate flex-1"
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 10, delay: 0.12 }}
      >
        {title}
      </motion.h1>

      {/* 오른쪽 */}
      <div className="flex items-center space-x-4">
        <SocketStatus />

        {/* 검색+알림 */}
        <div className="hidden md:flex items-center space-x-4">
          <motion.div className="relative"
            whileFocus={{ scale: 1.05 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b794f4]" />
            <input
              type="text"
              placeholder="검색"
              className="pl-10 pr-4 py-1.5 w-48 rounded-lg bg-[#ede9fe] text-sm focus:ring-2 focus:ring-[#b794f4] transition shadow-inner"
              style={{
                color: "#4b2ea7",
                boxShadow: "0 0 0 2px #c7a3fa22"
              }}
            />
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.18, backgroundColor: "#e9d5ff" }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded transition"
          >
            <Bell className="w-5 h-5 text-[#7e4cff]" />
          </motion.button>
        </div>

        {/* 모바일 */}
        <div className="flex lg:hidden items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.16, backgroundColor: "#e9d5ff" }}
            whileTap={{ scale: 0.9 }}
            className="p-1 rounded transition"
          >
            <Search className="w-5 h-5 text-[#7e4cff]" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.16, backgroundColor: "#e9d5ff" }}
            whileTap={{ scale: 0.9 }}
            className="p-1 rounded transition"
          >
            <Bell className="w-5 h-5 text-[#7e4cff]" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default TopBar;
