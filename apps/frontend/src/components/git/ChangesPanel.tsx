import { FileText, Plus, Minus } from 'lucide-react';

export interface FileItem {
  path: string;
  name: string;
  // 필요시 상태(수정/삭제 등) 추가
}

export interface ChangesPanelProps {
  unstagedFiles: FileItem[];
  stagedFiles: FileItem[];
  onStage: (file: FileItem) => void;
  onUnstage: (file: FileItem) => void;
  onSelectFile: (file: FileItem) => void;
  selectedFile: FileItem | null;
  diff: string;
  commitMsg: string;
  setCommitMsg: (msg: string) => void;
  onCommit: () => void;
}


const ChangesPanel: React.FC<ChangesPanelProps> = ({
  stagedFiles, unstagedFiles,
  onStage, onUnstage,
  onSelectFile, selectedFile, diff,
  commitMsg, setCommitMsg,
  onCommit
}) => {
  return (
    <section className="flex flex-col md:flex-row h-[calc(100vh-220px)] gap-6 px-6 py-6">
      {/* Left: Staged/Unstaged */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="bg-gray-800 rounded-lg shadow p-3 flex-1 flex flex-col">
          <div className="font-semibold text-gray-300 mb-2">Unstaged Files ({unstagedFiles.length})</div>
          <ul className="flex-1 space-y-1 overflow-y-auto">
            {unstagedFiles.map(f => (
              <li key={f.path} className="flex items-center justify-between bg-[#22173b] rounded-xl px-4 py-3 group transition shadow-sm"
                onClick={() => onSelectFile(f)}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-200">{f.name}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); onStage(f); }}
                  className="p-1 rounded-full hover:bg-green-900"
                  title="Stage"
                >
                  <Plus className="w-4 h-4 text-green-400" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-3 flex-1 flex flex-col">
          <div className="font-semibold text-gray-300 mb-2">Staged Files ({stagedFiles.length})</div>
          <ul className="flex-1 space-y-1 overflow-y-auto">
            {stagedFiles.map(f => (
              <li key={f.path} className="flex items-center justify-between group rounded px-2 py-1 hover:bg-gray-700 transition cursor-pointer"
                onClick={() => onSelectFile(f)}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-200">{f.name}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); onUnstage(f); }}
                  className="p-1 rounded-full hover:bg-orange-900"
                  title="Unstage"
                >
                  <Minus className="w-4 h-4 text-orange-400" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Right: Diff viewer + Commit */}
      <div className="w-full md:w-2/3 flex flex-col h-full">
        <div className="bg-gray-900 rounded-lg shadow p-4 flex-1 overflow-y-auto">
          {selectedFile && diff ? (
            <pre className="font-mono text-sm text-gray-100">
              {diff}
            </pre>
          ) : (
            <div className="text-gray-500 flex items-center justify-center h-full">
              파일을 선택하면 변경사항을 미리볼 수 있습니다.
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <textarea
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            className="flex-1 bg-gray-800 text-gray-100 rounded-lg p-2 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-600 transition"
            rows={2}
            placeholder="커밋 메시지를 입력하세요"
          />
          <button
            onClick={onCommit}
            className="bg-blue-700 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl transition shadow"
            disabled={!stagedFiles.length || !commitMsg.trim()}
          >
            Commit
          </button>
        </div>
      </div>
    </section>
  );
}

export default ChangesPanel;