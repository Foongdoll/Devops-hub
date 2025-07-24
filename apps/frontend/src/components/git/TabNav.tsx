import { Cloud, List, GitBranch, Inbox, History } from 'lucide-react';
import { showToast } from '../../utils/notifyStore';
import type { Remote } from '../../customhook/git/useRemote';
import { useRemoteContext } from '../../context/RemoteContext';

const tabs = [
  { key: 'remotes', icon: <Cloud />, label: 'Remotes' },
  { key: 'changes', icon: <List />, label: 'Changes' },
  { key: 'branches', icon: <GitBranch />, label: 'Branches' },
  { key: 'stash', icon: <Inbox />, label: 'Stash' },
  { key: 'history', icon: <History />, label: 'History' },
];

export interface TabNavProps {
  active: 'remotes' | 'changes' | 'branches' | 'stash' | 'history';
  onChange: (tab: 'remotes' | 'changes' | 'branches' | 'stash' | 'history') => void;
  children?: React.ReactNode;
  selectedRemote?: Remote | null;
}

const TabNav: React.FC<TabNavProps> = ({ active, onChange, children, selectedRemote }) => {
  const { setSelectedRemote, changesCount } = useRemoteContext(); // ✅ changesCount 가져오기

  return (
    <nav className="flex items-center justify-between px-6 py-2 border-b border-gray-800 bg-gray-900">
      {/* 왼쪽: 탭 목록 */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl transition 
              ${active === tab.key ? 'bg-blue-900 text-blue-400 font-semibold' : 'text-gray-300 hover:bg-gray-800'}`}
            onClick={() => {
              if (selectedRemote) {
                if (tab.key === 'remotes') setSelectedRemote(null);
                onChange(tab.key as any);
              } else {
                showToast('먼저 리모트를 선택해주세요.', 'warn');
              }
            }}
          >
            <span className="w-5 h-5">{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>

            {/* ✅ Changes 탭이면 뱃지로 변경사항 수 표시 */}
            {tab.key === 'changes' && changesCount > 0 && (
              <span className="ml-1 inline-block bg-purple-700 text-white text-xs px-2 py-0.5 rounded-full">
                {changesCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 오른쪽: 액션 버튼 */}
      <div className="flex gap-2">{children}</div>
    </nav>
  );
};

export default TabNav;
