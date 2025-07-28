import { GitBranch, Link } from "lucide-react";
import type { Branch } from "../../customhook/git/useBranches";
import type { Remote } from "../../customhook/git/useRemote";

export const TopStageBar: React.FC<{
  localBranches: Branch[];
  remoteBranches: Branch[];
  selectedLocalBranch: string;
  selectedRemoteBranch: string;
  onSelectLocalBranch: (v: string, remote: Remote) => void;
  onSelectRemoteBranch: (v: string) => void;
  selectedRemote?: Remote;
}> = ({
  localBranches,
  remoteBranches,
  selectedLocalBranch,
  selectedRemoteBranch,
  onSelectLocalBranch,
  onSelectRemoteBranch,
  selectedRemote
}) => {
  const selectedLocal = localBranches.find(b => b.name === selectedLocalBranch);
  const tracking = selectedLocal?.upstream;

  return (
    <div className="flex flex-col gap-3 mb-4 w-full px-2 md:px-3">
      {/* Branch selection bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap w-full">
        <div className="flex items-center gap-2">
          <GitBranch size={18} className="text-purple-400" />
          <select
            className="bg-gray-800 border border-gray-700 rounded-lg text-gray-100 px-2 py-1 text-sm min-w-[120px] outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedLocalBranch}
            onChange={e => {
              onSelectLocalBranch(e.target.value, selectedRemote || { name: '', url: '' } as Remote);
            }}
          >
            <option value="">로컬 브랜치 선택</option>
            {localBranches.map(b => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        <span className="text-gray-400 mx-2 hidden sm:inline">→</span>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 block sm:hidden">↓</span>
          <select
            className="bg-gray-800 border border-gray-700 rounded-lg text-gray-100 px-2 py-1 text-sm min-w-[120px] outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedRemoteBranch}
            onChange={e => {
              onSelectRemoteBranch(e.target.value);
            }}
          >
            <option value="">리모트 브랜치 선택</option>
            {remoteBranches.map(b => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Current selection summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs bg-[#232347] rounded-xl px-3 py-2 w-fit">
        <div className="flex items-center gap-1">
          <span>로컬: <b className="text-blue-400">{selectedLocalBranch || "?"}</b></span>
          <Link size={15} className="text-blue-400" />
          <span>리모트: <b className="text-cyan-400">{selectedRemoteBranch || "없음"}</b></span>
        </div>
      </div>

      {/* Tracking info */}
      <div className="text-xs text-gray-400 px-1 leading-snug">
        {tracking ? (
          <span className="flex flex-wrap items-center gap-1">
            <Link size={14} className="text-green-400" />
            로컬 브랜치 <b className="text-blue-400">{selectedLocalBranch}</b> 는
            <b className="text-cyan-400"> {tracking}</b> 을(를) 추적 중입니다.
          </span>
        ) : selectedLocalBranch ? (
          <span className="flex flex-wrap items-center gap-1">
            <Link size={14} className="text-yellow-400" />
            <b className="text-blue-400">{selectedLocalBranch}</b> 브랜치는
            추적 중인 리모트 브랜치가 없습니다.
          </span>
        ) : null}
      </div>
    </div>
  );
};
