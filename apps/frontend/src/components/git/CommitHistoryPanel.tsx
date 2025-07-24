import React, { type JSX } from "react";
import { MoreVertical, GitBranch, ChevronDown, ChevronRight } from "lucide-react";
import type { Commit } from "../../customhook/git/useCommitHistory";
import { useRemoteContext } from "../../context/RemoteContext";
import { TopStageBar } from "./GitBranchBar";
import type { Remote } from "../../customhook/git/useRemote";
import type { Branch } from "../../customhook/git/useBranches";
import { useGitSocket } from "../../context/GitSocketContext";
import { hideLoading } from "../../utils/notifyStore";

// props 타입 정의
export interface CommitHistoryPanelProps {
  commits: Map<string, Commit[]>;
  setCommits: (commits: Map<string, Commit[]>) => void;
  onContextMenu: (commit: Commit, pos: { x: number; y: number }) => void;
  selectedHash?: string | null;
  selectCommit?: (hash: string) => void;
  closeContextMenu?: () => void;
  handleMenuAction?: (action: string, commit: Commit) => void;
  onSelectBranch?: (branch: string) => void;
  fetchCommitHistory: (remote: Remote, branches: Branch[]) => void;
  onSelectLocalBranch: (branch: string, remote: Remote) => void;
  onSelectRemoteBranch: (branch: string) => void;
}

const COMMIT_ROW_HEIGHT = 44;
const GRAPH_WIDTH = 36;


