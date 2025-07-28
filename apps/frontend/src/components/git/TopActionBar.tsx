import { ArrowUpFromLine, ArrowDownFromLine, RefreshCcw, Archive } from 'lucide-react';
import type React from 'react';
import { useRemoteContext } from '../../context/RemoteContext';
import type { Remote } from '../../customhook/git/useRemote';
import { useGlobalUI } from '../../context/GlobalUIContext';
import type { tabType } from '../../customhook/useGitManager';
import type { Dispatch, SetStateAction } from 'react';
import { delay } from '../../utils/comm';

export type TopActionBarProps = {
  onPush: (remote: Remote | null, remoteBranch: string) => void;
  onPull: (remote: Remote | null, remoteBranch: string) => void;
  onFetch: () => void;
  onStash: () => void;
  setTab: Dispatch<SetStateAction<tabType>>;
};

const badgeStyle = `
  absolute -top-1 -right-1
  bg-gradient-to-tr from-[#ff96c3] to-[#a084ee]
  text-xs text-white rounded-full px-1.5 py-0.5 font-bold shadow-xl
  pointer-events-none z-10
  animate-pulse
`;

const TopActionBar: React.FC<TopActionBarProps> = ({
  onPush, onPull, onFetch, onStash, setTab
}) => {
  const { pushCount, pullCount, selectedRemoteBranch, selectedRemote, setSelectedRemote } = useRemoteContext();
  const { showToast } = useGlobalUI();

  return (
    <div className="flex flex-wrap items-center gap-1 md:gap-2 min-w-0 max-w-full">
      <div className="relative">
        <button
          onClick={async () => {
            pushCount === 0 && showToast('푸시 할 변경 사항이 없습니다.', 'info');
            selectedRemote ? onPush(selectedRemote, selectedRemoteBranch)
              : (showToast('선택된 리모트 정보가 없습니다.\n리모트 선택창으로 이동합니다.', 'info'),
                setSelectedRemote(null), await delay(1000), setTab("remotes"));
          }}
          className="
            p-2 rounded-full
            bg-gradient-to-tr from-[#ede9fe] to-[#f3e8ff]
            shadow-sm
            hover:shadow-lg hover:bg-[#7e4cff22] hover:scale-110
            focus:outline-none active:scale-95
            transition-all duration-75
            relative group
          "
          title="Push"
        >
          <ArrowUpFromLine className="w-6 h-6 text-[#7e4cff] group-hover:text-[#4f3b98] transition" />
          {pushCount > 0 && (
            <span className={badgeStyle}>{pushCount}</span>
          )}
        </button>
      </div>
      <div className="relative">
        <button
          onClick={async () => {
            selectedRemote ? onPull(selectedRemote, selectedRemoteBranch)
              : (showToast('선택된 리모트 정보가 없습니다.\n리모트 선택창으로 이동합니다.', 'info'),
                setSelectedRemote(null), await delay(1000), setTab("remotes"));
          }}
          className="
            p-2 rounded-full
            bg-gradient-to-tr from-[#ede9fe] to-[#e8defa]
            shadow-sm
            hover:shadow-lg hover:bg-[#7e4cff22] hover:scale-110
            focus:outline-none active:scale-95
            transition-all duration-75
            relative group
          "
          title="Pull"
        >
          <ArrowDownFromLine className="w-6 h-6 text-[#7e4cff] group-hover:text-[#4f3b98] transition" />
          {pullCount > 0 && (
            <span className={badgeStyle}>{pullCount}</span>
          )}
        </button>
      </div>
      <button
        onClick={onFetch}
        className="
          p-2 rounded-full
          bg-gradient-to-tr from-[#ede9fe] to-[#e8defa]
          shadow-sm
          hover:shadow-lg hover:bg-[#7e4cff22] hover:scale-110
          focus:outline-none active:scale-95
          transition-all duration-75
          group
        "
        title="Fetch"
      >
        <RefreshCcw className="w-6 h-6 text-[#7e4cff] group-hover:text-[#4f3b98] transition" />
      </button>
      <button
        onClick={onStash}
        className="
          p-2 rounded-full
          bg-gradient-to-tr from-[#ede9fe] to-[#e8defa]
          shadow-sm
          hover:shadow-lg hover:bg-[#7e4cff22] hover:scale-110
          focus:outline-none active:scale-95
          transition-all duration-75
          group
        "
        title="Stash"
      >
        <Archive className="w-6 h-6 text-[#7e4cff] group-hover:text-[#4f3b98] transition" />
      </button>
    </div>
  );
};

export default TopActionBar;
