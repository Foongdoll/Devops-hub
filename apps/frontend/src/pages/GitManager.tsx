import React, { useState } from "react";
import {
  Plus, Trash2, Github, ChevronLeft, Settings,
  ArrowDownToLine, ArrowUpToLine, GitCommit, RefreshCcw, Boxes
} from "lucide-react";
import { useGitManager } from "../customhook/useGitManager";

// 더미 파일 (실제로는 API로 불러옴)
const initialChangedFiles = [
  { name: "apps/backend/src/app.module.ts", status: "M" },
  { name: "apps/frontend/src/App.tsx", status: "A" },
  { name: "apps/frontend/src/layout/TopBar.tsx", status: "M" },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const mockChangedFiles = [
  {
    name: "apps/frontend/src/layout/TopBar.tsx", status: "M", diff: [
      { type: "del", content: "const getTitle = (pathname: string) =>{" },
      { type: "del", content: "  if(pathname.startsWith('/channel/notice')) return '# 공지';" },
      { type: "del", content: "  if(pathname.startsWith('/channel/new-project')) return '🚀 프로젝트·신제품';" },
      { type: "del", content: "  if(pathname.startsWith('/channel/marketing')) return '🎯 팀·마케팅';" },
      { type: "add", content: "const getTitle = (pathname: string) =>{" },
      { type: "add", content: "  if(pathname.startsWith('/terminals')) return '타이밍';" },
      { type: "add", content: "  if(pathname.startsWith('/git')) return 'Git 관리';" },
      { type: "ctx", content: "  return '넥시트';" }
    ]
  },
  {
    name: "apps/frontend/src/App.tsx", status: "A", diff: [
      { type: "add", content: "import React from 'react';" },
      { type: "add", content: "const App = () => <div>Hello</div>;" }
    ]
  },
  {
    name: "apps/backend/src/app.module.ts", status: "M", diff: [
      { type: "ctx", content: "// unchanged code..." },
      { type: "del", content: "export class OldAppModule {}" },
      { type: "add", content: "export class AppModule {}" }
    ]
  }
];
function StageTab({ setChangedFiles, setStagedFiles, changedFiles, stagedFiles, onStage, onUnstage, tab, setTab, commitMsg, setCommitMsg, onCommit }: any) {
  const [selectedFile, setSelectedFile] = useState<any | null>(null);

  // 스테이징/언스테이징
  const handleStage = (file: any) => {
    setChangedFiles(changedFiles.filter(f => f.name !== file.name));
    setStagedFiles([...stagedFiles, file]);
    setSelectedFile(selectedFile?.name === file.name ? null : selectedFile);
  };
  const handleUnstage = (file: any) => {
    setStagedFiles(stagedFiles.filter(f => f.name !== file.name));
    setChangedFiles([...changedFiles, file]);
    setSelectedFile(selectedFile?.name === file.name ? null : selectedFile);
  };

  // 커밋 실행
  const handleCommit = () => {
    alert(
      `커밋 완료!\n메시지: ${commitMsg}\n파일:\n${stagedFiles.map(f => f.name).join("\n")}`
    );
    setStagedFiles([]);
    setCommitMsg("");
    setSelectedFile(null);
  };

  // 파일 리스트 UI(재사용)
  function FileList({ files, onClick, onAction, actionLabel, color }: any) {
    return (
      <ul className="border rounded bg-white divide-y">
        {files.map((file: any) => (
          <li
            key={file.name}
            className={classNames(
              "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-50 transition",
              selectedFile?.name === file.name ? "bg-blue-50" : ""
            )}
            onClick={() => onClick(file)}
          >
            <div className="flex items-center gap-2">
              <span className={classNames(
                "text-xs px-2 py-0.5 rounded font-bold",
                file.status === "A" ? "bg-green-100 text-green-700"
                  : file.status === "D" ? "bg-red-100 text-red-600"
                    : "bg-yellow-100 text-yellow-700"
              )}>
                {file.status}
              </span>
              <span className="text-sm">{file.name}</span>
            </div>
            <button
              className={`ml-2 text-xs font-semibold hover:underline`}
              style={{ color }}
              onClick={e => { e.stopPropagation(); onAction(file); }}
            >{actionLabel}</button>
          </li>
        ))}
      </ul>
    );
  }

  // Diff 뷰어
  function DiffViewer({ diff }: { diff: any[] }) {
    if (!diff) return <div className="text-gray-400 p-8">변경 내용을 볼 파일을 선택하세요.</div>;
    return (
      <pre className="rounded-lg bg-[#17171a] text-sm p-5 overflow-auto text-[#e7e5ed] select-text font-mono leading-6">
        {diff.map((line, idx) => (
          <div key={idx}
            className={classNames(
              "whitespace-pre",
              line.type === "add" && "bg-green-900/40 text-[#99ffbc]",
              line.type === "del" && "bg-red-900/40 text-[#ff99a3]",
              line.type === "ctx" && "text-[#e7e5ed]"
            )}>
            <span>
              {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
            </span>
            {line.content}
          </div>
        ))}
      </pre>
    );
  }

  return (
    <div className="flex h-[80vh] w-full bg-[#f8f6fc] overflow-hidden">
      {/* 좌측 패널 */}
      <div className="w-[420px] min-w-[260px] border-r border-[#e2e0f7] bg-[#f8f6fc] flex flex-col">
        {/* 스테이지 파일 */}
        <div className="p-4 pb-2 font-bold text-[#5e4889] text-base border-b bg-[#f3f1fa]">스테이지 파일</div>
        <div className="flex-1 overflow-auto p-2">
          <FileList
            files={stagedFiles}
            onClick={setSelectedFile}
            onAction={handleUnstage}
            actionLabel="내리기"
            color="#ff8585"
          />
        </div>
        {/* 변경 파일 */}
        <div className="p-4 pb-2 font-bold text-[#5e4889] text-base border-b bg-[#f3f1fa] mt-2">변경 파일</div>
        <div className="flex-1 overflow-auto p-2">
          <FileList
            files={changedFiles}
            onClick={setSelectedFile}
            onAction={handleStage}
            actionLabel="올리기"
            color="#7a80fc"
          />
        </div>
      </div>
      {/* 우측 Diff + 커밋 메시지 */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-[#f3f1fa] border-[#e2e0f7] font-bold text-[#322446]">
          변경 내용 미리보기
        </div>
        <div className="flex-1 overflow-auto p-5">
          {selectedFile
            ? <DiffViewer diff={selectedFile.diff} />
            : <div className="flex items-center justify-center h-full text-gray-400 text-lg">좌측에서 파일을 클릭하세요.</div>
          }
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
              disabled={!stagedFiles.length || !commitMsg.trim()}
              onClick={handleCommit}
            >
              커밋 실행
            </button>
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

const mockCommits = [
  {
    hash: "5f767b",
    message: "feat: 스크롤바 커스텀 css 추가",
    branches: ["main", "origin/main"], // 여러 브랜치 가능!
    date: "2025-07-15 19:38",
    author: "Foongdoll",
  },
  {
    hash: "88f41d",
    message: "feat: 트리/탐색기 등 모듈 단위 분리, 드래그 & 드롭 구현 등",
    branches: [],
    date: "2025-07-15 00:03",
    author: "Foongdoll",
  },
  {
    hash: "c2b694c",
    message: "doc: React 공통 컴포넌트, Context 생성",
    branches: ["origin/master"],
    date: "2025-07-11 00:04",
    author: "Foongdoll",
  }
  // ... 이하 생략
];

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

function GitRepository({ remote, onBack, onShowConfig, commits }: any) {
  const [showStageTab, setShowStageTab] = useState(false);
  const [tab, setTab] = useState<"change" | "stage" | "commit">("change");
  const [changedFiles, setChangedFiles] = useState(mockChangedFiles);
  const [stagedFiles, setStagedFiles] = useState<any[]>([]);
  const [commitMsg, setCommitMsg] = useState("");

  // 모든 브랜치명 추출
  const branchNames = commits.map(b => b.branch);
  // 선택된 브랜치 (초기값: '전체')
  const [selectedBranch, setSelectedBranch] = useState<string>("전체");
  // 펼침/접힘 상태 (브랜치별)
  const [openMap, setOpenMap] = useState<{ [branch: string]: boolean }>(
    Object.fromEntries(branchNames.map(b => [b, true]))
  );

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

  const handleStage = (file: any) => {
    setChangedFiles(changedFiles.filter(f => f.name !== file.name));
    setStagedFiles([...stagedFiles, file]);
    setTab("stage");
  };
  const handleUnstage = (file: any) => {
    setStagedFiles(stagedFiles.filter(f => f.name !== file.name));
    setChangedFiles([...changedFiles, file]);
    setTab("change");
  };
  const handleCommit = () => {
    // 실제로는 커밋 API 호출
    alert(`커밋 완료!\n메시지: ${commitMsg}\n파일:\n${stagedFiles.map(f => f.name).join("\n")}`);
    setStagedFiles([]);
    setCommitMsg("");
    setShowStageTab(false);
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
        <button className="flex items-center gap-1 px-3 py-1 rounded bg-[#7a80fc] hover:bg-[#4b2ea7] text-white text-sm font-semibold">
          <ArrowDownToLine className="w-4 h-4" /> Pull
        </button>
        <button className="flex items-center gap-1 px-3 py-1 rounded bg-[#7a80fc] hover:bg-[#4b2ea7] text-white text-sm font-semibold">
          <ArrowUpToLine className="w-4 h-4" /> Push
        </button>
        <button
          className="flex items-center gap-1 px-3 py-1 rounded bg-[#7a80fc] hover:bg-[#4b2ea7] text-white text-sm font-semibold"
          onClick={() => setShowStageTab(v => !v)}
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
            onCommit={handleCommit}
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
              {branchNames.map(branch => (
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
    commits
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
    </>
  );