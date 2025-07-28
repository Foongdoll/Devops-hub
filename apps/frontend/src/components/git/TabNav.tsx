import { useState } from "react";
import { Cloud, List, GitBranch, Inbox, History, FileArchive } from "lucide-react";
import { showToast } from '../../utils/notifyStore';
import type { Remote } from '../../customhook/git/useRemote';
import { useRemoteContext } from '../../context/RemoteContext';
import { motion } from "framer-motion";
import type { Commit } from "../../customhook/git/useCommitHistory";

const tabs = [
  { key: 'remotes', icon: <Cloud />, label: 'Remotes' },
  { key: 'changes', icon: <List />, label: 'Changes' },
  { key: 'branches', icon: <GitBranch />, label: 'Branches' },
  { key: 'stash', icon: <Inbox />, label: 'Stash' },
  { key: 'history', icon: <History />, label: 'History' },
  { key: 'commitview', icon: <FileArchive />, label: 'CommitView' },
];

export interface TabNavProps {
  active: 'remotes' | 'changes' | 'branches' | 'stash' | 'history' | 'commitview';
  onChange: (tab: 'remotes' | 'changes' | 'branches' | 'stash' | 'history' | 'commitview') => void;
  children?: React.ReactNode;
  selectedRemote: Remote | null;
  selectedCommit: Commit | null;
  setSelectedCommit: (commit: Commit | null) => void;
}

const iconVariants = {
  initial: { rotate: 0, scale: 1 },
  hover: { rotate: 360, scale: 1.24, transition: { type: "spring", duration: 0.38 } }
};

const TabNav: React.FC<TabNavProps> = ({
  active, onChange, children, selectedRemote, selectedCommit, setSelectedCommit
}) => {
  const { setSelectedRemote, changesCount } = useRemoteContext();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <nav
      className="
    flex flex-wrap items-center justify-between px-2 md:px-6 py-2
    rounded-t-2xl shadow-md
    bg-gradient-to-r from-[#ede9fe] via-[#e8defa] to-[#d1c4ff]
    border-b border-[#e1dbfa]
    select-none
    min-w-0
  "
    >
      <div className="flex flex-wrap gap-1 min-w-0 max-w-full">
        {tabs.map((tab, i) => {
          const isActive = active === tab.key;
          const isHover = hoverIdx === i;
          return (
            <button
              key={tab.key}
              className={`
                flex items-center gap-1 px-4 py-2 rounded-xl font-medium relative
                transition-all duration-150
                ${isActive
                  ? "bg-white shadow-lg text-[#7e4cff] scale-[1.08] font-extrabold ring-2 ring-[#7e4cff44] z-10"
                  : "text-[#888ccf] hover:bg-[#f3e8ff] hover:shadow hover:text-[#7e4cff]"}
              `}
              style={{
                boxShadow: isActive
                  ? "0 2px 12px 0 #bba7ee40"
                  : undefined,
                outline: "none",
                border: "none",
              }}
              onClick={() => {
                if (selectedRemote) {
                  if (tab.key === 'remotes') setSelectedRemote(null);
                  else if (tab.key === 'commitview') {
                    if (!selectedCommit) {
                      showToast("내역을 확인 할 커밋을 선택해주세요.", "warn");
                      return;
                    }
                  } else {
                    setSelectedCommit(null);
                  }
                  onChange(tab.key as any);
                } else {
                  showToast('먼저 리모트를 선택해주세요.', 'warn');
                }
              }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <motion.span
                className="w-5 h-5 flex items-center justify-center"
                variants={iconVariants}
                animate={isActive || isHover ? "hover" : "initial"}
              >
                {tab.icon}
              </motion.span>
              {/* 반응형: 1265px 이하에서 label(글씨) 숨기기 */}
              <span className="hidden xl:inline">{tab.label}</span>
              {tab.key === 'changes' && changesCount > 0 && (
                <span className="
                  ml-1 inline-block
                  bg-gradient-to-r from-[#7e4cff] to-[#bba7ee]
                  text-white text-[11px] font-bold px-2 py-0.5
                  rounded-full shadow
                  animate-bounce
                ">
                  {changesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div
        className="
      flex flex-wrap gap-2 items-center min-w-0 max-w-full
      mt-2 md:mt-0
    "
      >
        {children}
      </div>
    </nav>
  );
};

export default TabNav;
