import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X as CloseIcon,
  Home,
  Server,
  Terminal,
  GitBranch,
  Cloud,
  Settings,
} from 'lucide-react';
import { useTheme } from '../context/ThemeProvider';
import { motion } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainMenus = [
  { icon: <Home />, label: '대시보드', path: '/' },
  { icon: <Server />, label: '서버 관리', path: '/servers' },
  { icon: <Terminal />, label: 'SSH 접속', path: '/terminals' },
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 70, damping: 18 }}
        className={`
          fixed left-0 z-50 w-64 
          bg-gradient-to-br from-[#ede9fe] via-[#e9d5ff] to-[#e0c3fc] text-[#6d28d9]
          shadow-xl ring-1 ring-[#d1c4ff77]
          transform transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:block
        `}
        style={{
          top: 40,
          height: 'calc(100vh - 40px)',
          borderRight: '1.5px solid #c7a3fa44',
          boxShadow: '0 6px 36px 0 #b794f466'
        }}
      >
        {/* 모바일용 닫기 버튼 */}
        <div className="lg:hidden flex justify-end p-2">
          <motion.button
            whileHover={{ scale: 1.2, backgroundColor: "#e0c3fc" }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
          >
            <CloseIcon className="w-6 h-6 text-[#7e4cff]" />
          </motion.button>
        </div>

        {/* 로고/헤더 */}
        <motion.div
          initial={{ y: -14, opacity: 0.6 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.13 }}
          className="px-6 py-4 flex items-center border-b border-[#c7a3fa66]"
        >
          <span className="w-15 h-15 rounded-full mr-2 flex items-center justify-center text-[2rem] bg-[#ede9fe] border border-[#b9b3e3] shadow">
            🛠️
          </span>
          <span className="font-bold text-xl tracking-wide text-[#7e4cff]">DevOps Hub</span>
        </motion.div>

        {/* 메뉴 리스트 */}
        <nav className="mt-4 space-y-1 px-2">
          {mainMenus.map(({ icon, label, path }) => {
            const active = pathname === path;
            return (
              <motion.div
                className="overflow-hidden"
                whileHover={{
                  scale: 1.03,
                  x: 8,
                  boxShadow: "0 2px 18px #b3c1f744"
                  // backgroundColor 삭제!
                }}
                transition={{ type: "spring", stiffness: 140, damping: 12 }}
              >
                <Link
                  to={path}
                  onClick={onClose}
                  className={`
                          flex items-center px-4 py-2 font-semibold transition
                          ${active
                                  ? 'bg-white text-[#7e4cff] shadow'
                                  : 'text-[#7c3aed] hover:bg-[#f3e8ff]'}
                          rounded-xl
                        `}
                  style={{
                    fontWeight: 600,
                    letterSpacing: "0.04em"
                  }}
                >
                  <span className="w-5 h-5 mr-2">{icon}</span>
                  {label}
                </Link>
              </motion.div>

            );
          })}
        </nav>
      </motion.aside>
    </>
  );
};

export default Sidebar;
