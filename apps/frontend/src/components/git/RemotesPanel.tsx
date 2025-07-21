import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, FolderOpen } from 'lucide-react';
import { showToast } from '../../utils/notifyStore';
import type { Remote } from '../../customhook/git/useRemote';
import type { tabType } from '../../customhook/useGitManager';

export interface RemotesPanelProps {
  remotes: Remote[];
  onAdd: (remote: Remote) => void;
  onEdit: (remote: Remote) => void;
  onRemove: (remote: Remote) => void;
  onChange: (tab: tabType) => void;
  onSelect: (remote: Remote) => Promise<boolean>;
  onBranchSelect: (remote: Remote) => Promise<boolean>;
}

const RemotesPanel: React.FC<RemotesPanelProps> = ({ remotes, onAdd, onEdit, onRemove, onChange, onSelect, onBranchSelect }) => {

  const [showForm, setShowForm] = useState(false);
  const [editRemote, setEditRemote] = useState<Remote | null>(null);
  const [form, setForm] = useState<Remote>({ id: '', name: '', url: '', path: '' });

  // 폴더 선택 다이얼로그 (웹 환경에선 input[file webkitdirectory], 데스크탑/Electron에선 dialog 연동)
  const handleBrowseFolder = async () => {
    // 웹은 브라우저 제한이 많으므로 아래는 샘플(실제 Electron에선 dialog 호출)
    // const folder = await window.api.selectFolder();
    // setForm(f => ({ ...f, localPath: folder }));
    // 데모용

    showToast('보안상 폴더 선택 기능은 웹에서는 지원하지 않습니다.\nElectron에서만 동작합니다.', 'warn');
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.url.trim() || !form.path.trim()) return;
    if (editRemote) {
      onEdit(form);
    } else {
      onAdd(form);
    }
    setShowForm(false);
    setEditRemote(null);
    setForm({ id: '', name: '', url: '', path: '' });
  };


  return (
    <section className="max-w-xl mx-auto py-6">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-lg text-gray-100 font-bold">Remotes</h2>
        <button
          onClick={() => { setShowForm(true); setEditRemote(null); setForm({ id: '', name: '', url: '', path: '' }) }}
          className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition"
        >
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Remote</span>
        </button>
      </header>

      {/* 추가/수정 폼 */}
      {showForm && (
        <div className="mb-4 rounded-xl bg-gray-800 p-4 flex flex-col gap-3 shadow">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300 font-semibold">별명</label>
            <input
              className="px-3 py-2 rounded bg-gray-900 text-white focus:outline-none"
              placeholder="예: origin, dev, backup"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              maxLength={24}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300 font-semibold">Git 저장소 URL</label>
            <input
              className="px-3 py-2 rounded bg-gray-900 text-white focus:outline-none"
              placeholder="예: https://github.com/org/repo.git"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300 font-semibold">로컬 폴더 경로</label>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded bg-gray-900 text-white focus:outline-none"
                placeholder="로컬 폴더 경로"
                value={form.path}
                onChange={e => setForm(f => ({ ...f, path: e.target.value }))}
              />
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
                onClick={handleBrowseFolder}
                title="폴더 선택"
              >
                <FolderOpen className="w-5 h-5" />
                <span className="hidden sm:inline">찾기</span>
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-2 justify-end">
            <button
              className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
              onClick={() => { setShowForm(false); setEditRemote(null); }}
              type="button"
            >
              취소
            </button>
            <button
              className="px-3 py-1 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-bold disabled:opacity-50"
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.url.trim() || !form.path.trim()}
            >
              {editRemote ? "수정" : "추가"}
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {remotes.map(r => (
          <li key={r.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 group transition shadow-sm cursor-pointer hover:bg-gray-700"
            onClick={async () => {
              const selected = await onSelect(r);
              if (selected) {
                const result = await onBranchSelect(r);
                if (result) {
                  onChange('history'); // 선택된 원격 저장소로 변경
                }
              }
            }}
          >                            
            <div>
              <div className="font-semibold text-gray-100">{r.name}</div>
              <div className="text-gray-400 text-xs">{r.url}</div>
              <div className="text-gray-400 text-xs">{r.path}</div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              {/* <button
                onClick={() => {
                  setShowForm(true);
                  setEditRemote(r);
                  setForm(r);
                }}
                className="p-2 rounded-full hover:bg-gray-700"
                title="수정"
              >
                <Pencil className="w-4 h-4 text-gray-300 hover:text-blue-400" />
              </button> */}
              <button
                onClick={() => onRemove(r)}
                className="p-2 rounded-full hover:bg-gray-700"
                title="삭제"
              >
                <Trash2 className="w-4 h-4 text-gray-300 hover:text-red-400" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RemotesPanel;
