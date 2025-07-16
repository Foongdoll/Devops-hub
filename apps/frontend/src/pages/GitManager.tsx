import React, { useEffect, useState } from "react";
import {
  Plus, Trash2, Github, ChevronLeft, Settings,
  ArrowDownToLine, ArrowUpToLine, GitCommit, RefreshCcw, Boxes
} from "lucide-react";
import { useGitManager, type GitStatusFile, type Remote } from "../customhook/useGitManager";
import { PullConflictModal } from "../components/PullConflictModal";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function StageTab({
  setChangedFiles, setStagedFiles,
  changedFiles, stagedFiles,
  onStage, onUnstage,
  tab, setTab,
  commitMsg, setCommitMsg,
  handleCommit,
  onDiffFileClick,
  selectedFile,
  setSelectedFile,
  setIsPushForward,
  isPushForward,
  branchList,
  selectedBranch,
  setSelectedBranch,
}: {
  setStagedFiles: (files: GitStatusFile[]) => void,
  setChangedFiles: (files: GitStatusFile[]) => void,
  changedFiles: GitStatusFile[], stagedFiles: GitStatusFile[],
  onStage: (file: GitStatusFile) => void,
  onUnstage: (file: GitStatusFile) => void,
  tab: "change" | "stage" | "commit", setTab: (tab: "change" | "stage" | "commit") => void,
  commitMsg: string,
  setCommitMsg: (msg: string) => void,
  handleCommit: () => void,
  onDiffFileClick: (file: GitStatusFile, staged?: boolean) => void;
  selectedFile: GitStatusFile | null;
  setSelectedFile: (file: GitStatusFile | null) => void;
  setIsPushForward: (push: boolean) => void;
  isPushForward: boolean,
  branchList: string[],
  selectedBranch: string | null,
  setSelectedBranch: (branch: string | null) => void
}) {

  // ✅ 전체 변경 파일 → 스테이지 올리기
  const handleStageAll = () => {
    if (changedFiles.length === 0) return;
    setStagedFiles([...stagedFiles, ...changedFiles]);
    setChangedFiles([]);
    if (selectedFile && changedFiles.some(f => f.file === selectedFile.file)) setSelectedFile(null);
  };

  // ✅ 전체 스테이지 파일 → 변경 파일 내리기
  const handleUnstageAll = () => {
    if (stagedFiles.length === 0) return;
    setChangedFiles([...changedFiles, ...stagedFiles]);
    setStagedFiles([]);
    if (selectedFile && stagedFiles.some(f => f.file === selectedFile.file)) setSelectedFile(null);
  };

  // 스테이징/언스테이징
  const handleStage = (file: GitStatusFile) => {
    setChangedFiles(changedFiles.filter(f => f.file !== file.file));      // name → file
    setStagedFiles([...stagedFiles, file]);
    setSelectedFile(selectedFile?.file === file.file ? null : selectedFile);
  };

  const handleUnstage = (file: GitStatusFile) => {
    setStagedFiles(stagedFiles.filter(f => f.file !== file.file));
    setChangedFiles([...changedFiles, file]);
    setSelectedFile(selectedFile?.file === file.file ? null : selectedFile);
  };


  // 파일 리스트 UI(재사용)
  function FileList({ files, onClick, onAction, actionLabel, color }: any) {
    return (
      <ul className="border rounded bg-white divide-y">
        {files.map((file: GitStatusFile) => (
          <li
            key={file.file}
            className={classNames(
              "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-50 transition",
              selectedFile?.file === file.file ? "bg-blue-50" : ""
            )}
            onClick={() => onClick(file)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={classNames(
                "text-xs px-2 py-0.5 rounded font-bold shrink-0",
                file.status === "A" ? "bg-green-100 text-green-700"
                  : file.status === "D" ? "bg-red-100 text-red-600"
                    : file.status === "M" ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-200 text-gray-500"
              )}>
                {file.status}
              </span>
              {/* 파일명 ...처리, 호버시 툴팁 */}
              <span
                className="text-sm truncate max-w-[240px] block"
                title={file.file}
                style={{ lineHeight: "1.5" }}
              >
                {file.file}
              </span>
            </div>
            {/* 버튼 width 고정, 중앙정렬 */}
            <div className="flex items-center" style={{ minWidth: 72, justifyContent: 'flex-end' }}>
              <button
                className="ml-2 text-xs font-semibold hover:underline px-2 py-1"
                style={{ color, minWidth: 64, textAlign: 'center' }}
                onClick={e => { e.stopPropagation(); onAction(file); }}
              >{actionLabel}</button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  // Diff 뷰어
  function DiffViewer({ diff }: { diff: string[] }) {
    if (!diff) return <div className="text-gray-400 p-8">변경 내용을 볼 파일을 선택하세요.</div>;
    return (
      <div className="w-[100%] h-full max-h-[65vh] min-h-[250px] flex justify-center items-stretch"
        style={{ background: "#16151e", borderRadius: "16px" }}>
        <pre
          className="
          w-max min-w-full max-w-[1200px] h-full m-0 text-sm text-[#e7e5ed] select-text font-mono leading-6
        "
          style={{
            border: "none",
            padding: "2rem 2.5rem",
            margin: 0,
            background: "transparent",
          }}
        >
          {diff.map((line, idx) => {
            // 헤더/메타 라인 구분
            if (
              line.startsWith('diff --git') ||
              line.startsWith('index ') ||
              line.startsWith('--- ') ||
              line.startsWith('+++ ')
            ) {
              return (
                <span
                  key={idx}
                  className="block whitespace-pre text-gray-400 text-xs opacity-70"
                  style={{ fontSize: "0.88em" }}
                >
                  {line}
                </span>
              );
            }
            // 실제 변경/문맥 라인
            let lineType = "ctx", content = line;
            if (line.startsWith("+")) lineType = "add";
            else if (line.startsWith("-")) lineType = "del";
            else if (line.startsWith("@@")) lineType = "hunk";
            let bg = "";
            if (lineType === "add") bg = "bg-green-900/40 text-[#99ffbc]";
            if (lineType === "del") bg = "bg-red-900/40 text-[#ff99a3]";
            if (lineType === "hunk") bg = "bg-[#2a2350] text-[#b7a9fa] font-bold";
            if (lineType === "ctx") bg = "text-[#e7e5ed]";
            return (
              <span key={idx} className={`block whitespace-pre ${bg}`}>
                {content}
              </span>
            );
          })}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] bg-[#f8f6fc] overflow-hidden">
      {/* 좌측 패널 */}
      <div className="w-[20%] min-w-[260px] border-r border-[#e2e0f7] bg-[#f8f6fc] flex flex-col">
        {/* 스테이지 파일 */}
        <div className="p-4 pb-2 font-bold text-[#5e4889] text-base border-b bg-[#f3f1fa] flex items-center justify-between">
          <span>스테이지 파일</span>
          <button
            className="ml-2 text-xs px-2 py-1 rounded bg-[#ffe5e5] text-[#c83b3b] font-semibold hover:bg-[#ffcaca] transition disabled:opacity-50"
            disabled={stagedFiles.length === 0}
            onClick={handleUnstageAll}
            type="button"
          >
            전체 내리기
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <FileList
            files={stagedFiles}
            onClick={onDiffFileClick}
            onAction={handleUnstage}
            actionLabel="내리기"
            color="#ff8585"
          />
        </div>
        {/* 변경 파일 */}
        <div className="p-4 pb-2 font-bold text-[#5e4889] text-base border-b bg-[#f3f1fa] mt-2 flex items-center justify-between">
          <span>변경 파일 ({changedFiles.length}개)</span>
          <button
            className="ml-2 text-xs px-2 py-1 rounded bg-[#e6eaff] text-[#4b2ea7] font-semibold hover:bg-[#d5dbfe] transition disabled:opacity-50"
            disabled={changedFiles.length === 0}
            onClick={handleStageAll}
            type="button"
          >
            전체 올리기
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <FileList
            files={changedFiles}
            onClick={onDiffFileClick}
            onAction={handleStage}
            actionLabel="올리기"
            color="#7a80fc"
          />
        </div>
      </div>
      {/* 우측 Diff + 커밋 메시지 */}
      <div className="w-[80%] flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-[#f3f1fa] border-[#e2e0f7] font-bold text-[#322446]">
          변경 내용 미리보기
          <span className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[#7a80fc]">커밋/푸쉬 브랜치:</span>
            <select
              className="px-2 py-1 rounded border border-[#e0e0ef] bg-white text-[#4b2ea7] font-semibold text-sm"
              value={selectedBranch || ""}
              onChange={e => setSelectedBranch(e.target.value)}
            >
              {branchList.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </span>
        </div>
        <div className="w-full m-auto max-w-[98%] h-full max-h-[65vh] min-h-[250px] flex justify-center items-stretch"
          style={{ background: "#16151e", borderRadius: "16px" }}>
          <div className="w-full overflow-x-auto">
            {selectedFile
              ? <DiffViewer diff={selectedFile.diff || []} />
              : <div className="flex items-center justify-center h-full text-gray-400 text-lg">좌측에서 파일을 클릭하세요.</div>
            }
          </div>
        </div>

        {/* 커밋 메시지/버튼 박스 */}
        <div className="p-6 border-t bg-[#f8f6fc] border-[#e2e0f7]">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <textarea
              className="border flex-1 min-h-[42px] rounded p-2 text-sm resize-none"
              placeholder="커밋 메시지 입력"
              value={commitMsg}
              onChange={e => setCommitMsg(e.target.value)}
              rows={2}
              maxLength={100}
            />
            <button
              className="min-w-[120px] px-5 py-2 rounded bg-[#7a80fc] hover:bg-[#4b2ea7] text-white font-semibold text-sm transition"
              onClick={handleCommit}
            >
              커밋 실행
            </button>
            <span className="text-sm text-gray-500 flex items-center gap-2">
              커밋과 동시에 푸쉬
              <input type="checkbox" checked={isPushForward} onChange={e => setIsPushForward(e.target.checked)} />
            </span>

          </div>
          {!stagedFiles.length &&
            <div className="mt-1 text-xs text-gray-400 text-center">스테이지에 올린 파일이 없습니다.</div>
          }
        </div>
      </div>
    </div>
  );
}

function GitConfigModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl min-w-[320px] p-8 relative">
        <button onClick={onClose} className="absolute right-4 top-3 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        <div className="font-bold text-lg mb-4 text-[#322446]">Git 계정 설정</div>
        <div className="space-y-2">
          <input value={user} onChange={e => setUser(e.target.value)} className="border p-2 rounded w-full" placeholder="깃 사용자명" />
          <input value={email} onChange={e => setEmail(e.target.value)} className="border p-2 rounded w-full" placeholder="이메일" />
          <input value={pw} onChange={e => setPw(e.target.value)} className="border p-2 rounded w-full" placeholder="비밀번호" type="password" />
        </div>
        <button className="mt-4 w-full bg-[#7a80fc] hover:bg-[#4b2ea7] text-white font-semibold py-2 rounded"
          onClick={onClose}>
          저장
        </button>
      </div>
    </div>
  );
}

// 원격 리모트 추가 Modal
function RemoteAddModal({ open, onClose, onSave }: { open: boolean, onClose: () => void, onSave: (remote: any) => void }) {
  const [remoteName, setRemoteName] = useState("");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [remotePath, setRemotePath] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl min-w-[350px] p-8 relative">
        <button onClick={onClose} className="absolute right-4 top-3 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        <div className="font-bold text-lg mb-4 text-[#322446]">원격 리모트 추가</div>
        <div className="space-y-2">
          <input value={remoteName} onChange={e => setRemoteName(e.target.value)} className="border p-2 rounded w-full" placeholder="리모트 별명" />
          <input value={remoteUrl} onChange={e => setRemoteUrl(e.target.value)} className="border p-2 rounded w-full" placeholder="원격 저장소 URL" />
          <div className="flex gap-2">
            <input value={remotePath} onChange={e => setRemotePath(e.target.value)} className="border p-2 rounded flex-1" placeholder="로컬 폴더 경로" />
            {/* 실제 환경에선 폴더 선택기 연동 */}
          </div>
        </div>
        <button
          className="mt-4 w-full bg-[#7a80fc] hover:bg-[#4b2ea7] text-white font-semibold py-2 rounded"
          onClick={() => {
            if (remoteName && remoteUrl) {
              onSave({ name: remoteName, url: remoteUrl, path: remotePath });
              setRemoteName(""); setRemoteUrl(""); setRemotePath("");
              onClose();
            }
          }}
        >
          저장
        </button>
      </div>
    </div>
  );
}

function RemoteList({
  remotes, onSelect, onAdd, onDelete
}: {
  remotes: any[], onSelect: (r: any) => void, onAdd: () => void, onDelete: (id: string) => void
}) {
  return (
    <div className="flex flex-col items-center py-14 min-h-[80vh] bg-[#f8f6fc]">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-bold text-[#322446]">원격 리모트 목록</div>
          <button
            className="flex items-center px-3 py-1.5 rounded bg-[#7a80fc] hover:bg-[#4b2ea7] text-white text-sm font-semibold"
            onClick={onAdd}
          >
            <Plus className="w-4 h-4" /> 원격 리모트 추가
          </button>
        </div>
        <div className="grid gap-4">
          {remotes.map((r: any) => (
            <div
              key={r.id}
              className="flex items-center bg-white border border-[#e0dbf7] rounded-xl shadow-sm px-5 py-4 gap-4 hover:shadow-lg transition cursor-pointer"
              onClick={() => onSelect(r)}
            >
              <Github className="text-[#7a80fc] w-6 h-6" />
              <div className="flex-1">
                <div className="font-bold text-[#3a2959]">{r.name}</div>
                <div className="text-xs text-[#7a80fc] break-all">{r.url}</div>
                <div className="text-xs text-[#b5aedf]">{r.path}</div>
              </div>
              <button className="ml-2 text-[#c7b8ee] hover:text-red-400 p-1 rounded" onClick={e => { e.stopPropagation(); onDelete(r.id); }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BranchLabels({ branches }: { branches: string[] }) {
  if (!branches || branches.length === 0) return null;
  return (
    <span className="flex gap-1 ml-1">
      {branches.map(branch => (
        <span
          key={branch}
          className={`
            bg-[#e8e5fd] border border-[#7a80fc] text-[#5248a1] px-1.5 py-0.5 rounded text-[11px] font-semibold
            ${branch.startsWith("origin/") ? "bg-[#d0f0fa] border-[#6edcff] text-[#2898b7]" : ""}
          `}
        >
          {branch}
        </span>
      ))}
    </span>
  );
}
// ===================== GitRepository (with Stage Tab) =====================

function GitRepository({
  remote,
  onBack,
  onShowConfig,
  commits,
  setChangedFiles,
  setStagedFiles,
  changedFiles,
  stagedFiles,
  commitMsg,
  setCommitMsg,
  setTab,
  tab,
  showStageTab,
  setShowStageTab,
  fetchChangedFiles,
  onDiffFileClick,
  selectedFile,
  setSelectedFile,
  handleCommit,
  setIsPushForward,
  isPushForward,
  selectedBranch,
  setSelectedBranch,
  branchList,
  setBranchList,
  handlePull,
  handlePush
}:
  {
    remote: Remote;
    onBack: () => void;
    onShowConfig: () => void;
    commits: any[];
    setChangedFiles: (files: GitStatusFile[]) => void;
    setStagedFiles: (files: GitStatusFile[]) => void;
    changedFiles: GitStatusFile[];
    stagedFiles: GitStatusFile[];
    commitMsg: string;
    setCommitMsg: (msg: string) => void;
    setTab: (tab: "change" | "stage" | "commit") => void;
    tab: "change" | "stage" | "commit";
    showStageTab: boolean;
    setShowStageTab: (show: boolean) => void;
    fetchChangedFiles: () => void;
    onDiffFileClick: (file: GitStatusFile, staged?: boolean) => void;
    selectedFile: GitStatusFile | null;
    setSelectedFile: (file: GitStatusFile | null) => void;
    handleCommit: () => void;
    setIsPushForward: (push: boolean) => void;
    isPushForward: boolean;
    selectedBranch: string | null;
    setSelectedBranch: (branch: string | null) => void;
    branchList: string[];
    setBranchList: (branches: string[]) => void;
    handlePull: () => void;
    handlePush: () => void;
  }
) {

  // 펼침/접힘 상태 (브랜치별)
  const [openMap, setOpenMap] = useState<{ [branch: string]: boolean }>(() =>
    Object.fromEntries(branchList.map(b => [b, true]))
  );

  useEffect(() => {
    setOpenMap(Object.fromEntries(branchList.map(b => [b, true])));
  }, [branchList]);

  // 토글 함수
  const toggleBranch = (branch: string) => {
    setOpenMap(prev => ({
      ...prev,
      [branch]: !prev[branch]
    }));
  };

  // 브랜치 필터링
  const filteredCommits =
    selectedBranch === "전체"
      ? commits
      : commits.filter(b => b.branch === selectedBranch);

  const handleStage = (file: GitStatusFile) => {
    setChangedFiles(changedFiles.filter(f => f.file !== file.file));
    setStagedFiles([...stagedFiles, file]);
    setTab("stage");
  };
  const handleUnstage = (file: GitStatusFile) => {
    setStagedFiles(stagedFiles.filter(f => f.file !== file.file));
    setChangedFiles([...changedFiles, file]);
    setTab("change");
  };
  return (
    <div className="flex flex-col bg-[#f8f6fc] min-h-[80vh]">
      {/* 상단 툴바 */}
      <div className="flex items-center h-14 px-6 border-b border-[#ede9f6] bg-white">
        <button onClick={onBack} className="mr-4 px-2 py-1 rounded hover:bg-[#ede9f6] text-[#4b2ea7] font-semibold flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> 원격 목록
        </button>
        <div className="font-bold text-lg text-[#322446]">{remote.name}</div>
        <div className="ml-3 text-xs text-[#7a80fc]">{remote.url}</div>
        <div className="flex-1" />
        <button className="ml-2 flex items-center px-3 py-1 rounded bg-[#4b2ea7] hover:bg-[#7a80fc] text-white text-sm font-semibold"
          onClick={onShowConfig}>
          <Settings className="w-4 h-4" /> 깃 설정
        </button>
      </div>
      {/* 깃 액션 툴바 */}
      <div className="flex items-center gap-2 px-8 py-5">
        <button className="flex items-center gap-1 px-3 py-1 rounded bg-[#7a80fc] hover:bg-[#4b2ea7] text-white text-sm font-semibold"
          onClick={handlePull}
        >
          <ArrowDownToLine className="w-4 h-4" /> Pull
        </button>
        <button className="flex items-center gap-1 px-3 py-1 rounded bg-[#7a80fc] hover:bg-[#4b2ea7] text-white text-sm font-semibold"
          onClick={handlePush}
        >
          <ArrowUpToLine className="w-4 h-4" /> Push
        </button>
        <button
          className="flex items-center gap-1 px-3 py-1 rounded bg-[#7a80fc] hover:bg-[#4b2ea7] text-white text-sm font-semibold"
          onClick={fetchChangedFiles}
        >
          <GitCommit className="w-4 h-4" /> Commit
        </button>
        <button className="flex items-center gap-1 px-3 py-1 rounded bg-[#7a80fc] hover:bg-[#4b2ea7] text-white text-sm font-semibold">
          <RefreshCcw className="w-4 h-4" /> Fetch
        </button>
        <button className="flex items-center gap-1 px-3 py-1 rounded bg-[#7a80fc] hover:bg-[#4b2ea7] text-white text-sm font-semibold">
          <Boxes className="w-4 h-4" /> Stash
        </button>
      </div>
      {/* 변경파일/스테이지/커밋 탭 or 커밋 히스토리 */}
      <div className="flex-1 px-8 pb-8">
        {showStageTab ? (
          <StageTab
            setChangedFiles={setChangedFiles}
            setStagedFiles={setStagedFiles}
            changedFiles={changedFiles}
            stagedFiles={stagedFiles}
            onStage={handleStage}
            onUnstage={handleUnstage}
            tab={tab}
            setTab={setTab}
            commitMsg={commitMsg}
            setCommitMsg={setCommitMsg}
            handleCommit={handleCommit}
            onDiffFileClick={onDiffFileClick}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            setIsPushForward={setIsPushForward}
            isPushForward={isPushForward}
            branchList={branchList}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch}
          />
        ) : (
          <div className="flex flex-col relative px-8 py-8 bg-[#f8f6fc] min-h-[80vh]">
            <div className="text-lg font-semibold mb-4 text-[#4b2ea7]">커밋 히스토리</div>

            {/* 상단 브랜치 선택 버튼 */}
            <div className="flex gap-2 mb-8 flex-wrap">
              <button
                className={`px-3 py-1 rounded text-sm font-semibold border ${selectedBranch === "전체"
                  ? "bg-[#7a80fc] text-white border-[#7a80fc]"
                  : "bg-white text-[#7a80fc] border-[#7a80fc] hover:bg-[#ece9fd]"
                  }`}
                onClick={() => setSelectedBranch("전체")}
              >
                전체
              </button>
              {branchList.map(branch => (
                <button
                  key={branch}
                  className={`px-3 py-1 rounded text-sm font-semibold border ${selectedBranch === branch
                    ? "bg-[#7a80fc] text-white border-[#7a80fc]"
                    : "bg-white text-[#7a80fc] border-[#7a80fc] hover:bg-[#ece9fd]"
                    }`}
                  onClick={() => setSelectedBranch(branch)}
                >
                  {branch}
                </button>
              ))}
            </div>

            <ul className="relative pl-10">
              {/* 세로라인 (ul전체) */}
              <div className="absolute top-0 bottom-0 left-5 w-1 bg-[#ede9f6] z-0 rounded" />
              {filteredCommits.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  커밋 내역이 없습니다.
                </div>
              )}
              {filteredCommits.map((branchObj, bIdx) => (
                <div key={branchObj.branch} className="mb-14">
                  {/* 브랜치명 헤더 (토글) */}
                  <button
                    className="flex items-center gap-2 mb-5 outline-none focus:ring"
                    onClick={() => toggleBranch(branchObj.branch)}
                    type="button"
                  >
                    <span
                      className={
                        "bg-[#e8e5fd] border border-[#7a80fc] text-[#5248a1] px-2 py-1 rounded font-semibold text-xs transition" +
                        (openMap[branchObj.branch] ? " shadow" : " opacity-60")
                      }
                    >
                      {branchObj.branch}
                    </span>
                    <span className="text-sm text-[#b5aedf]">
                      ({branchObj.commits.length} commits)
                    </span>
                    <svg
                      className={
                        "w-4 h-4 ml-1 transition-transform " +
                        (openMap[branchObj.branch] ? "rotate-90" : "rotate-0")
                      }
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {/* 커밋 타임라인 (접힘/펼침) */}
                  {openMap[branchObj.branch] && (
                    <ul className="relative pl-10">
                      <div className="absolute top-0 bottom-0 left-5 w-1 bg-[#ede9f6] z-0 rounded" />
                      {branchObj.commits.map((commit, idx) => (
                        <li
                          key={`${branchObj.branch}-${commit.hash}-${idx}`}
                          className="relative z-10 mb-7 flex items-start"
                        >
                          {/* 원 + 라인 (왼쪽) */}
                          <div className="flex flex-col items-center mr-4">
                            <span
                              className={`block w-4 h-4 rounded-full border-2 border-[#7a80fc] bg-white shadow ${idx === 0 ? "ring-2 ring-[#7a80fc]" : ""
                                }`}
                            />
                            {idx < branchObj.commits.length - 1 && (
                              <span className="block w-[2px] flex-1 bg-[#ede9f6] mt-[-2px]" />
                            )}
                          </div>
                          {/* 내용 */}
                          <div className="flex-1 bg-white rounded-lg shadow px-5 py-3">
                            <div className="flex items-center gap-2 text-sm">
                              <BranchLabels branches={commit.branches} />
                              <span className="font-medium text-[#322446]">{commit.message}</span>
                            </div>
                            <div className="flex gap-3 mt-1 text-xs text-[#b8a6d8]">
                              <span>{commit.date}</span>
                              <span>by {commit.author}</span>
                              <span>{commit.hash}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== 아래는 기존 원격 목록/추가/설정 모달 컴포넌트와 연결용 ==========

// (위에 RemoteAddModal, GitConfigModal, RemoteList 정의 코드 복붙/참조)



export default function GitManager() {
  const {
    remotes,
    selectedRemote,
    setSelectedRemote,
    showRemoteModal,
    setShowRemoteModal,
    showConfigModal,
    setShowConfigModal,
    handleAddRemote,
    handleDeleteRemote,
    handleSelectRemote,
    commits,
    setShowStageTab,
    showStageTab,
    setTab,
    tab,
    setChangedFiles,
    setStagedFiles,
    changedFiles,
    stagedFiles,
    commitMsg,
    setCommitMsg,
    fetchChangedFiles,
    onDiffFileClick,
    selectedFile,
    setSelectedFile,
    handleCommit,
    setIsPushForward,
    isPushForward,
    selectedBranch,
    setSelectedBranch,
    branchList,
    setBranchList,
    handlePull,
    conflictFiles,
    showConflictModal,
    setShowConflictModal,
    pullDetails,
    setPullDetails,
    handleResolve,
    handlePush,
    handleFetch,
    handleStash,
    handlePopStash
  } = useGitManager();

  return (
    <>
      {selectedRemote
        ? (
          <GitRepository
            remote={selectedRemote}
            onBack={() => setSelectedRemote(null)}
            onShowConfig={() => setShowConfigModal(true)}
            commits={commits}
            setChangedFiles={setChangedFiles}
            setStagedFiles={setStagedFiles}
            setShowStageTab={setShowStageTab}
            showStageTab={showStageTab}
            changedFiles={changedFiles}
            stagedFiles={stagedFiles}
            commitMsg={commitMsg}
            setCommitMsg={setCommitMsg}
            setTab={setTab}
            tab={tab}
            fetchChangedFiles={fetchChangedFiles}
            onDiffFileClick={onDiffFileClick}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            handleCommit={handleCommit}
            setIsPushForward={setIsPushForward}
            isPushForward={isPushForward}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch}
            branchList={branchList}
            setBranchList={setBranchList}
            handlePull={handlePull}
            handlePush={handlePush}
          />
        )
        : (
          <RemoteList
            remotes={remotes}
            onSelect={handleSelectRemote}
            onAdd={() => setShowRemoteModal(true)}
            onDelete={handleDeleteRemote}
          />
        )}
      <RemoteAddModal open={showRemoteModal} onClose={() => setShowRemoteModal(false)} onSave={handleAddRemote} />
      <GitConfigModal open={showConfigModal} onClose={() => setShowConfigModal(false)} />
      <PullConflictModal
        open={showConflictModal}
        conflictFiles={conflictFiles}
        onResolve={handleResolve}
        onClose={() => setShowConflictModal(false)}
        details={pullDetails || ''}
      />
    </>
  );
}