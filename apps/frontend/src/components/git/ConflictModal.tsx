import React, { useEffect, useState } from "react";
import { DiffEditor } from "@monaco-editor/react";
import type { Remote } from "../../customhook/git/useRemote";
import type { File } from "../../customhook/git/useChanges";
import { useRemoteContext } from "../../context/RemoteContext";
import { FileIcon, Menu as MenuIcon, X as CloseIcon, CornerDownLeft, Layers, Trash2 } from "lucide-react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

interface ConflictModalProps {
    open: boolean;
    onClose: () => void;
    conflictFiles: string[];
    onSelectConflictFile: (file: File, remote: Remote, conflictBranch: string, selectedLocalBranch: string) => void;
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    branch: string;
    left: string;
    right: string;
    onGoToCommit: (tab: string) => void;
    onGoToStash: (tab: string) => void;    
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
    open,
    onClose,
    conflictFiles,
    onSelectConflictFile,
    selectedFile,
    setSelectedFile,
    branch,
    left,
    right,
    onGoToCommit,
    onGoToStash,    
}) => {

    const { selectedRemote, selectedLocalBranch } = useRemoteContext();
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        setSelectedFile(null);
        setShowSidebar(false);
    }, [open]);

    if (!open) return null;

    const sidebarWidth = 270;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div
                className="bg-white rounded-2xl shadow-xl p-0 flex w-[95vw] h-[87vh] max-w-[1800px] max-h-[900px] aspect-[16/9] relative"
                style={{ minHeight: 520 }}
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-black z-40"
                    aria-label="Close"
                    tabIndex={0}
                >
                    <CloseIcon size={26} />
                </button>

                {/* 햄버거 메뉴 (좁은화면에만 노출) */}
                <button
                    className="absolute top-4 left-4 text-gray-500 hover:text-indigo-700 z-40 lg:hidden"
                    onClick={() => setShowSidebar(true)}
                    aria-label="Open sidebar"
                    tabIndex={0}
                >
                    <MenuIcon size={26} />
                </button>

                {/* 왼쪽: 파일리스트 (PC에서만 노출) */}
                <div
                    className={`flex-col mr-2 h-full p-5 pt-7 bg-white border-r border-gray-100
                    hidden lg:flex`}
                    style={{ width: sidebarWidth, minWidth: 180, maxWidth: 360 }}
                >
                    <TitleAndFiles
                        conflictFiles={conflictFiles}
                        selectedFile={selectedFile}
                        onSelectConflictFile={onSelectConflictFile}
                        selectedRemote={selectedRemote}
                        branch={branch}
                        selectedLocalBranch={selectedLocalBranch}
                        setSelectedFile={setSelectedFile}
                    />
                </div>

                {/* 오른쪽: diff뷰 (모든화면에서) */}
                <div className="flex-1 h-full bg-gray-50 rounded-r-2xl flex flex-col px-2 py-2 overflow-auto">
                    <div className="font-bold text-gray-600 mb-2 text-sm truncate pl-1">
                        {selectedFile ? selectedFile.path : "파일을 선택하면 변경사항을 미리볼 수 있습니다."}
                    </div>
                    {/* 브랜치명 라벨 */}
                    <div className="flex items-center justify-between mb-2 px-2">
                        <div className="flex-1 text-xs font-semibold text-left">
                            <span className="text-indigo-500">{selectedLocalBranch}</span>
                            <span className="ml-2 text-gray-400">(현재 브랜치)</span>
                        </div>
                        <div className="flex-1 text-xs font-semibold text-right">
                            <span className="text-cyan-500">{branch}</span>
                            <span className="ml-2 text-gray-400">(변경할 브랜치)</span>
                        </div>
                    </div>

                    {/* 가이드바 */}
                    <div className="w-full mb-1 px-3">
                        <div className="rounded bg-blue-50 text-blue-900 text-xs p-2 mb-2 flex items-center gap-2 shadow-sm">
                            <span className="font-bold">💡 충돌 해결 TIP:</span>
                            <span>
                                <span className="text-blue-700 font-semibold">1) 커밋</span> 또는
                                <span className="text-violet-700 font-semibold ml-1">2) 스태시</span> 후 브랜치를 전환하거나,
                                <span className="text-red-700 font-semibold ml-1">3) 변경사항 버리기</span>로 즉시 해결할 수 있습니다.
                                각 버튼에 <b>마우스를 올리면 설명</b>을 볼 수 있습니다.
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0">
                        {selectedFile && left && right ? (
                            <DiffEditor
                                height="100%"
                                language="html"
                                loading="로딩 중..."
                                original={left}
                                modified={right}
                                theme="vs-dark"
                                options={{
                                    readOnly: false,
                                    renderWhitespace: 'all',
                                    scrollBeyondLastLine: false,
                                    minimap: { enabled: false }
                                }}
                            />
                        ) : (
                            <div className="text-gray-400 text-sm text-center py-8">
                                {selectedFile ? "변경 내역이 없습니다." : "왼쪽에서 파일을 선택하세요."}
                            </div>
                        )}

                        {/* 모달 하단(버튼 영역, 세련된 + 툴팁) */}
                        <div className="w-full flex flex-row gap-3 justify-end items-center mt-8 pr-4">
                            <button
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
                                onClick={() => onGoToCommit('commit')}
                                data-tooltip-id="commit-tip"
                                data-tooltip-content="수정된 내용을 커밋(저장)할 수 있는 탭으로 이동합니다."
                            >
                                <CornerDownLeft size={18} /> 커밋 탭 이동
                            </button>
                            <button
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow transition"
                                onClick={() => onGoToStash('stash')}
                                data-tooltip-id="stash-tip"
                                data-tooltip-content="수정 내역을 임시 저장(스태시)할 수 있는 탭으로 이동합니다."
                            >
                                <Layers size={18} /> 스태시 탭 이동
                            </button>
                            <button
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-red-500 text-gray-900 hover:text-white font-semibold shadow transition"
                                onClick={() => {
                                    if (window.confirm("정말 변경사항을 모두 버리시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                                        onGoToCommit('changes');
                                    }
                                }}
                                data-tooltip-id="discard-tip"
                                data-tooltip-content="현재 작업 내역을 완전히 삭제합니다 (주의!)"
                            >
                                <Trash2 size={18} /> 변경사항 버리기
                            </button>
                            {/* 툴팁은 한 번만 렌더링해도 OK */}
                            <Tooltip id="commit-tip" place="top" />
                            <Tooltip id="stash-tip" place="top" />
                            <Tooltip id="discard-tip" place="top" />
                        </div>
                    </div>
                </div>

                {/* 모바일/태블릿용 파일리스트 슬라이드 (오버레이) */}
                {showSidebar && (
                    <div className="fixed inset-0 bg-black/30 z-50 flex">
                        <div
                            className="bg-white h-full w-[85vw] max-w-[340px] shadow-2xl rounded-r-2xl p-5"
                            style={{ minWidth: 180 }}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-lg text-red-500 flex items-center">
                                    <FileIcon className="mr-2 text-indigo-500" /> 충돌 파일
                                </span>
                                <button
                                    onClick={() => setShowSidebar(false)}
                                    className="text-xl text-gray-400 hover:text-black"
                                    tabIndex={0}
                                >
                                    <CloseIcon size={24} />
                                </button>
                            </div>
                            <TitleAndFiles
                                conflictFiles={conflictFiles}
                                selectedFile={selectedFile}
                                onSelectConflictFile={onSelectConflictFile}
                                selectedRemote={selectedRemote}
                                branch={branch}
                                selectedLocalBranch={selectedLocalBranch}
                                setSelectedFile={setSelectedFile}
                                onCloseSidebar={() => setShowSidebar(false)}
                            />
                        </div>
                        <div className="flex-1" onClick={() => setShowSidebar(false)} />
                    </div>
                )}
            </div>
        </div>
    );
};

