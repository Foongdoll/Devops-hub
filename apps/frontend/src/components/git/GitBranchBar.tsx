import { GitBranch, Link } from "lucide-react";
import type { Branch } from "../../customhook/git/useBranches";
import type { Remote } from "../../customhook/git/useRemote";

// 상단 바
export const TopBar: React.FC<{
    branches: string[];
    selectedBranch: string | undefined;
    onSelectBranch: (v: string) => void;
    localBranch?: string;
    remoteBranch?: string;
    localBranches?: string[];
    remoteBranches?: string[];
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
}) => (
        <div className="flex items-center justify-between gap-2 mb-4 w-full px-1 flex-wrap">
            <div className="flex items-center gap-2 mb-1 flex-shrink-0">
                <GitBranch size={18} className="text-purple-400" />
                <select
                    className="bg-gray-800 border border-gray-700 rounded-lg text-gray-100 px-2 py-1 min-w-[110px] outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedLocalBranch}
                    onChange={e => {
                        onSelectLocalBranch(e.target.value, selectedRemote || { name: '', url: '' } as Remote);
                    }}
                >
                    <option value="">로컬 브랜치 선택</option>
                    {localBranches.map(b => (
                        <option key={b.name} value={b.name} selected={b.current}>{b.name}</option>
                    ))}
                </select>
                <span className="text-gray-400 mx-2">→</span>
                <select
                    className="bg-gray-800 border border-gray-700 rounded-lg text-gray-100 px-2 py-1 min-w-[110px] outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedRemoteBranch}
                    onChange={e => {
                        onSelectRemoteBranch(e.target.value)
                    }}
                >
                    <option value="">리모트 브랜치 선택</option>
                    {remoteBranches.map(b => (
                        <option key={b.name} value={b.name} selected={b.current}>{b.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-2 text-xs bg-[#232347] rounded-xl px-3 py-1">
                <span>로컬: <b className="text-blue-400">{selectedLocalBranch || "?"}</b></span>
                <Link size={15} className="mx-1 text-blue-400" />
                <span>리모트: <b className="text-cyan-400">{selectedRemoteBranch || "없음"}</b></span>
            </div>
        </div>
    );