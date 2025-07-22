import { ArrowUpFromLine, ArrowDownFromLine, RefreshCcw, Archive } from 'lucide-react';
import type React from 'react';
import { useRemoteContext } from '../../context/RemoteContext';
import type { Remote } from '../../customhook/git/useRemote';
import { useEffect } from 'react';
import { useGitSocket } from '../../context/GitSocketContext';

export type TopActionBarProps = {
  onPush: (remote: Remote | null, remoteBranch: string) => void;
  onPull: (remote: Remote | null, remoteBranch: string) => void;
  onFetch: () => void;
  onStash: () => void;
};

const badgeStyle =
  "absolute -top-1 -right-1 bg-red-600 text-xs text-white rounded-full px-1.5 py-0.5 font-bold shadow pointer-events-none";

const TopActionBar: React.FC<TopActionBarProps> = ({
  onPush, onPull, onFetch, onStash
}) => {
  const { pushCount, pullCount, selectedRemoteBranch, selectedRemote } = useRemoteContext();
 
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          onClick={() => onPush(selectedRemote || null, selectedRemoteBranch)}
          className="p-2 rounded-full hover:bg-blue-900 transition-colors group"
          title="Push"
        >
          <ArrowUpFromLine className="w-6 h-6 text-gray-200 group-hover:text-blue-400 transition-colors" />
          {pushCount > 0 && (
            <span className={badgeStyle}>{pushCount}</span>
          )}
        </button>
      </div>
      <div className="relative">
        <button
          onClick={() => onPull(selectedRemote || null, selectedRemoteBranch)}
          className="p-2 rounded-full hover:bg-blue-900 transition-colors group"
          title="Pull"
        >
          <ArrowDownFromLine className="w-6 h-6 text-gray-200 group-hover:text-blue-400 transition-colors" />
          {pullCount > 0 && (
            <span className={badgeStyle}>{pullCount}</span>
          )}
        </button>
      </div>
      <button
        onClick={onFetch}
        className="p-2 rounded-full hover:bg-blue-900 transition-colors group"
        title="Fetch"
      >
        <RefreshCcw className="w-6 h-6 text-gray-200 group-hover:text-blue-400 transition-colors" />
      </button>
      <button
        onClick={onStash}
        className="p-2 rounded-full hover:bg-blue-900 transition-colors group"
        title="Stash"
      >
        <Archive className="w-6 h-6 text-gray-200 group-hover:text-blue-400 transition-colors" />
      </button>
    </div>
  )
};

export default TopActionBar;
