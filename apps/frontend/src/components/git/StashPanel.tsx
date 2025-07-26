import { Archive, FileText, Minus, PackagePlus, Plus, Trash2 } from 'lucide-react';
import type { File } from '../../customhook/git/useChanges';
import type { Remote } from '../../customhook/git/useRemote';
import { useEffect, useState } from 'react';
import { useRemoteContext } from '../../context/RemoteContext';
import { useGitSocket } from '../../context/GitSocketContext';

export interface Stash {
  name: string;
  message: string;
  files: File[];
}

export interface StashPanelProps {
  stashes: Stash[];
  onApply: (remote: Remote, stash: Stash) => void;
  onCreate: (remote: Remote | null, files: File[], message: string) => void;
  onDrop: (remote: Remote, stash: Stash) => void;
  onSelect: (stash: Stash) => void;
  selectedStash: Stash | null;
  stashFiles: File[];
  onStashFileSelect: (remote: Remote | null, stash: Stash | null, file: File) => void;
  selectedStashFile: File | null;
  diff: string;
  onFetchStashChangeFiles: (remote: Remote) => void;
  stashChangedFiles: File[];
  setStashChangedFiles: (files: File[]) => void;
  selectedChangedFiles: File[]; // 여러개 선택
  setSelectedChangedFiles: (files: File[]) => void;
  stashMessage: string;
  setStashMessage: (msg: string) => void;
  onFetchStashs: (remote: Remote) => void;
}

