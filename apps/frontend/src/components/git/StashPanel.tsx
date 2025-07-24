import { Archive, FileText, Trash2 } from 'lucide-react';
import type { File } from '../../customhook/git/useChanges';


export interface Stash {
  name: string;
  message: string;
  files: File[];
}

export interface StashPanelProps {
  stashes: Stash[];
  onApply: (stash: Stash) => void;
  onDrop: (stash: Stash) => void;
  onSelect: (stash: Stash) => void;
  selectedStash: Stash | null;
  files: File[];
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  diff: string;
}


const StashPanel: React.FC<StashPanelProps> = ({ stashes, onApply, onDrop, onSelect, selectedStash, files, onFileSelect, selectedFile, diff }) => {
   
  return (
    <section className="flex flex-col md:flex-row h-[calc(100vh-220px)] gap-6 px-6 py-6">
      {/* Stash List */}
      <div className="w-full md:w-1/3 bg-gray-800 rounded-xl shadow p-3">
        <div className="text-sm text-gray-400 font-semibold mb-3">Stashes</div>
        <ul className="space-y-1">
          {stashes.map(stash => (
            <li key={stash.name}
              className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer
                ${selectedStash && selectedStash.name === stash.name ? 'bg-blue-900 text-blue-400 font-bold' : 'hover:bg-gray-700 text-gray-200'}`}
              onClick={() => onSelect(stash)}
            >
              <span><Archive className="inline w-4 h-4 mr-1" />{stash.name}</span>
              <div className="flex gap-1">
                <button onClick={e => { e.stopPropagation(); onApply(stash); }} title="Apply" className="p-1 hover:bg-blue-800 rounded">
                  ⬆️
                </button>
                <button onClick={e => { e.stopPropagation(); onDrop(stash); }} title="Drop" className="p-1 hover:bg-red-900 rounded">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Files in Stash */}
      <div className="w-full md:w-1/3 bg-gray-800 rounded-xl shadow p-3">
        <div className="text-sm text-gray-400 font-semibold mb-3">Files</div>
        <ul className="space-y-1">
          {files && files.map(f => (
            <li key={f.path}
              className={`flex items-center px-2 py-1 rounded hover:bg-gray-700 transition cursor-pointer
                ${selectedFile && selectedFile.path === f.path ? 'bg-blue-900 text-blue-400 font-bold' : 'text-gray-200'}`
              }
              onClick={() => onFileSelect(f)}
            >
              <FileText className="w-4 h-4 mr-2 text-gray-400" />
              {f.name}
            </li>
          ))}
        </ul>
      </div>
      {/* Diff */}
      <div className="w-full md:w-1/3 bg-gray-900 rounded-xl shadow p-3 overflow-y-auto">
        {diff ? (
          <pre className="font-mono text-sm text-gray-100">{diff}</pre>
        ) : (
          <div className="text-gray-500 h-full flex items-center justify-center">파일을 선택하세요</div>
        )}
      </div>
    </section>
  );
}

export default StashPanel;