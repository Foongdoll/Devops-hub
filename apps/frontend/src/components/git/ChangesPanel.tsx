import { FileText, FileQuestion, Plus, Minus, Repeat } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { File } from '../../customhook/git/useChanges';
import { useRemoteContext } from '../../context/RemoteContext';
import type { Remote } from '../../customhook/git/useRemote';
import { TopStageBar } from './GitBranchBar';
import { Tooltip } from 'react-tooltip';
import { useGitSocket } from '../../context/GitSocketContext';

export interface ChangesPanelProps {
  unstagedFiles: File[];
  setUnstagedFiles: (files: File[]) => void;
  stagedFiles: File[];
  setStagedFiles: (files: File[]) => void;
  onStage: (remote: Remote, files: File[]) => void;
  onUnstage: (remote: Remote, files: File[]) => void;
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

const liVariants = {
  initial: { opacity: 0, x: 60, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 360, damping: 28, duration: 0.21 } },
  exitLeft: { opacity: 0, x: -100, scale: 0.8, transition: { duration: 0.18 } },
  exitRight: { opacity: 0, x: 100, scale: 0.8, transition: { duration: 0.18 } },
  hover: { scale: 1.035, boxShadow: "0 4px 18px #5745d833" },
  tap: { scale: 0.95, opacity: 0.8 }
};

