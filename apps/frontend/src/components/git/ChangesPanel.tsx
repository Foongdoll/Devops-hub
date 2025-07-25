import { FileText, FileQuestion, Plus, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { File } from '../../customhook/git/useChanges';
import { useRemoteContext } from '../../context/RemoteContext';
import type { Remote } from '../../customhook/git/useRemote';
import { TopStageBar } from './GitBranchBar';
import { Tooltip } from 'react-tooltip';
import { useGitSocket } from '../../context/GitSocketContext';


export interface ChangesPanelProps {
  unstagedFiles: File[];
  stagedFiles: File[];
  onStage: (file: File) => void;
  onUnstage: (file: File) => void;
  onSelectFile: (file: File, remote: Remote) => void;
  selectedFile: File | null;
  diff: string;
  commitMsg: string;
  setCommitMsg: (msg: string) => void;
  onCommit: (remote: Remote, isPush: boolean) => void;
  fetchChanges: (remote: Remote) => Promise<void>;
  onSelectLocalBranch: (branch: string, remote: Remote) => void;
  onSelectRemoteBranch: (branch: string) => void;
  onDiscard: (remote: Remote, file: File, lines?: number[]) => void;
  onSelectedLines: (lines: number[]) => void;
  selectedLines: number[];
  handleToggleLine: (lineIndex: number) => void;
}


const ChangesPanel: React.FC<ChangesPanelProps> = ({
  stagedFiles, unstagedFiles,
  onStage, onUnstage,
  onSelectFile, selectedFile, diff,
  commitMsg, setCommitMsg,
  onCommit,
  fetchChanges,
  onSelectLocalBranch,
  onSelectRemoteBranch,
  onDiscard,
  onSelectedLines,
  selectedLines,
  handleToggleLine
}) => {

  const { selectedRemote, selectedLocalBranch, selectedRemoteBranch, localBranches, remoteBranches } = useRemoteContext();
  const [isPush, setIsPush] = useState(false);
  const { emit } = useGitSocket();

  useEffect(() => {
    // 초기 로드 시 변경 사항 가져오기    
    if (!selectedRemote) return;
    fetchChanges(selectedRemote);
  }, [selectedRemote]);


  // ✅ 선택 초기화(파일 변경시)
  useEffect(() => {
    onSelectedLines([]);
  }, [selectedFile]);


  console.log(diff);
  console.log(selectedLines);

  return (
    <section className="flex flex-col md:flex-row h-[calc(100vh-220px)] gap-6 px-6 py-6">
      {/* Left: Staged/Unstaged */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <TopStageBar
          localBranches={localBranches}
          remoteBranches={remoteBranches}
          selectedLocalBranch={selectedLocalBranch}
          selectedRemoteBranch={selectedRemoteBranch}
          onSelectLocalBranch={onSelectLocalBranch}
          onSelectRemoteBranch={onSelectRemoteBranch}
          selectedRemote={selectedRemote || { name: '', url: '' } as Remote}
        />
        <div className="bg-gray-800 rounded-lg shadow p-3 flex-1 flex flex-col overflow-y-auto">
          <div className="font-semibold text-gray-300 mb-2">Staged Files ({stagedFiles.length})</div>
          <ul className="flex-1 space-y-1 overflow-y-auto">
            {stagedFiles.map(f => (
              <li key={f.path} className="flex items-center justify-between bg-[#22173b] group rounded px-2 py-1 hover:bg-gray-700 transition cursor-pointer"
                onClick={() => selectedRemote && onSelectFile(f, selectedRemote)}
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
        <div className="bg-gray-800 rounded-lg shadow p-3 flex-1 flex flex-col overflow-y-auto">
          <div className="font-semibold text-gray-300 mb-2">Unstaged Files ({unstagedFiles.length})</div>
          <ul className="flex-1 space-y-1 ">
            {unstagedFiles.map(f => (
              <li key={f.path}
                data-tooltip-id={`file-name-tooltip-${f.path}`}
                data-tooltip-content={f.name}
                className="flex items-center justify-between bg-[#22173b] rounded-xl px-4 py-3 group transition shadow-sm cursor-pointer hover:bg-gray-700"
                onClick={() => selectedRemote && onSelectFile(f, selectedRemote)}
              >
                <div className="flex items-center gap-2">
                  {f.status === "??" ?
                    (<FileQuestion className="w-4 h-4 text-gray-400" />) :
                    (<FileText className="w-4 h-4 text-gray-400" />)}
                  <span
                    className="text-gray-200 max-w-[250px] truncate block"
                  >
                    {f.name}
                  </span>
                  <Tooltip
                    id={`file-name-tooltip-${f.path}`}
                    place="top"
                    style={{ zIndex: 9999, fontSize: 16, maxWidth: 600 }}
                  />
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
      </div>
      {/* Right: Diff viewer + Commit */}
      <div className="w-full md:w-2/3 flex flex-col h-full">
        {/* ✅ 변경사항 버리기/선택버리기 버튼 */}
        <div className="mb-2 flex gap-2">
          <button
            className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-1 rounded"
            disabled={!selectedFile}
            onClick={() => {
              if (selectedFile) {
                onSelectedLines([]);
                onDiscard(selectedRemote || {} as Remote, selectedFile);
              }
            }}
          >
            변경 사항 전체 버리기
          </button>
          <button
            className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-1 rounded"
            disabled={!selectedFile || selectedLines.length === 0}
            onClick={() => {
              if (selectedFile && selectedLines.length > 0) {
                onDiscard(selectedRemote || {} as Remote, selectedFile, selectedLines);                
              }
            }}
          >
            선택한 줄 버리기
          </button>
        </div>
        <div className="bg-gray-900 rounded-lg shadow p-4 flex-1 overflow-y-auto">
          {selectedFile && diff ? (
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
                      className={`flex items-center group border-b border-gray-700/60 ${bgClass} ${selectedLines.includes(actualLineNumber)
                          ? 'ring-2 ring-purple-400 z-10'
                          : ''
                        }`}
                    >
                      {/* 체크박스 */}
                      <span className="w-6 flex justify-center">
                        {isSelectable && (
                          <input
                            type="checkbox"
                            checked={selectedLines.includes(actualLineNumber)}
                            onChange={() => handleToggleLine(actualLineNumber)}
                            className="accent-purple-600"
                            title="이 줄 선택"
                          />

                        )}
                      </span>
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
        <div className="mt-4 flex gap-2">
          <textarea
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            className="flex-1 bg-gray-800 text-gray-100 rounded-lg p-2 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-600 transition"
            rows={2}
            placeholder="커밋 메시지를 입력하세요"
          />
          <label className="flex items-center gap-1 text-sm cursor-pointer select-none px-2 py-1 rounded-lg hover:bg-gray-700 transition">
            <input
              type="checkbox"
              checked={isPush}
              onChange={e => setIsPush(e.target.checked)}
              className="accent-blue-600 w-4 h-4"
            />
            <span className="ml-1 text-gray-200">커밋 후 바로 푸시</span>
          </label>
          <button
            onClick={() => selectedRemote && (emit('fetch_changed_files', { remote: selectedRemote }), onCommit(selectedRemote, isPush))}
            className="bg-blue-700 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl transition shadow"
            disabled={!stagedFiles.length || !commitMsg.trim()}
          >
            Commit
          </button>
        </div>
      </div>
    </section>
  );
};

export default ChangesPanel;