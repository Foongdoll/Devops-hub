import { useEffect } from "react";
import { useRemoteContext } from "../../context/RemoteContext";
import type { Branch } from "../../customhook/git/useBranches";
import type { Remote } from "../../customhook/git/useRemote";

export interface TrackingBranch {
  local: string;
  remote: string;
  ahead?: number;
  behind?: number;
}

export interface BranchesPanelProps {
  onCheckoutLocal: (branch: string, remote: Remote) => void;
  onDelete: (remote: Remote, branch: Branch) => void;
  onCheckoutRemote: (branch: string) => void;
}

const BranchesPanel: React.FC<BranchesPanelProps> = ({ onCheckoutLocal, onDelete, onCheckoutRemote }) => {
  const {
    localBranches,
    remoteBranches,
    selectedLocalBranch,
    selectedRemote
  } = useRemoteContext();

  if(!selectedRemote) return;

  // ✅ Create tracking info (basic version)
  // const tracking: TrackingBranch[] = localBranches
  //   .filter(b => b.upstream)
  //   .map(b => ({
  //     local: b.name,
  //     remote: b.upstream!,
  //     ahead: b.ahead,
  //     behind: b.behind,
  //   }));

  const tracking: TrackingBranch[] = [];
  return (
    <section className="px-6 py-6 grid md:grid-cols-3 gap-6">
      {/* Local Branches */}
      <div className="bg-gray-800 rounded-2xl shadow p-3">
        <h3 className="text-xs text-gray-400 uppercase mb-2">Local</h3>
        <ul className="space-y-1">
          {localBranches.map(b => (
            <li
              key={b.name}
              className={`flex items-center justify-between px-2 py-1 rounded-lg transition 
                ${b.current ? 'bg-blue-900 text-blue-300 font-bold' : 'hover:bg-gray-700 text-gray-200'}`}
            >
              <span>{b.name}</span>
              <div className="flex gap-1">
                {!b.current && (
                  <button
                    onClick={() => onCheckoutLocal(b.name, selectedRemote)}
                    className="px-2 text-sm text-blue-400 hover:underline"
                  >
                    Checkout
                  </button>
                )}
                <button
                  onClick={() => onCheckoutLocal(b.name, selectedRemote)}
                  className="px-2 text-sm text-red-400 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Remote Branches */}
      <div className="bg-gray-800 rounded-2xl shadow p-3">
        <h3 className="text-xs text-gray-400 uppercase mb-2">Remote</h3>
        <ul className="space-y-1">
          {remoteBranches.map(b => (
            <li
              key={b.name}
              className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-gray-700 transition text-gray-200"
            >
              <span>{b.name}</span>
              <button
                onClick={() => onCheckoutRemote(b.name)}
                className="px-2 text-sm text-blue-400 hover:underline"
              >
                Checkout
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tracking Branches */}
      <div className="bg-gray-800 rounded-2xl shadow p-3">
        <h3 className="text-xs text-gray-400 uppercase mb-2">Tracking</h3>
        <ul className="space-y-1">
          {tracking.length === 0 && (
            <li className="text-sm text-gray-500">추적 브랜치 없음</li>
          )}
          {tracking.map(pair => (
            <li
              key={pair.local + pair.remote}
              className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-gray-700 transition text-gray-200"
            >
              <span>
                {pair.local}
                <span className="mx-1 text-gray-400">→</span>
                <span className="text-blue-400">{pair.remote}</span>
              </span>
              {pair.ahead != null || pair.behind != null ? (
                <span className="text-xs text-gray-400">
                  {pair.ahead != null && `+${pair.ahead} `}
                  {pair.behind != null && `-${pair.behind}`}
                </span>
              ) : (
                <span className="text-xs text-gray-500">동기화 정보 없음</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default BranchesPanel;