const ChangesPanel: React.FC<ChangesPanelProps> = ({
  stagedFiles, unstagedFiles,
  setStagedFiles, setUnstagedFiles,
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

  // exit 중인 파일 id 배열로 관리(멀티 가능)
  const [exitingStaged, setExitingStaged] = useState<string[]>([]);
  const [exitingUnstaged, setExitingUnstaged] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedRemote) return;
    fetchChanges(selectedRemote);
  }, [selectedRemote]);

  useEffect(() => { onSelectedLines([]); }, [selectedFile]);

  const onToggleStageFiles = (sw: boolean) => {
    if (!selectedRemote) return;
    sw ? onStage(selectedRemote, unstagedFiles) : onUnstage(selectedRemote, stagedFiles);
  };

  // 버튼 클릭 시 exit id 넣고 → exit 끝나면 onUnstage/onStage로 처리
  const handleStagedRemove = (f: File) => {
    setExitingStaged(ids => [...ids, f.path]);
  };
  const handleUnstagedAdd = (f: File) => {
    setExitingUnstaged(ids => [...ids, f.path]);
  };

  // exit animation 끝날 때 배열에서 삭제/이동
  const handleStagedExitComplete = (f: File) => {
    setExitingStaged(ids => ids.filter(id => id !== f.path));
    if (selectedRemote) onUnstage(selectedRemote, [f]);
  };
  const handleUnstagedExitComplete = (f: File) => {
    setExitingUnstaged(ids => ids.filter(id => id !== f.path));
    if (selectedRemote) onStage(selectedRemote, [f]);
  };

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
        <div className="bg-gray-800 rounded-2xl shadow p-3 flex-1 flex flex-col overflow-y-auto">
          <div className="font-semibold text-gray-300 mb-2 justify-between flex items-center">
            <span>Staged Files ({stagedFiles.length})</span>
            <span>
              <button onClick={() => onToggleStageFiles(false)}><Repeat /></button>
            </span>
          </div>
          <ul className="flex-1 space-y-1 overflow-y-auto o">
            <AnimatePresence>
              {stagedFiles.map(f => (
                <motion.li
                  key={f.path}
                  variants={liVariants}
                  initial="initial"
                  // animate="animate"
                  exit="exitRight"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ layout: { duration: 0.19, type: "spring" } }}
                  layout
                  data-tooltip-id={`file-name-tooltip-${f.path}`}
                  data-tooltip-content={f.name}
                  className="flex h-[34px] items-center justify-between bg-[#22173b] group rounded-xl px-4 py-3 hover:bg-indigo-900/80 transition shadow-sm cursor-pointer truncate relative"
                  onClick={() => selectedRemote && onSelectFile(f, selectedRemote)}
                  // exit 애니메이션 트리거: exitingStaged에 포함된 파일만 exit
                  animate={exitingStaged.includes(f.path) ? "exitRight" : "animate"}
                  onAnimationComplete={definition => {
                    // exitRight가 끝나면!
                    if (exitingStaged.includes(f.path) && definition === "exitRight") {
                      handleStagedExitComplete(f);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {f.status === "??" ? (
                      <FileQuestion className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="text-gray-200 max-w-[240px] truncate block font-semibold tracking-tight">{f.name}</span>
                    <Tooltip
                      id={`file-name-tooltip-${f.path}`}
                      place="top"
                      style={{ zIndex: 9999, fontSize: 16, maxWidth: 600 }}
                    />
                  </div>
                  <motion.button
                    whileHover={{ x: 3, scale: 1.18, backgroundColor: "#ba2d6580" }}
                    whileTap={{ scale: 0.9, opacity: 0.7 }}
                    onClick={e => {
                      e.stopPropagation();
                      handleStagedRemove(f);
                    }}
                    className="p-1 rounded-full hover:bg-orange-900"
                    title="Unstage"
                    style={{ marginLeft: 6 }}
                  >
                    <Minus className="w-4 h-4 text-orange-400" />
                  </motion.button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow p-3 flex-1 flex flex-col overflow-y-auto">
          <div className="font-semibold text-gray-300 mb-2 justify-between flex items-center">
            <span>Unstaged Files ({unstagedFiles.length})</span>
            <span>
              <button onClick={() => onToggleStageFiles(true)}><Repeat /></button>
            </span>
          </div>
          <ul className="flex-1 space-y-1 overflow-y-auto">
            <AnimatePresence>
              {unstagedFiles.map(f => (
                <motion.li
                  key={f.path}
                  variants={liVariants}
                  initial="initial"
                  exit="exitLeft"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ layout: { duration: 0.19, type: "spring" } }}
                  layout
                  data-tooltip-id={`file-name-tooltip-${f.path}`}
                  data-tooltip-content={f.name}
                  className="flex h-[34px] items-center justify-between bg-[#17282c] group rounded-xl px-4 py-3 hover:bg-teal-900/70 transition shadow-sm cursor-pointer truncate relative"
                  onClick={() => selectedRemote && onSelectFile(f, selectedRemote)}
                  animate={exitingUnstaged.includes(f.path) ? "exitLeft" : "animate"}
                  onAnimationComplete={definition => {
                    if (exitingUnstaged.includes(f.path) && definition === "exitLeft") {
                      handleUnstagedExitComplete(f);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {f.status === "??" ? (
                      <FileQuestion className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="text-gray-200 max-w-[240px] truncate block font-semibold tracking-tight">{f.name}</span>
                    <Tooltip
                      id={`file-name-tooltip-${f.path}`}
                      place="top"
                      style={{ zIndex: 9999, fontSize: 16, maxWidth: 600 }}
                    />
                  </div>
                  <motion.button
                    whileHover={{ x: -3, scale: 1.16, backgroundColor: "#22fba055" }}
                    whileTap={{ scale: 0.9, opacity: 0.7 }}
                    onClick={e => {
                      e.stopPropagation();
                      handleUnstagedAdd(f);
                    }}
                    className="p-1 rounded-full hover:bg-green-900"
                    title="Stage"
                    style={{ marginLeft: 6 }}
                  >
                    <Plus className="w-4 h-4 text-green-400" />
                  </motion.button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>

      <div className="w-full md:w-2/3 flex flex-col h-full">
        {/* ✅ 변경사항 버리기/선택버리기 버튼 */}
        <div className="mb-2 flex gap-2">
          <motion.button
            whileTap={{ scale: 0.91, rotate: -5, boxShadow: "0 3px 28px 0 #a084ee55" }}
            whileHover={{ scale: 1.06, backgroundColor: "#a084ee" }}
            className="
    bg-gradient-to-r from-purple-700 via-purple-600 to-purple-800
    hover:from-purple-800 hover:to-purple-700
    text-white px-5 py-2 rounded-xl shadow-lg
    font-bold transition-all duration-150
    tracking-wide mr-2
    focus:outline-none focus:ring-2 focus:ring-purple-300
    flex items-center gap-2
    disabled:opacity-50 disabled:cursor-not-allowed
  "
            disabled={!selectedFile}
            onClick={() => {
              if (selectedFile) {
                onSelectedLines([]);
                onDiscard(selectedRemote || {} as Remote, selectedFile);
              }
            }}
          >
            변경 사항 전체 버리기
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.91, rotate: 5, boxShadow: "0 3px 28px 0 #6e70f255" }}
            whileHover={{ scale: 1.06, backgroundColor: "#6e70f2" }}
            className="
    bg-gradient-to-r from-blue-700 via-purple-700 to-purple-800
    hover:from-blue-800 hover:to-purple-700
    text-white px-5 py-2 rounded-xl shadow-lg
    font-bold transition-all duration-150
    tracking-wide
    focus:outline-none focus:ring-2 focus:ring-blue-300
    flex items-center gap-2
    disabled:opacity-50 disabled:cursor-not-allowed
  "
            disabled={!selectedFile || selectedLines.length === 0}
            onClick={() => {
              if (selectedFile && selectedLines.length > 0) {
                onDiscard(selectedRemote || {} as Remote, selectedFile, selectedLines);
              }
            }}
          >
            선택한 줄 버리기
          </motion.button>
        </div>
        <div className="bg-gray-900 rounded-2xl shadow p-4 flex-1 overflow-hidden min-h-0 flex flex-col">
          {selectedFile && diff ? (
            <div className="relative flex-1 flex flex-col min-h-0">
              {/* 코드 전체에만 가로/세로 스크롤 */}
              <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 rounded-xl">
                {/* 코드 전체 박스의 min-w를 'max-content'로 하면, 줄 중 가장 긴 라인 기준으로 넓이 결정 */}
                <div className="font-mono text-[15px] text-gray-100 min-w-max">
                  {(() => {
                    let oldLineNum = 0;
                    let newLineNum = 0;
                    return diff.split('\n').flatMap((line, index) => {
                      // diff 헤더 제거
                      if (
                        line.startsWith('diff --git') ||
                        line.startsWith('index') ||
                        line.startsWith('--- ') ||
                        line.startsWith('+++ ')
                      ) {
                        return [];
                      }
                      // hunk 헤더
                      if (line.startsWith('@@')) {
                        const match = /@@ -(\d+),?\d* \+(\d+),?\d*/.exec(line);
                        if (match) {
                          oldLineNum = parseInt(match[1], 10);
                          newLineNum = parseInt(match[2], 10);
                        }
                        return (
                          <div
                            key={`hunk-${index}`}
                            className="flex items-center font-bold bg-gradient-to-r from-yellow-800/70 to-yellow-600/30 text-yellow-200 border-t border-b border-yellow-500/30 py-1 shadow-inner px-1"
                          >
                            <span className="w-7" />
                            <span className="w-9 text-xs opacity-30" />
                            <span className="w-9 text-xs opacity-30" />
                            <span className="ml-2 tracking-wide" style={{ whiteSpace: 'pre' }}>{line}</span>
                          </div>
                        );
                      }

                      let displayOld: string | number = '';
                      let displayNew: string | number = '';
                      let textClass = '';
                      let icon = null;
                      let isSelectable = false;
                      let actualLineNumber: number | null = null;
                      let bgClass = '';

                      if (line.startsWith('+')) {
                        displayOld = '';
                        displayNew = newLineNum;
                        actualLineNumber = newLineNum;
                        newLineNum++;
                        bgClass =
                          'bg-gradient-to-r from-green-400/20 to-green-900/40 hover:from-green-300/30 hover:to-green-900/50 border-l-4 border-green-400/70';
                        textClass = 'text-green-200';
                        icon = <Plus size={15} className="inline-block text-green-400 mr-1" />;
                        isSelectable = true;
                      } else if (line.startsWith('-')) {
                        displayOld = oldLineNum;
                        displayNew = '';
                        actualLineNumber = oldLineNum;
                        oldLineNum++;
                        bgClass =
                          'bg-gradient-to-r from-rose-700/20 to-rose-900/30 hover:from-rose-600/25 hover:to-rose-900/40 border-l-4 border-rose-400/70';
                        textClass = 'text-rose-200';
                        icon = <Minus size={15} className="inline-block text-rose-400 mr-1" />;
                        isSelectable = true;
                      } else {
                        displayOld = oldLineNum;
                        displayNew = newLineNum;
                        actualLineNumber = newLineNum;
                        oldLineNum++;
                        newLineNum++;
                        bgClass = 'bg-gray-800/90 hover:bg-blue-900/20 border-l-4 border-transparent';
                        textClass = 'text-gray-400';
                        icon = null;
                        isSelectable = false;
                      }

                      return (
                        <div
                          key={index}
                          className={`
                    group relative flex items-center border-b border-gray-800/50
                    px-2 py-1
                    transition-all duration-120
                    rounded-lg
                    ${bgClass}
                    ${selectedLines.includes(actualLineNumber) ? 'ring-2 ring-purple-300 z-10' : ''}
                  `}
                          style={{
                            whiteSpace: "pre", // **줄바꿈 없이 공백/탭 유지**
                          }}
                        >
                          {/* 체크박스 */}
                          <span className="w-7 flex justify-center">
                            {isSelectable && line.startsWith('+') && (
                              <input
                                type="checkbox"
                                checked={selectedLines.includes(actualLineNumber)}
                                onChange={() => handleToggleLine(actualLineNumber)}
                                className="accent-purple-500 scale-110"
                                title="이 줄 선택"
                              />
                            )}
                          </span>
                          {/* 삭제 전 라인 번호 */}
                          <span className="w-9 text-xs text-right opacity-40 select-none pr-1">
                            {displayOld !== '' ? displayOld : ''}
                          </span>
                          {/* 추가 후 라인 번호 */}
                          <span className="w-9 text-xs text-right opacity-40 select-none pr-1">
                            {displayNew !== '' ? displayNew : ''}
                          </span>
                          {/* 줄 내용 */}
                          <span
                            className={`ml-2 flex items-center gap-1 ${textClass} font-mono text-[15px] flex-1`}
                            style={{ whiteSpace: 'pre' }} // 원본 줄 그대로!
                          >
                            {icon}
                            <span>{line}</span>
                          </span>
                          {/* 복사 버튼 */}
                          <button
                            className="absolute right-2 top-1 opacity-0 group-hover:opacity-80 text-xs text-gray-400 hover:text-blue-300 transition"
                            onClick={() => navigator.clipboard.writeText(line)}
                            title="이 줄 복사"
                            tabIndex={-1}
                            style={{ pointerEvents: "auto" }}
                          >
                            복사
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
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