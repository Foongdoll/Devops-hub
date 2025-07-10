// src/layout/TopBar.tsx
import { useLocation } from 'react-router-dom';

const getTitle = (pathname: string) => {
  if (pathname.startsWith('/channel/notice')) return '# 공지';
  if (pathname.startsWith('/channel/new-project')) return '# 프로젝트-신제품';
  if (pathname.startsWith('/channel/marketing')) return '# 팀-마케팅';
  return '대시보드';
};

const TopBar = () => {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <header className="flex items-center px-8 h-16 border-b border-gray-200 bg-white z-10">
      {/* 채널명/페이지명 */}
      <span className="font-semibold text-lg flex-1">{title}</span>
      {/* 검색바 */}
      <input
        className="ml-4 rounded bg-gray-100 px-3 py-1 w-56 focus:outline-none focus:ring-2 focus:ring-[#7e4cff]"
        placeholder="검색"
      />
      {/* 멤버들 */}
      <div className="ml-6 flex items-center space-x-2">
        <img src="https://randomuser.me/api/portraits/women/22.jpg" className="w-7 h-7 rounded-full" />
        <img src="https://randomuser.me/api/portraits/men/41.jpg" className="w-7 h-7 rounded-full" />
        <img src="https://randomuser.me/api/portraits/men/42.jpg" className="w-7 h-7 rounded-full" />
        {/* ... */}
      </div>
    </header>
  );
};

export default TopBar;
