import React, { useEffect, type JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, GitBranch, ChevronDown, ChevronRight } from "lucide-react";
import type { Commit } from "../../customhook/git/useCommitHistory";
import { useRemoteContext } from "../../context/RemoteContext";
import { TopStageBar } from "./GitBranchBar";
import type { Remote } from "../../customhook/git/useRemote";
import type { Branch } from "../../customhook/git/useBranches";
import { useGitSocket } from "../../context/GitSocketContext";
import { hideLoading } from "../../utils/notifyStore";

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

// commit graph node "팡!" 이펙트
function renderGraph(
  index: number,
  commit: Commit,
  hashToIndex: Record<string, number>,
  selectedHash: string | null,
  isActive: boolean
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
      {/* 동적 효과 (팡팡, glow) */}
      <motion.circle
        cx={GRAPH_WIDTH / 2}
        cy={nodeY}
        r="8"
        fill={selectedHash === commit.hash ? "#3b82f6" : "#1e293b"}
        stroke="#60a5fa"
        strokeWidth={selectedHash === commit.hash ? 4 : 2}
        animate={isActive ? { scale: [1, 1.22, 1] } : { scale: 1 }}
        transition={isActive ? { duration: 0.29, type: "spring", bounce: 0.5 } : {}}
        style={{
          filter: isActive
            ? "drop-shadow(0 0 8px #60a5fa55)"
            : selectedHash === commit.hash
              ? "drop-shadow(0 0 3px #60a5fa99)"
              : "",
        }}
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
  onSelectRemoteBranch,
}) => {
  const { localBranches, remoteBranches, selectedRemote, selectedLocalBranch, selectedRemoteBranch } = useRemoteContext();
  const { on, off, emit } = useGitSocket();

  // 브랜치별 오픈 상태
  const [openBranches, setOpenBranches] = React.useState<{ [branch: string]: boolean }>({});

  // 브랜치 토글 함수
  const toggleBranch = (branchName: string) => {
    setOpenBranches((prev) => ({
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

  function makeHashToIndex(commits: Commit[]) {
    const hashToIndex: Record<string, number> = {};
    commits.forEach((commit, idx) => {
      hashToIndex[commit.hash] = idx;
    });
    return hashToIndex;
  }

  // 커밋 row effect state
  const [popIndex, setPopIndex] = React.useState<number | null>(null);

  return (
    <section className="bg-gradient-to-b from-[#20213a] via-[#22234b] to-[#292a3e] p-4 rounded-2xl shadow-xl flex flex-col gap-4 h-full w-full overflow-auto border border-[#36366d]">
      <TopStageBar
        localBranches={localBranches}
        remoteBranches={remoteBranches}
        selectedLocalBranch={selectedLocalBranch}
        selectedRemoteBranch={selectedRemoteBranch}
        onSelectLocalBranch={onSelectLocalBranch}
        onSelectRemoteBranch={onSelectRemoteBranch}
        selectedRemote={selectedRemote || ({ name: "", url: "" } as Remote)}
      />

      {Object.entries(commits).map(([branchName, commitList]: [string, Commit[]]) => {
        const hashToIndex = makeHashToIndex(commitList);
        const open = openBranches[branchName] ?? true;

        return (
          <div key={branchName} className="mb-4">
            {/* 브랜치 헤더 - 슉슉 애니메이션 */}
            <motion.div
              className="flex items-center mb-2 cursor-pointer select-none w-fit"
              onClick={() => toggleBranch(branchName)}
              whileTap={{ scale: 0.93, x: 7 }}
              whileHover={{ scale: 1.06, backgroundColor: "#1a2547" }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.28 }}
              style={{
                borderRadius: 12,
                paddingRight: 8,
                paddingLeft: 3,
                userSelect: "none",
              }}
            >
              {open ? (
                <ChevronDown size={20} className="mr-1 text-cyan-300 transition" />
              ) : (
                <ChevronRight size={20} className="mr-1 text-cyan-300 transition" />
              )}
              <GitBranch size={18} className="mr-2 text-cyan-300" />
              <span className="font-bold text-base text-cyan-200">{branchName}</span>
            </motion.div>

            {/* 커밋 리스트: 슉슉 열림 */}
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="commitlist"
                  className="flex flex-col gap-0 border-l border-[#3c3e66] pl-4"
                  initial={{ height: 0, opacity: 0, y: -8 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -12 }}
                  transition={{ duration: 0.28, ease: [0.4, 0.65, 0.3, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  {commitList.map((commit, idx) => {
                    const isSelected = selectedHash === commit.hash;
                    const isPop = popIndex === idx;

                    return (
                      <motion.div
                        key={commit.hash}
                        className={`relative flex items-center group cursor-pointer rounded-xl transition
    ${isSelected ? "bg-blue-900/60 ring-2 ring-blue-500 shadow-xl scale-105 z-20" : "hover:bg-slate-700/60"}
  `}
                        style={{
                          minHeight: COMMIT_ROW_HEIGHT + 8,
                          height: COMMIT_ROW_HEIGHT + 8,
                          marginBottom: 2,
                          paddingTop: 5,
                          paddingBottom: 5,
                          paddingRight: 24,         // 오른쪽 padding 추가!
                          position: "relative",
                          overflow: "hidden",       // 핵심! scale시 overflow 차단
                        }}
                        whileHover={{
                          scale: isSelected ? 1.10 : 1.045,
                          boxShadow: "0 4px 20px #6e70f222"
                        }}
                        transition={{
                          scale: { duration: 0.13 },
                          boxShadow: { duration: 0.16, ease: "linear" }
                        }}
                        whileTap={{
                          boxShadow: "0 0 40px 8px #43fff255,0 0 20px #7e4cff44"
                        }}
                        onClick={() => {
                          setPopIndex(idx);
                          selectCommit?.(commit.hash);
                          setTimeout(() => setPopIndex(null), 270);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onContextMenu(commit, { x: e.clientX, y: e.clientY });
                        }}
                      >
                        <div style={{ width: GRAPH_WIDTH, minWidth: GRAPH_WIDTH, marginRight: 10 }}>
                          {renderGraph(idx, commit, hashToIndex, selectedHash ?? null, isPop || isSelected)}
                        </div>
                        <div className="flex flex-col flex-grow min-w-0">
                          <span
                            className={`font-mono text-xs truncate ${isSelected ? "text-blue-400 font-bold" : "text-gray-200"
                              }`}
                          >
                            {commit.hash.slice(0, 8)}
                          </span>
                          <span className="text-sm text-gray-100 truncate">
                            {commit.message}
                            {commit.refs && (
                              <span className="mr-3 ml-1 px-2 py-0.5 text-xs rounded bg-purple-950 text-purple-300 whitespace-nowrap flex-shrink-0 ml-2">
                                {commit.refs}
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-400">
                            {commit.author} / {new Date(commit.date).toLocaleString()}
                          </span>
                        </div>
                        {handleMenuAction && (
                          <div className="ml-auto pr-3 flex-shrink-0">   {/* shrink 방지! */}
                            <MoreVertical size={18} onClick={e => { e.stopPropagation(); handleMenuAction("menu", commit); }} />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </section>
  );
};