// 그래프 SVG 렌더 함수
function renderGraph(
  index: number,
  commit: Commit,
  hashToIndex: Record<string, number>,
  selectedHash: string | null
) {
  const nodeY = COMMIT_ROW_HEIGHT / 2;
  const lines: JSX.Element[] = [];

  if (commit.parents) {
    const parents = commit.parents.split(" ").filter(Boolean);
    parents.forEach((parentHash, pIdx) => {
      const parentIdx = hashToIndex[parentHash];
      if (typeof parentIdx === "number") {
        const parentY = (parentIdx - index) * COMMIT_ROW_HEIGHT + nodeY;
        lines.push(
          <line
            key={parentHash}
            x1={GRAPH_WIDTH / 2}
            y1={nodeY}
            x2={GRAPH_WIDTH / 2 + (pIdx === 0 ? 0 : (pIdx % 2 ? 14 : -14))}
            y2={parentY}
            stroke={pIdx === 0 ? "#60a5fa" : "#a78bfa"}
            strokeWidth={pIdx === 0 ? 3 : 2}
            markerEnd="url(#arrowhead)"
          />
        );
      }
    });
  }

  return (
    <svg width={GRAPH_WIDTH} height={COMMIT_ROW_HEIGHT} className="block pointer-events-none select-none">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L8,4 L0,8" fill="#a78bfa" />
        </marker>
      </defs>
      <line
        x1={GRAPH_WIDTH / 2}
        y1={0}
        x2={GRAPH_WIDTH / 2}
        y2={COMMIT_ROW_HEIGHT}
        stroke="#334155"
        strokeWidth={2}
      />
      {lines}
      <circle
        cx={GRAPH_WIDTH / 2}
        cy={nodeY}
        r="8"
        fill={selectedHash === commit.hash ? "#3b82f6" : "#1e293b"}
        stroke="#60a5fa"
        strokeWidth={selectedHash === commit.hash ? 4 : 2}
      />
    </svg>
  );
}
export const CommitHistoryPanel: React.FC<CommitHistoryPanelProps> = ({
  commits,
  setCommits,
  onContextMenu,
  selectedHash,
  selectCommit,
  closeContextMenu,
  handleMenuAction,
  onSelectBranch,
  fetchCommitHistory,
  onSelectLocalBranch,
  onSelectRemoteBranch
}) => {
  const { localBranches, remoteBranches, selectedRemote, selectedLocalBranch, selectedRemoteBranch } = useRemoteContext();
  const { on, off } = useGitSocket();

  // 브랜치별 오픈 상태
  const [openBranches, setOpenBranches] = React.useState<{ [branch: string]: boolean }>({});

  // 브랜치 토글 함수
  const toggleBranch = (branchName: string) => {
    setOpenBranches(prev => ({
      ...prev,
      [branchName]: !prev[branchName],
    }));
  };

  React.useEffect(() => {
    if (!selectedRemote || !remoteBranches) return;
    fetchCommitHistory(selectedRemote, remoteBranches);

    const handler = (commits: Map<string, Commit[]>) => {
      setCommits(commits);
      hideLoading();
    };

    on("fetch_commit_history_response", handler);

    return () => {
      off("fetch_commit_history_response", handler);
    };
  }, [selectedRemote]);

  // 인덱스 매핑
  function makeHashToIndex(commits: Commit[]) {
    const hashToIndex: Record<string, number> = {};
    commits.forEach((commit, idx) => {
      hashToIndex[commit.hash] = idx;
    });
    return hashToIndex;
  }

  return (
    <section className="bg-gray-900 p-4 rounded-2xl shadow flex flex-col gap-4 h-full w-full overflow-auto">
      <TopStageBar
        localBranches={localBranches}
        remoteBranches={remoteBranches}
        selectedLocalBranch={selectedLocalBranch}
        selectedRemoteBranch={selectedRemoteBranch}
        onSelectLocalBranch={onSelectLocalBranch}
        onSelectRemoteBranch={onSelectRemoteBranch}
        selectedRemote={selectedRemote || { name: '', url: '' } as Remote}
      />
      {Object.entries(commits).map(([branchName, commitList]: [string, Commit[]]) => {
        const hashToIndex = makeHashToIndex(commitList);
        const open = openBranches[branchName] ?? true; // 기본 true로 펼쳐짐
        return (
          <div key={branchName} className="mb-4">
            <div
              className="flex items-center mb-2 cursor-pointer select-none width-fit"
              onClick={() => toggleBranch(branchName)}
            >
              {open ? (
                <ChevronDown size={20} className="mr-1 text-cyan-300 transition" />
              ) : (
                <ChevronRight size={20} className="mr-1 text-cyan-300 transition" />
              )}
              <GitBranch size={18} className="mr-2 text-cyan-300" />
              <span className="font-bold text-base text-cyan-200">{branchName}</span>
            </div>
            {open && (
              <div className="flex flex-col gap-0 border-l border-gray-800 pl-4">
                {commitList.map((commit, idx) => (
                  <div
                    key={commit.hash}
                    className={`relative flex items-center group hover:bg-slate-800 cursor-pointer rounded transition`}
                    style={{ minHeight: COMMIT_ROW_HEIGHT + 8, height: COMMIT_ROW_HEIGHT + 8, paddingTop: 6, paddingBottom: 6 }}
                    onClick={() => selectCommit?.(commit.hash)}
                    onContextMenu={e => {
                      e.preventDefault();
                      onContextMenu(commit, { x: e.clientX, y: e.clientY });
                    }}
                  >

                    <div style={{ width: GRAPH_WIDTH, minWidth: GRAPH_WIDTH, marginRight: 10 }}>
                      {renderGraph(idx, commit, hashToIndex, selectedHash ?? null)}
                    </div>
                    <div className="flex flex-col flex-grow min-w-0">
                      <span className={`font-mono text-xs truncate ${selectedHash === commit.hash ? 'text-blue-400' : 'text-gray-300'}`}>
                        {commit.hash.slice(0, 8)}
                      </span>
                      <span className="text-sm text-gray-100 truncate">
                        {commit.message}
                        {/* 맨 왼쪽에 refs 표시 */}
                        {commit.refs && (
                          <span className="mr-3 ml-1 px-2 py-0.5 text-xs rounded bg-purple-950 text-purple-300 whitespace-nowrap flex-shrink-0 ml-2">
                            {commit.refs}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400">{commit.author} / {new Date(commit.date).toLocaleString()}</span>
                    </div>
                    {/* 더보기/메뉴 */}
                    {handleMenuAction && (
                      <div className="ml-auto pr-3">
                        <MoreVertical size={18} onClick={e => { e.stopPropagation(); handleMenuAction("menu", commit); }} />
                      </div>
                    )}
                  </div>
                ))}

              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};