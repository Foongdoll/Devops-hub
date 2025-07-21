import React from "react";
import { MoreVertical, GitCommit, GitBranch, Link } from "lucide-react";
import type { Commit } from "../../customhook/git/useCommitHistory";

// props 타입 정의
export interface CommitHistoryPanelProps {
  commits: Commit[];
  commitsWithBranches: Commit[];
  onContextMenu: (commit: Commit, pos: { x: number; y: number }) => void;
  selectedHash?: string | null;
  selectCommit?: (hash: string) => void;
  closeContextMenu?: () => void;
  handleMenuAction?: (action: string, commit: Commit) => void;
  commitBranches: string[];
  localBranch?: string;
  remoteBranch?: string;
  selectedBranch?: string;
  onSelectBranch?: (branch: string) => void;
}

const COMMIT_ROW_HEIGHT = 44;
const GRAPH_WIDTH = 36;

// 브랜치(=refs)만 추출
function getRefBranches(commits: Commit[]): string[] {
  const refs = new Set<string>();
  commits.forEach(commit => {
    if (commit.refs) {
      commit.refs.split(",").forEach(ref => refs.add(ref.trim()));
    }
  });
  return Array.from(refs).filter(Boolean);
}

// 상단 바
const TopBar: React.FC<{
  branches: string[];
  selectedBranch: string | undefined;
  onSelectBranch: (v: string) => void;
  localBranch?: string;
  remoteBranch?: string;
}> = ({
  branches, selectedBranch, onSelectBranch, localBranch, remoteBranch
}) => (
    <div className="flex items-center justify-between gap-2 mb-4 w-full px-1 flex-wrap">
      <div className="flex items-center gap-2 mb-1 flex-shrink-0">
        <GitBranch size={18} className="text-purple-400" />
        <select
          className="bg-gray-800 border border-gray-700 rounded-lg text-gray-100 px-2 py-1 min-w-[110px] outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedBranch}
          onChange={e => onSelectBranch(e.target.value)}
        >
          <option value="">전체</option>
          {branches.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 text-xs bg-[#232347] rounded-xl px-3 py-1">
        <span>로컬: <b className="text-blue-400">{localBranch || "?"}</b></span>
        <Link size={15} className="mx-1 text-blue-400" />
        <span>리모트: <b className="text-cyan-400">{remoteBranch || "없음"}</b></span>
      </div>
    </div>
  );

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
  onContextMenu,
  selectedHash,
  selectCommit,
  closeContextMenu,
  handleMenuAction,
  commitBranches,
  localBranch,
  remoteBranch,
  selectedBranch,
  onSelectBranch,
}) => {
  // 인덱스 매핑
  const hashToIndex = React.useMemo(() => {
    const map: Record<string, number> = {};
    commits.forEach((c, i) => { map[c.hash] = i; });
    return map;
  }, [commits]);

  // "refs"만 브랜치 옵션
  const branchOptions = React.useMemo(() => getRefBranches(commits), [commits]);

  // 브랜치 필터 (refs 기준)
  const filteredCommits = React.useMemo(() => {
    if (!selectedBranch) return commits;
    return commits.filter(commit => commit.refs && commit.refs.includes(selectedBranch));
  }, [selectedBranch, commits]);

  return (
    <section className="bg-gray-900 p-4 rounded-2xl shadow flex flex-col gap-0 overflow-y-auto h-full w-full">
      {/* 상단 바 */}
      <TopBar
        branches={branchOptions}
        selectedBranch={selectedBranch || ""}
        onSelectBranch={onSelectBranch || (() => { })}
        localBranch={localBranch}
        remoteBranch={remoteBranch}
      />

      {/* 커밋 리스트 */}
      <div className="flex flex-col gap-1">
        {filteredCommits.length === 0 && (
          <div className="text-gray-400 text-center py-12">해당 브랜치의 커밋이 없습니다.</div>
        )}
        {filteredCommits.map((commit, i) => (
          <div
            key={commit.hash}
            className={`
              flex flex-row items-center relative w-full rounded-xl cursor-pointer
              transition overflow-x-auto gap-2
              ${selectedHash === commit.hash
                ? "bg-blue-950 text-blue-300 ring-2 ring-blue-400"
                : "bg-gray-800 text-gray-200 hover:bg-gray-700"
              }
            `}
            style={{ minHeight: COMMIT_ROW_HEIGHT, height: COMMIT_ROW_HEIGHT }}
            onClick={() => selectCommit?.(commit.hash)}
            onContextMenu={e => {
              e.preventDefault();
              onContextMenu(commit, { x: e.clientX, y: e.clientY });
            }}
          >
            {/* 그래프 SVG */}
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: GRAPH_WIDTH, height: COMMIT_ROW_HEIGHT }}
            >
              {renderGraph(i, commit, hashToIndex, selectedHash ?? null)}
            </div>

            {/* 커밋 메시지 (왼쪽 확장, 나머지는 오른쪽) */}
            <div className="flex flex-row items-center w-full min-w-0">
              <GitCommit className="w-4 h-4 text-gray-400 flex-shrink-0 mr-1" />
              {commit.refs ? (
                <span className="mr-2 bg-blue-900 text-blue-400 text-xs px-2 py-0.5 rounded-full font-mono truncate max-w-[120px]">{commit.refs}</span>
              ) : null}
              <span className="truncate font-semibold text-base flex-grow min-w-0 pr-2"
                style={{ maxWidth: "100%" }}
                title={commit.message}
              >
                {commit.message}
              </span>
            </div>

            {/* 오른쪽 정보 (이름, 날짜, 해시, 브랜치) */}
            <div className="flex flex-row items-center gap-3 flex-shrink-0 justify-end ml-2 min-w-[200px]">
              <span className="text-xs text-gray-400 max-w-[90px] truncate">{commit.author}</span>
              <span className="text-xs text-gray-400">{commit.date.slice(0, 10)}</span>
              <span className="font-mono text-gray-500 text-xs">{commit.hash.slice(0, 8)}</span>
            </div>

            {/* More 버튼 */}
            <button
              className="ml-2 p-2 rounded-full hover:bg-gray-700 transition flex-shrink-0"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onContextMenu(commit, { x: e.currentTarget.getBoundingClientRect().right, y: e.currentTarget.getBoundingClientRect().bottom });
              }}
              title="More actions"
              tabIndex={-1}
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
