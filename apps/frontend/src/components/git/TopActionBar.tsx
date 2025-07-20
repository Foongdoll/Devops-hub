import { ArrowUpFromLine, ArrowDownFromLine, RefreshCcw, Archive } from 'lucide-react';
import type React from 'react';

export type TopActionBarProps = {
  onPush: () => void;
  onPull: () => void;
  onFetch: () => void;
  onStash: () => void;
};

const TopActionBar: React.FC<TopActionBarProps> = ({ onPush, onPull, onFetch, onStash }) => (
  <>
    <button onClick={onPush} className="p-2 rounded-full hover:bg-blue-900 transition-colors group" title="Push">
      <ArrowUpFromLine className="w-6 h-6 text-gray-200 group-hover:text-blue-400 transition-colors" />
    </button>
    <button onClick={onPull} className="p-2 rounded-full hover:bg-blue-900 transition-colors group" title="Pull">
      <ArrowDownFromLine className="w-6 h-6 text-gray-200 group-hover:text-blue-400 transition-colors" />
    </button>
    <button onClick={onFetch} className="p-2 rounded-full hover:bg-blue-900 transition-colors group" title="Fetch">
      <RefreshCcw className="w-6 h-6 text-gray-200 group-hover:text-blue-400 transition-colors" />
    </button>
    <button onClick={onStash} className="p-2 rounded-full hover:bg-blue-900 transition-colors group" title="Stash">
      <Archive className="w-6 h-6 text-gray-200 group-hover:text-blue-400 transition-colors" />
    </button>
  </>
);

export default TopActionBar;
