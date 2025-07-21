import { useState } from "react";
import { MoreVertical, GitBranch, GitCommit, Code2 } from "lucide-react";

export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  branches?: string[]; // ['main', 'origin/main']
}

export interface CommitHistoryPanelProps {
  commits: Commit[];
  onContextMenu: (commit: Commit, pos: { x: number; y: number }) => void;
  selectedHash?: string | null;
  selectCommit?: (hash: string) => void;
  closeContextMenu?: () => void;
  handleMenuAction?: (action: string, commit: Commit) => void;
}

export const CommitHistoryPanel: React.FC<CommitHistoryPanelProps> = ({
  commits,
  onContextMenu,
  selectedHash,
  selectCommit,
  closeContextMenu,
  handleMenuAction,
}) => {
  

  return (
    <section className="bg-gray-900 p-4 rounded-2xl shadow flex flex-col gap-1 overflow-y-auto h-full">
      {commits.map((commit) => (
        <div
          key={commit.hash}
          className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition
            ${selectedHash === commit.hash
              ? "bg-blue-950 shadow text-blue-300"
              : "hover:bg-gray-800 text-gray-200"}`}
          onContextMenu={(e) => {
            e.preventDefault();
            onContextMenu(commit, { x: e.clientX, y: e.clientY });
          }}
        >
          {/* 히스토리 그래프/점(아이콘) */}
          <div className="flex flex-col items-center mr-2">
            <GitCommit className="w-4 h-4 text-gray-500" />
            {/* branch 표시 */}
            {commit.branches?.length ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {commit.branches.map((br) => (
                  <span
                    key={br}
                    className="bg-blue-900 text-blue-400 text-xs px-2 py-0.5 rounded-full font-mono"
                  >
                    {br}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* 커밋 메시지, 해시 등 */}
          <div className="flex-1 min-w-0">
            <div className="truncate font-semibold">{commit.message}</div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <span>{commit.author}</span>
              <span>•</span>
              <span>{commit.date}</span>
              <span>•</span>
              <span className="font-mono text-gray-500">{commit.hash.slice(0, 8)}</span>
            </div>
          </div>

          {/* 컨텍스트 메뉴 버튼 */}
          <button
            className="p-2 rounded-full hover:bg-gray-800 ml-2 opacity-0 group-hover:opacity-100 transition"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onContextMenu(commit, { x: e.currentTarget.getBoundingClientRect().right, y: e.currentTarget.getBoundingClientRect().bottom });
            }}
            title="More actions"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ))}
    </section>
  );
};