const StashPanel: React.FC<StashPanelProps> = ({
  stashes,
  onApply,
  onCreate,
  onDrop,
  onSelect,
  selectedStash,
  stashFiles,
  onStashFileSelect,
  selectedStashFile,
  diff,
  selectedChangedFiles,
  onFetchStashChangeFiles,
  stashChangedFiles,
  setStashChangedFiles,
  setSelectedChangedFiles,
  stashMessage, setStashMessage,
  onFetchStashs
}) => {
  const { selectedRemote } = useRemoteContext();
  const { emit } = useGitSocket();
  

  useEffect(() => {
    if (selectedRemote) {
      onFetchStashChangeFiles(selectedRemote);
      onFetchStashs(selectedRemote);
    }
  }, []);

  // 멀티 선택 핸들러 (동일)
  const handleToggleChangedFile = (file: File) => {
    const exists = selectedChangedFiles.find(f => f.path === file.path);
    if (exists) {
      setSelectedChangedFiles(selectedChangedFiles.filter(f => f.path !== file.path));
    } else {
      setSelectedChangedFiles([...selectedChangedFiles, file]);
    }
    // 필요하다면 외부 콜백도 호출

  };
  
  if(!selectedRemote) {
    return null;
  };

  return (
    <section className="flex h-[calc(100vh-220px)] gap-6 px-6 py-6">
      {/* 왼쪽: 변경 파일 리스트 (멀티 선택) */}
      <div className="w-1/4 bg-gray-800 rounded-xl shadow p-3 flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-400 font-semibold">Changed Files</span>
          {/* Stash 버튼 추가 */}
          <button
            className="flex items-center bg-purple-700 hover:bg-purple-900 text-white px-3 py-1 rounded-lg transition disabled:opacity-40"
            disabled={selectedChangedFiles.length === 0}
            onClick={() => onCreate(selectedRemote, selectedChangedFiles, stashMessage)}
            title="선택된 파일을 Stash로 저장"
          >
            <PackagePlus className="w-4 h-4 mr-1" />
            Stash
          </button>
        </div>
        {/* Stash 메시지 입력 */}
        <input
          type="text"
          placeholder="Stash message..."
          value={stashMessage}
          onChange={e => setStashMessage(e.target.value)}
          className="mb-2 px-2 py-1 rounded bg-gray-700 text-gray-100 text-xs"
        />
        <ul className="space-y-1 flex-1 overflow-y-auto">
          {stashChangedFiles.map(f => {
            const isSelected = selectedChangedFiles.some(sf => sf.path === f.path);
            return (
              <li
                key={f.path}
                className={`
                  flex items-center px-2 py-2 rounded-lg cursor-pointer transition-all
                  group
                  ${isSelected
                    ? 'bg-blue-900 text-blue-400 font-bold'
                    : 'hover:bg-gray-700 text-gray-200'}
                `}
                title={f.name}
                onClick={() => handleToggleChangedFile(f)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleChangedFile(f)}
                  className="mr-2 accent-blue-600"
                  tabIndex={-1}
                />
                <FileText className="inline w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate block max-w-[210px] select-text">{f.name}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 가운데: stash 목록 + stash 파일 */}
      <div className="w-1/4 flex flex-col gap-4">
        {/* stash 목록 */}
        <div className="bg-gray-800 rounded-xl shadow p-3 flex-1 min-h-[180px]">
          <div className="text-sm text-gray-400 font-semibold mb-3">Stashes</div>
          <ul className="space-y-1">
            {stashes.map(stash => (
              <li
                key={stash.name}
                className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer
                  ${selectedStash && selectedStash.name === stash.name
                    ? 'bg-blue-900 text-blue-400 font-bold'
                    : 'hover:bg-gray-700 text-gray-200'}`}
                onClick={() => onSelect(stash)}
              >
                <span>
                  <Archive className="inline w-4 h-4 mr-1" />
                  {stash.name}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onApply(selectedRemote, stash);
                    }}
                    title="Apply"
                    className="p-1 hover:bg-blue-800 rounded"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDrop(selectedRemote, stash);
                    }}
                    title="Drop"
                    className="p-1 hover:bg-red-900 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {/* stash 파일 목록 */}
        <div className="bg-gray-800 rounded-xl shadow p-3 flex-1 min-h-[180px]">
          <div className="text-sm text-gray-400 font-semibold mb-3">Files</div>
          <ul className="space-y-1 overflow-y-auto max-h-[230px]">
            {stashFiles.map(f => (
              <li
                key={f.path}
                className={`flex 
                items-center px-2 py-1 rounded 
                hover:bg-gray-700 transition cursor-pointer
                truncate
                  ${selectedStashFile && selectedStashFile.path === f.path
                    ? 'bg-blue-900 text-blue-400 font-bold'
                    : 'text-gray-200'}`}
                title={f.name}
                onClick={() => onStashFileSelect(selectedRemote || null, selectedStash || null, f)}
              >
                <FileText className="w-4 h-4 mr-2 text-gray-400" />
                {f.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 오른쪽: diff 뷰 */}
      <div className="w-1/2 bg-gray-900 rounded-xl shadow p-3 overflow-y-auto flex flex-col">
        <div className="text-sm text-gray-400 font-semibold mb-3">Diff Viewer</div>
        {diff ? (
          <div className="font-mono text-sm text-gray-100 w-fit min-w-full">
            {(() => {
              let oldLineNum = 0;
              let newLineNum = 0;

              return diff.split('\n').flatMap((line, index) => {
                // 1. diff 헤더 제거
                if (
                  line.startsWith('diff --git') ||
                  line.startsWith('index') ||
                  line.startsWith('--- ') ||
                  line.startsWith('+++ ')
                ) {
                  return [];
                }

                // 2. hunk 시작 부분 → 줄 번호 초기화
                if (line.startsWith('@@')) {
                  const match = /@@ -(\d+),?\d* \+(\d+),?\d*/.exec(line);
                  if (match) {
                    oldLineNum = parseInt(match[1], 10);
                    newLineNum = parseInt(match[2], 10);
                  }

                  const header = match ? line : `Hunk ${index}`;
                  return (
                    <div
                      key={`hunk-${index}`}
                      className="flex items-center font-bold bg-yellow-800/70 text-yellow-200 border-t border-b border-yellow-500/50 py-1"
                    >
                      <span className="w-6" />
                      <span className="w-9 text-xs opacity-40" />
                      <span className="w-9 text-xs opacity-40" />
                      <span className="ml-2">{header}</span>
                    </div>
                  );
                }

                // 3. 본문 라인 상태 초기화
                let displayOld: string | number = '';
                let displayNew: string | number = '';
                let bgClass = '';
                let icon = null;
                let textClass = '';
                let isSelectable = false;
                let actualLineNumber: number | null = null;

                if (line.startsWith('+')) {
                  displayOld = '';
                  displayNew = newLineNum;
                  actualLineNumber = newLineNum;
                  newLineNum++;
                  bgClass = 'bg-green-950 hover:bg-green-900';
                  textClass = 'text-green-300';
                  icon = <Plus size={16} className="inline-block text-green-400 mr-1" />;
                  isSelectable = true;
                } else if (line.startsWith('-')) {
                  displayOld = oldLineNum;
                  displayNew = '';
                  actualLineNumber = oldLineNum;
                  oldLineNum++;
                  bgClass = 'bg-rose-950 hover:bg-rose-900';
                  textClass = 'text-rose-300';
                  icon = <Minus size={16} className="inline-block text-rose-400 mr-1" />;
                  isSelectable = true;
                } else {
                  displayOld = oldLineNum;
                  displayNew = newLineNum;
                  actualLineNumber = newLineNum;
                  oldLineNum++;
                  newLineNum++;
                  bgClass = 'bg-gray-800 hover:bg-gray-700';
                  textClass = 'text-gray-400';
                  icon = null;
                  isSelectable = false;
                }

                return (
                  <div
                    key={index}
                    data-line-number={actualLineNumber ?? undefined}
                    data-index={index}
                    className={`flex items-center group border-b border-gray-700/60 ${bgClass}}`}
                  >
                    {/* 삭제 전 라인 번호 */}
                    <span className="w-9 text-xs text-right opacity-50 select-none pr-1">
                      {displayOld !== '' ? displayOld : ''}
                    </span>
                    {/* 추가 후 라인 번호 */}
                    <span className="w-9 text-xs text-right opacity-50 select-none pr-1">
                      {displayNew !== '' ? displayNew : ''}
                    </span>
                    {/* 줄 내용 */}
                    <span className={`ml-2 flex items-center gap-1 ${textClass} whitespace-pre`}>
                      {icon}
                      {line}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="text-gray-500 flex items-center justify-center h-full">
            파일을 선택하면 변경사항을 미리볼 수 있습니다.
          </div>
        )}
      </div>
    </section >
  );
};

export default StashPanel;
