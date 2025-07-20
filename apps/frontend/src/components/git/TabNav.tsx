import { Cloud, List, GitBranch, Inbox, History } from 'lucide-react';
import type { Remote } from './RemotesPanel';

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
  children?: React.ReactNode; // 추가!
  selectedRemote?: Remote | null; // 선택된 리모트 정보
}

const TabNav: React.FC<TabNavProps> = ({ active, onChange, children, selectedRemote }) => {
  return (
    <nav className="flex items-center justify-between px-6 py-2 border-b border-gray-800 bg-gray-900">
      {/* 왼쪽: 탭 목록 */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl transition 
              ${active === tab.key ? 'bg-blue-900 text-blue-400 font-semibold' : 'text-gray-300 hover:bg-gray-800'}`
            }
            onClick={() => {
              // 리모트가 선택되어 있을 때만 탭 변경
              if (selectedRemote) {
                onChange(tab.key as any);
              }
            }}
          >
            <span className="w-5 h-5">{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      {/* 오른쪽: 액션 버튼 */}
      <div className="flex gap-2">{children}</div>
    </nav>
  );
}

export default TabNav;
