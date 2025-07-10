// src/pages/Dashboard.tsx
import { Link } from 'react-router-dom';

const feedData = [
  {
    id: 1,
    type: 'calendar',
    icon: '/google-calendar.png', // Google 캘린더 아이콘
    title: 'Google 캘린더',
    desc: '프로젝트 현황 회의',
    sub: '오늘 오후 1:30부터 2:00까지 (PST)',
    badge: '6',
    link: '#',
    color: 'blue',
  },
  {
    id: 2,
    type: 'live',
    icon: '/voice.png', // 음성채팅 아이콘
    title: '허들 진행 중',
    desc: '이희영 님 외 5명의 사용자가 참여하고 있습니다.',
    sub: 'LIVE',
    link: '#',
    color: 'green',
  },
];

const Dashboard = () => {
  return (
    <div className="p-10 space-y-6">
      {/* 팀 공지 */}
      <div className="mb-8">
        <div className="text-2xl font-bold mb-2">공지사항 📢</div>
        <div className="bg-gradient-to-r from-[#E0C3FC] to-[#8EC5FC] text-[#5e3475] rounded-xl p-6 shadow">
          신규 프로젝트를 위한 첫 미팅이 오늘 오후 1:30에 Google Meet에서 진행됩니다.  
          <Link className="ml-3 underline text-[#6f52e4] font-semibold" to="#">참여하기</Link>
        </div>
      </div>
      {/* 일정, 실시간 정보 등 피드 */}
      <div className="space-y-4">
        {feedData.map((item) => (
          <div
            key={item.id}
            className="flex items-center bg-white rounded-xl p-5 shadow hover:shadow-md transition"
          >
            <img
              src={item.icon}
              alt={item.title}
              className={`w-12 h-12 rounded-lg mr-5 border-2 border-${item.color}-200`}
              style={{ background: '#fff' }}
            />
            <div className="flex-1">
              <div className="font-bold text-lg flex items-center">
                {item.title}
                {item.type === 'live' && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-bold animate-pulse">
                    {item.sub}
                  </span>
                )}
              </div>
              <div className="text-gray-800">{item.desc}</div>
              {item.type === 'calendar' && (
                <div className="text-gray-400 text-sm">{item.sub}</div>
              )}
            </div>
            {/* 참여 버튼 */}
            <Link
              to={item.link}
              className="ml-5 text-[#37b277] font-semibold hover:underline"
            >
              {item.type === 'live' ? '참여하기' : ''}
            </Link>
            {item.type === 'calendar' && (
              <span className="ml-4 bg-gray-200 px-3 py-1 rounded-full text-gray-600 text-xs">
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
