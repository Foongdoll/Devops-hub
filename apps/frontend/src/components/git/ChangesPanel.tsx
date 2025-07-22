import { FileText, Plus, Minus, Codesandbox } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { File } from '../../customhook/git/useChanges';
import { useRemoteContext } from '../../context/RemoteContext';
import type { Remote } from '../../customhook/git/useRemote';
import { TopBar, TopStageBar } from './GitBranchBar';


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
}


const ChangesPanel: React.FC<ChangesPanelProps> = ({
  stagedFiles, unstagedFiles,
  onStage, onUnstage,
  onSelectFile, selectedFile, diff,
  commitMsg, setCommitMsg,
  onCommit,
  fetchChanges,
  onSelectLocalBranch,
  onSelectRemoteBranch
}) => {

  const { selectedRemote, selectedLocalBranch, selectedRemoteBranch, localBranches, remoteBranches } = useRemoteContext();
  const [isPush, setIsPush] = useState(false);
  useEffect(() => {
    // 초기 로드 시 변경 사항 가져오기    
    if (!selectedRemote) return;
    fetchChanges(selectedRemote);
    
  }, [selectedRemote]);


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
        <div className="bg-gray-800 rounded-lg shadow p-3 flex-1 flex flex-col">
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
        <div className="bg-gray-800 rounded-lg shadow p-3 flex-1 flex flex-col">
          <div className="font-semibold text-gray-300 mb-2">Unstaged Files ({unstagedFiles.length})</div>
          <ul className="flex-1 space-y-1 overflow-y-auto">
            {unstagedFiles.map(f => (
              <li key={f.path} className="flex items-center justify-between bg-[#22173b] rounded-xl px-4 py-3 group transition shadow-sm cursor-pointer hover:bg-gray-700"
                onClick={() => selectedRemote && onSelectFile(f, selectedRemote)}
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
      </div>
      {/* Right: Diff viewer + Commit */}
      <div className="w-full md:w-2/3 flex flex-col h-full">
        <div className="bg-gray-900 rounded-lg shadow p-4 flex-1 overflow-y-auto">
          {selectedFile && diff ? (
            <pre className="font-mono text-sm text-gray-100">
              {(() => {
                let oldLine = 0;
                let newLine = 0;
                let inHunk = false;

                return diff.split('\n').flatMap((line, index) => {
                  // 파일 헤더 스킵
                  if (
                    line.startsWith('diff --git') ||
                    line.startsWith('index') ||
                    line.startsWith('--- ') ||
                    line.startsWith('+++ ')
                  ) {
                    return [];
                  }

                  // @@ ... @@ + 코드 한 줄 같이 있는 경우 분리
                  if (line.startsWith('@@')) {
                    inHunk = true;
                    // ex: @@ -17,6 +17,9 @@ const RequireAuth ...
                    const headerMatch = /(@@ [^@]+ @@)(.*)/.exec(line);
                    let header = '';
                    let code = '';
                    if (headerMatch) {
                      header = headerMatch[1];
                      code = headerMatch[2]?.trimStart() ?? '';
                    }

                    // 라인 번호 파싱
                    const match = /@@ -(\d+),?\d* \+(\d+),?\d* @@/.exec(line);
                    oldLine = match ? parseInt(match[1], 10) : 0;
                    newLine = match ? parseInt(match[2], 10) : 0;

                    // 헤더 줄 + 코드 줄(있다면)
                    const res = [
                      <div key={`hunk-${index}`} className="text-yellow-200 bg-gray-800 font-bold flex">
                        <span style={{ width: 38, textAlign: 'right', opacity: 0.4 }}></span>
                        <span style={{ width: 38, textAlign: 'right', opacity: 0.4 }}></span>
                        <span style={{ marginLeft: 8 }}>{header}</span>
                      </div>
                    ];

                    if (code) {
                      // 헤더 뒤에 바로 코드 있으면 한 줄 더 출력
                      let displayOld: string | number = '';
                      let displayNew: string | number = '';
                      let rowStyle = 'text-gray-300 bg-gray-700';

                      // 코드의 첫 글자가 +, -, 공백인지 판단
                      if (code.startsWith('+')) {
                        displayOld = '';
                        displayNew = newLine++;
                        rowStyle = 'text-green-400 bg-green-900';
                      } else if (code.startsWith('-')) {
                        displayOld = oldLine++;
                        displayNew = '';
                        rowStyle = 'text-red-400 bg-red-900';
                      } else {
                        displayOld = oldLine++;
                        displayNew = newLine++;
                      }

                      res.push(
                        <div key={`hunk-code-${index}`} className={`${rowStyle} flex`}>
                          <span style={{ width: 38, textAlign: 'right', opacity: 0.4 }}>
                            {displayOld !== '' ? displayOld : ''}
                          </span>
                          <span style={{ width: 38, textAlign: 'right', opacity: 0.4 }}>
                            {displayNew !== '' ? displayNew : ''}
                          </span>
                          <span style={{ marginLeft: 8 }}>{code}</span>
                        </div>
                      );
                    }
                    return res;
                  }

                  if (!inHunk) {
                    return [
                      <div key={index} className="text-gray-300 bg-gray-700 flex">
                        <span style={{ width: 38, textAlign: 'right', opacity: 0.4 }}></span>
                        <span style={{ width: 38, textAlign: 'right', opacity: 0.4 }}></span>
                        <span style={{ marginLeft: 8 }}>{line}</span>
                      </div>
                    ];
                  }

                  // 라인 번호 세팅
                  let displayOld: string | number = '';
                  let displayNew: string | number = '';
                  let rowStyle = 'text-gray-300 bg-gray-700';

                  if (line.startsWith('+')) {
                    displayOld = '';
                    displayNew = newLine++;
                    rowStyle = 'text-green-400 bg-green-900';
                  } else if (line.startsWith('-')) {
                    displayOld = oldLine++;
                    displayNew = '';
                    rowStyle = 'text-red-400 bg-red-900';
                  } else {
                    displayOld = oldLine++;
                    displayNew = newLine++;
                  }

                  return [
                    <div key={index} className={`${rowStyle} flex`}>
                      <span style={{ width: 38, textAlign: 'right', opacity: 0.4 }}>
                        {displayOld !== '' ? displayOld : ''}
                      </span>
                      <span style={{ width: 38, textAlign: 'right', opacity: 0.4 }}>
                        {displayNew !== '' ? displayNew : ''}
                      </span>
                      <span style={{ marginLeft: 8 }}>{line}</span>
                    </div>
                  ];
                });
              })()}
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
            onClick={() => selectedRemote && onCommit(selectedRemote, isPush)}
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