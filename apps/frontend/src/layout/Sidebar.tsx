// src/layout/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { Server, Terminal, GitBranch, Cloud, Users, Settings, Home } from 'lucide-react'; // 아이콘 예시

const mainMenus = [
  { icon: <Home className="w-5 h-5 mr-2" />, label: '대시보드', path: '/' },
  { icon: <Server className="w-5 h-5 mr-2" />, label: '서버 관리', path: '/servers' },
  { icon: <Terminal className="w-5 h-5 mr-2" />, label: 'SSH/FTP/SFTP 접속', path: '/terminals' },
  { icon: <GitBranch className="w-5 h-5 mr-2" />, label: 'Git 저장소', path: '/git' },
  { icon: <Cloud className="w-5 h-5 mr-2" />, label: 'S3 & 파일 관리', path: '/storage' },
  { icon: <Users className="w-5 h-5 mr-2" />, label: '팀/멤버', path: '/members' },
  { icon: <Settings className="w-5 h-5 mr-2" />, label: '설정', path: '/settings' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 h-full flex flex-col bg-[#512e67] text-white shadow-xl">
      {/* Header */}
      <div className="p-5 font-bold text-xl border-b border-[#4d335d] flex items-center">
        <img src="/logo192.png" alt="logo" className="w-8 h-8 rounded-full mr-2" />
        DevOps Hub
      </div>
      {/* Menu List */}
      <nav className="flex-1 py-6 space-y-1">
        {mainMenus.map((menu) => (
          <Link
            key={menu.path}
            to={menu.path}
            className={`flex items-center px-6 py-2 rounded-l-full font-semibold transition-all ${
              location.pathname === menu.path
                ? 'bg-white text-[#7e4cff] shadow'
                : 'text-gray-200 hover:bg-[#7153a6]/30 hover:text-white'
            }`}
          >
            {menu.icon}
            {menu.label}
          </Link>
        ))}
      </nav>
      {/* Footer/Profile */}
      <div className="p-4 border-t border-[#4d335d] flex items-center">
        <img
          src="https://randomuser.me/api/portraits/men/32.jpg"
          alt="me"
          className="w-9 h-9 rounded-full mr-2 border-2 border-white"
        />
        <div>
          <div className="font-medium leading-tight">홍길동</div>
          <div className="text-xs text-gray-300">DevOps 엔지니어</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