// 파일리스트/타이틀 따로 분리 (재사용)
function TitleAndFiles({
    conflictFiles,
    selectedFile,
    onSelectConflictFile,
    selectedRemote,
    branch,
    selectedLocalBranch,
    setSelectedFile,
    onCloseSidebar,
}: any) {
    return (
        <>
            <div className="mb-3">
                <h2 className="text-x font-bold text-red-600 flex items-center">
                    <span className="mr-2">⚠️</span> 브랜치 변경 충돌 발생
                </h2>
                <div className="mt-1 text-gray-800 text-sm font-semibold">
                    아래 파일에서 충돌이 발생했습니다.<br />수정 후 다시 브랜치를 변경해주세요.
                </div>
            </div>
            <div className="flex-1 overflow-auto border rounded bg-gray-100 p-3">
                {conflictFiles.length > 0 ? (
                    <ul className="space-y-2">
                        {conflictFiles.map((filePath: string, idx: number) => (
                            <li
                                key={filePath}
                                className={`
                                    cursor-pointer rounded flex items-center gap-2 px-2 py-1 font-mono border
                                    ${selectedFile?.path === filePath
                                        ? "bg-blue-900 text-blue-100 border-blue-400"
                                        : "bg-white text-gray-800 border-gray-200 hover:bg-purple-50"}
                                    transition
                                `}
                                style={{
                                    fontWeight: selectedFile?.path === filePath ? 700 : 400,
                                    maxWidth: 240,
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden'
                                }}
                                title={filePath}
                                onClick={() => {
                                    const fakeFile: File = {
                                        status: "",
                                        path: filePath,
                                        name: filePath.split('/').pop() || filePath,
                                        staged: false,
                                    };
                                    onSelectConflictFile(fakeFile, selectedRemote || {} as Remote, branch, selectedLocalBranch);
                                    setSelectedFile?.(fakeFile);
                                    if (onCloseSidebar) onCloseSidebar();
                                }}
                            >
                                <FileIcon size={17} className="text-indigo-400 flex-shrink-0" />
                                <span className="truncate">{idx + 1}. {filePath}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-gray-400 py-8">충돌 파일이 없습니다.</div>
                )}
            </div>
        </>
    );
}
