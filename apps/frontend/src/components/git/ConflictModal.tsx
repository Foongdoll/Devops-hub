import React, { useEffect, useState } from "react";
import { DiffEditor, Editor } from "@monaco-editor/react";
import type { Remote } from "../../customhook/git/useRemote";
import type { File } from "../../customhook/git/useChanges";
import { showConfirm } from "../../utils/notifyStore";
import { useRemoteContext } from "../../context/RemoteContext";
import { FileIcon, Menu as MenuIcon, X as CloseIcon, CheckSquare, CheckCircle, Circle, X, Check, } from "lucide-react";
import "react-tooltip/dist/react-tooltip.css";

interface ConflictModalProps {
    open: boolean;
    onClose: () => void;
    conflictFiles: File[];
    onSelectConflictFile: (file: File, remote: Remote, conflictBranch: string, selectedLocalBranch: string) => void;
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    branch: string;
    left: string;
    right: string;
    onCheckoutConflictFilesCommit: (remote: Remote, conflictFiles: File[], isPush: boolean, remoteBranch: string) => void;
    onCheckoutConflictFilesStash: (remote: Remote, conflictFiles: File[]) => void;
    onCheckoutConflictFilesDiscard: (remote: Remote, conflictFiles: File[], selectedLocalBranch: string) => void;
    socketResponse: boolean;
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
    onCheckoutConflictFilesCommit,
    onCheckoutConflictFilesStash,
    onCheckoutConflictFilesDiscard,
    socketResponse
}) => {

    const { selectedRemote, selectedLocalBranch, selectedRemoteBranch } = useRemoteContext();
    const [showSidebar, setShowSidebar] = useState(false);
    const [isPush, setIsPush] = useState(false);
    const [selectedConflictFiles, setSelectedConflictFiles] = useState<File[]>([]);
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
                        selectedConflictFiles={selectedConflictFiles}
                        setSelectedConflictFiles={setSelectedConflictFiles}
                        onCheckoutConflictFilesCommit={onCheckoutConflictFilesCommit}
                        onCheckoutConflictFilesStash={onCheckoutConflictFilesStash}
                        onCheckoutConflictFilesDiscard={onCheckoutConflictFilesDiscard}
                        isPush={isPush}
                        setIsPush={setIsPush}
                        selectedRemoteBranch={selectedRemoteBranch}
                        socketResponse={socketResponse}
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

                    <div className="flex-1 min-h-0 overflow-auto"> {/* <- 추가: flex-1 min-h-0 */}
                        {selectedFile && left && right ? (
                            <DiffEditor
                                key={selectedFile.path}
                                height="100%"
                                language="html"
                                loading="로딩 중..."
                                original={left}
                                modified={right}
                                theme="vs-dark"
                                keepCurrentModifiedModel={true}
                                keepCurrentOriginalModel={true}
                                options={{
                                    readOnly: false,
                                    renderWhitespace: 'all',
                                    scrollBeyondLastLine: false,
                                    minimap: { enabled: false }
                                }}
                            />
                        ) : selectedFile && left ? (
                            <Editor
                                height="100%"
                                language="html"
                                value={left}
                                theme="vs-dark"
                                options={{
                                    readOnly: true,
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
                                onCheckoutConflictFilesCommit={onCheckoutConflictFilesCommit}
                                onCheckoutConflictFilesStash={onCheckoutConflictFilesStash}
                                onCheckoutConflictFilesDiscard={onCheckoutConflictFilesDiscard}
                                isPush={isPush}
                                setIsPush={setIsPush}
                                selectedRemoteBranch={selectedRemoteBranch}
                                socketResponse={socketResponse}
                            />
                        </div>
                        <div className="flex-1" onClick={() => setShowSidebar(false)} />
                    </div>
                )}
            </div>
        </div>
    );
};

interface TitleAndFilesProps {
    conflictFiles: File[];
    selectedFile: File | null;
    onSelectConflictFile: (file: File, remote: Remote, conflictBranch: string, selectedLocalBranch: string) => void;
    selectedRemote: Remote | null;
    branch: string;
    selectedLocalBranch: string;
    setSelectedFile: (file: File | null) => void;
    onCloseSidebar?: () => void;
    selectedConflictFiles?: File[];
    setSelectedConflictFiles?: (files: File[]) => void;
    onCheckoutConflictFilesCommit: (remote: Remote, conflictFiles: File[], isPush: boolean, remoteBranch: string) => void;
    onCheckoutConflictFilesStash: (remote: Remote, conflictFiles: File[]) => void;
    onCheckoutConflictFilesDiscard: (remote: Remote, conflictFiles: File[], selectedLocalBranch: string) => void;
    isPush: boolean;
    setIsPush: (isPush: boolean) => void;
    selectedRemoteBranch: string
    socketResponse: boolean;
}

function TitleAndFiles({
    conflictFiles,
    selectedFile,
    onSelectConflictFile,
    selectedRemote,
    branch,
    selectedLocalBranch,
    setSelectedFile,
    onCloseSidebar,
    selectedConflictFiles = [],
    setSelectedConflictFiles,
    onCheckoutConflictFilesCommit,
    onCheckoutConflictFilesStash,
    onCheckoutConflictFilesDiscard,
    selectedRemoteBranch,
    isPush,
    setIsPush,
    socketResponse
}: TitleAndFilesProps) {
    // 체크/언체크
    const handleCheckboxChange = (file: File, checked: boolean) => {
        if (!setSelectedConflictFiles) return;
        if (checked) {
            setSelectedConflictFiles([...selectedConflictFiles, file]);
        } else {
            setSelectedConflictFiles(selectedConflictFiles.filter(f => f.path !== file.path));
        }
    };

    // 전체 선택 여부
    const allChecked = conflictFiles.length > 0 && conflictFiles.every(f => selectedConflictFiles.includes(f));
    const someChecked = selectedConflictFiles.length > 0 && !allChecked;

    // 전체 토글 핸들러
    const handleToggleAll = () => {
        if (!setSelectedConflictFiles) return;
        if (allChecked) {
            setSelectedConflictFiles([]);
        } else {
            setSelectedConflictFiles([...conflictFiles]);
        }
    };

    useEffect(() => {
        if (socketResponse) {
            if (setSelectedConflictFiles) {
                setSelectedConflictFiles([]);
            }
            setSelectedFile(null);
            if (onCloseSidebar) onCloseSidebar();
        }

    }, [socketResponse]);

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
                    <>
                        <ul className="space-y-2 h-[70%]">
                            <li className="flex items-center gap-2 mb-1">
                                <button
                                    className="focus:outline-none"
                                    type="button"
                                    aria-label={allChecked ? "전체 체크 해제" : "전체 체크"}
                                    onClick={handleToggleAll}
                                >
                                    {allChecked
                                        ? <CheckCircle className="text-blue-600" size={18} />
                                        : <Circle className={someChecked ? "text-blue-400" : "text-gray-300"} size={18} />}
                                </button>
                                <span className="text-gray-500 text-xs select-none">
                                    전체 체크 ({conflictFiles.length}개)
                                </span>
                            </li>
                            {conflictFiles.map((file: File, idx: number) => {
                                const checked = selectedConflictFiles.includes(file);
                                return (
                                    <li
                                        key={file.path}
                                        className={`
                                        cursor-pointer rounded flex items-center gap-2 px-2 py-1 font-mono border
                                        ${selectedFile?.path === file.path
                                                ? "bg-blue-900 text-blue-100 border-blue-400"
                                                : "bg-white text-gray-800 border-gray-200 hover:bg-purple-50"}
                                        transition
                                    `}
                                        style={{
                                            fontWeight: selectedFile?.path === file.path ? 700 : 400,
                                            maxWidth: 240,
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden'
                                        }}
                                        title={file.path}
                                        onClick={() => {
                                            onSelectConflictFile(file, selectedRemote || {} as Remote, branch, selectedLocalBranch);
                                            setSelectedFile?.(file);
                                            if (onCloseSidebar) onCloseSidebar();
                                        }}
                                    >
                                        {/* 아이콘 체크박스 */}
                                        {setSelectedConflictFiles && (
                                            <button
                                                type="button"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleCheckboxChange(file, !checked);
                                                }}
                                                aria-label={checked ? "선택 해제" : "선택"}
                                                className="focus:outline-none"
                                            >
                                                {checked
                                                    ? <CheckCircle className="text-blue-600" size={18} />
                                                    : <Circle className="text-gray-300" size={18} />}
                                            </button>
                                        )}
                                        <FileIcon size={17} className="text-indigo-400 flex-shrink-0" />
                                        <span className="truncate">{file.name}</span>
                                    </li>
                                );
                            })}
                        </ul>
                        {/* ↓↓↓ 해결 방법 버튼들 ↓↓↓ */}
                        <div className="mt-5 flex flex-col gap-2 h-[15%]">

                            <button
                                className={`w-full px-2 py-2 rounded-lg border 
                                    border-blue-500 font-semibold
                                     flex items-center justify-center gap-1 text-sm
                                     ${isPush ? 'bg-blue-600 text-white hover:bg-white-50 transition' : 'bg-white text-blue-600 hover:bg-blue-50 transition'} `}
                                onClick={() => {
                                    setIsPush(!isPush)
                                }}
                            >
                                <Check size={16} /> 커밋 후 바로 푸시
                            </button>
                            <button
                                className="w-full px-2 py-2 rounded-lg border border-blue-500 bg-white text-blue-600 font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-1 text-sm"
                                onClick={() => onCheckoutConflictFilesCommit(selectedRemote || {} as Remote, selectedConflictFiles, isPush, selectedRemoteBranch)}
                            >
                                <CheckSquare size={16} /> 커밋
                            </button>
                            <button
                                className="w-full px-2 py-2 rounded-lg border border-violet-500 bg-white text-violet-600 font-semibold hover:bg-violet-50 transition flex items-center justify-center gap-1 text-sm"
                                onClick={() => onCheckoutConflictFilesStash(selectedRemote || {} as Remote, selectedConflictFiles)}
                            >
                                <Circle size={16} /> 스태시
                            </button>
                            <button
                                className="w-full px-2 py-2 rounded-lg border border-gray-400 bg-white text-gray-500 font-semibold hover:bg-red-50 hover:text-red-500 transition flex items-center justify-center gap-1 text-sm"
                                onClick={async () => {
                                    // showConfirm & 버리기 핸들러 연결
                                }}
                            >
                                <X size={16} /> 변경사항 버리기
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-400 py-8">충돌 파일이 없습니다.</div>
                )}
            </div>
        </>
    );
}