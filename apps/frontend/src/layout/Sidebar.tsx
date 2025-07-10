// src/layout/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';

const channels = [
  { name: '공지', path: '/channel/notice' },
  { name: '프로젝트-신제품', path: '/channel/new-project' },
  { name: '팀-마케팅', path: '/channel/marketing' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 h-full flex flex-col bg-[#512e67] text-white shadow-xl">
      {/* Header */}
      <div className="p-5 font-bold text-xl border-b border-[#4d335d]">
        Acme Inc
      </div>
      {/* Channel List */}
      <nav className="flex-1 py-4 space-y-1">
        {channels.map((ch) => (
          <Link
            key={ch.path}
            to={ch.path}
            className={`block px-6 py-2 rounded-l-full font-semibold transition-all ${
              location.pathname === ch.path
                ? 'bg-white text-[#7e4cff] shadow'
                : 'text-gray-200 hover:bg-[#7153a6]/30 hover:text-white'
            }`}
          >
            # {ch.name}
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
          <div className="text-xs text-gray-300">프로덕트 매니저</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
