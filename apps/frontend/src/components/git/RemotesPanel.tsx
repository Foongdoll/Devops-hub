import { useState } from 'react';
import { Pencil, Trash2, Plus, FolderOpen } from 'lucide-react';
import { showToast } from '../../utils/notifyStore';
import type { Remote } from '../../customhook/git/useRemote';
import type { tabType } from '../../customhook/useGitManager';
import { useRemoteContext } from '../../context/RemoteContext';
import { motion } from "framer-motion";

export interface RemotesPanelProps {
  remotes: Remote[];
  onAdd: (remote: Remote) => void;
  onEdit: (remote: Remote) => void;
  onRemove: (remote: Remote) => void;
  onChange: (tab: tabType) => void;
  onSelect: (remote: Remote) => Promise<boolean>;
  onBranchSelect: (remote: Remote) => Promise<boolean>;
}

const RemotesPanel: React.FC<RemotesPanelProps> = ({
  remotes, onAdd, onEdit, onRemove, onChange, onSelect, onBranchSelect
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editRemote, setEditRemote] = useState<Remote | null>(null);
  const [form, setForm] = useState<Remote>({ id: '', name: '', url: '', path: '' });
  const [clicked, setClicked] = useState<string | null>(null);

  // 폴더 선택 (웹에서는 제한 있음)
  const handleBrowseFolder = async () => {
    const folder = await window.api?.selectFolder();
    setForm(f => ({ ...f, path: folder }))
  };

  // 추가/수정
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

  // 카드 클릭 시 팡! 애니메이션 + 선택 동작
  const handleCardClick = async (r: Remote) => {
    setClicked(r.id); // 팡!
    const selected = await onSelect(r);
    if (selected) {
      const result = await onBranchSelect(r);
      if (result) onChange('history');
    }
    setTimeout(() => setClicked(null), 280); // scale 애니 끝나고 원상복구
  };

  return (
    <section className="max-w-xl mx-auto py-6">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-extrabold bg-gradient-to-r from-[#7e4cff] to-[#bba7ee] text-transparent bg-clip-text">
          Remotes
        </h2>
        <button
          onClick={() => { setShowForm(true); setEditRemote(null); setForm({ id: '', name: '', url: '', path: '' }) }}
          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#a084ee] to-[#6e70f2] hover:from-[#bba7ee] hover:to-[#7e4cff] rounded-xl text-white font-bold shadow transition-all"
        >
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Remote</span>
        </button>
      </header>

      {/* 추가/수정 폼 */}
      {showForm && (
        <div className="mb-4 rounded-2xl bg-[#e8e5fd] p-6 flex flex-col gap-3 shadow-xl border border-[#d1c4ff]">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#7e4cff] font-bold">별명</label>
            <input
              className="px-3 py-2 rounded-lg bg-white text-[#5a5799] border border-[#ecebff] focus:outline-none focus:ring-2 focus:ring-[#7e4cff]/20"
              placeholder="예: origin, dev, backup"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              maxLength={24}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#7e4cff] font-bold">Git 저장소 URL</label>
            <input
              className="px-3 py-2 rounded-lg bg-white text-[#5a5799] border border-[#ecebff] focus:outline-none focus:ring-2 focus:ring-[#7e4cff]/20"
              placeholder="예: https://github.com/org/repo.git"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-[#7e4cff] font-bold">로컬 폴더 경로</label>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg bg-white text-[#5a5799] border border-[#ecebff] focus:outline-none"
                placeholder="로컬 폴더 경로"
                value={form.path}
                disabled={true}
              />
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-2 rounded-lg bg-gradient-to-r from-[#e0defc] to-[#bba7ee] text-[#6e70f2] font-bold shadow hover:from-[#ede9fe] hover:to-[#bba7ee] transition"
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
              className="px-3 py-1.5 rounded-lg bg-[#bba7ee] text-[#7e4cff] font-bold hover:bg-[#ede9fe] hover:text-[#7e4cff] transition"
              onClick={() => { setShowForm(false); setEditRemote(null); }}
              type="button"
            >
              취소
            </button>
            <button
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#7e4cff] to-[#6e70f2] text-white font-bold shadow hover:from-[#bba7ee] hover:to-[#6e70f2] transition disabled:opacity-50"
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.url.trim() || !form.path.trim()}
            >
              {editRemote ? "수정" : "추가"}
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-4">
        {remotes.map(r => (
          <motion.li
            key={r.id}
            className="flex items-center justify-between bg-white/90 rounded-2xl px-6 py-4 group shadow-lg cursor-pointer border border-[#e0e0f5] transition-all"
            whileHover={{
              rotateZ: -6,
              scale: 1.03,
              boxShadow: "0 8px 32px 0 #7e4cff33",
              transition: { type: "spring", stiffness: 220, damping: 16 }
            }}
            whileTap={{
              scale: 1.17,
              transition: { type: "spring", stiffness: 340, damping: 16 }
            }}
            animate={clicked === r.id ? { scale: [1.17, 1], transition: { duration: 0.33 } } : {}}
            onClick={() => handleCardClick(r)}
            style={{ transition: "box-shadow 0.16s" }}
          >                            
            <div>
              <div className="font-extrabold text-[#6e70f2] text-lg flex items-center gap-1">
                <span className="mr-1">{r.name}</span>
              </div>
              <div className="text-[#888ccf] text-xs font-mono">{r.url}</div>
              <div className="text-[#a7a7c7] text-xs font-mono">{r.path}</div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={e => { e.stopPropagation(); setShowForm(true); setEditRemote(r); setForm(r); }}
                className="p-2 rounded-full hover:bg-[#ede9fe] transition"
                title="수정"
              >
                <Pencil className="w-4 h-4 text-[#7e4cff] hover:text-[#a084ee]" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRemove(r); }}
                className="p-2 rounded-full hover:bg-[#fff2f6] transition"
                title="삭제"
              >
                <Trash2 className="w-4 h-4 text-rose-400 hover:text-red-500" />
              </button>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
};

export default RemotesPanel;
