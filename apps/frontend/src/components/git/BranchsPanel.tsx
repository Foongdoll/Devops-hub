import type { Branch } from "../../customhook/git/useBranches";


export interface TrackingBranch {
  local: string;
  remote: string;
  ahead?: number;
  behind?: number;
}
export interface BranchesPanelProps {
  local: Branch[];
  remotes: Branch[];
  tracking: TrackingBranch[];
  onCheckout: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
}


const BranchesPanel: React.FC<BranchesPanelProps> = ({ local, remotes, tracking, onCheckout, onDelete }) => {
  return (
    <section className="px-6 py-6 grid md:grid-cols-3 gap-6">
      {/* Local Branches */}
      <div className="bg-gray-800 rounded-2xl shadow p-3">
        <h3 className="text-xs text-gray-400 uppercase mb-2">Local</h3>
        <ul className="space-y-1">
          {local.map(b => (
            <li key={b.name}
              className={`flex items-center justify-between px-2 py-1 rounded-lg transition 
                ${b.current ? 'bg-blue-900 text-blue-300 font-bold' : 'hover:bg-gray-700 text-gray-200'}`
              }
            >
              <span>{b.name}</span>
              <div className="flex gap-1">
                {!b.current && (
                  <button onClick={() => onCheckout(b)} className="px-2 text-sm text-blue-400 hover:underline">Checkout</button>
                )}
                <button onClick={() => onDelete(b)} className="px-2 text-sm text-red-400 hover:underline">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Remote Branches */}
      <div className="bg-gray-800 rounded-2xl shadow p-3">
        <h3 className="text-xs text-gray-400 uppercase mb-2">Remote</h3>
        <ul className="space-y-1">
          {remotes.map(b => (
            <li key={b.fullname}
              className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-gray-700 transition text-gray-200"
            >
              <span>{b.name}</span>
              <button onClick={() => onCheckout({ name: b.name, current: false })} className="px-2 text-sm text-blue-400 hover:underline">Checkout</button>
            </li>
          ))}
        </ul>
      </div>
      {/* Tracking Branches */}
      <div className="bg-gray-800 rounded-2xl shadow p-3">
        <h3 className="text-xs text-gray-400 uppercase mb-2">Tracking</h3>
        <ul className="space-y-1">
          {tracking.map(pair => (
            <li key={pair.local + pair.remote}
              className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-gray-700 transition text-gray-200"
            >
              <span>{pair.local} → <span className="text-blue-400">{pair.remote}</span></span>
              {/* 동기화 상태 등 표시 가능 */}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default BranchesPanel;