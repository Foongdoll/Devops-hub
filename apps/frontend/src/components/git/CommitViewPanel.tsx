import React, { useEffect, useState } from "react";
import { FileText, FileDiff, Loader2, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Commit } from "../../customhook/git/useCommitHistory";
import type { Remote } from "../../customhook/git/useRemote";
import { useRemoteContext } from "../../context/RemoteContext";
import type { File } from "../../customhook/git/useChanges";
import { showToast } from "../../utils/notifyStore";
import { useGitSocket } from "../../context/GitSocketContext";

// 실제로는 props로 내려받거나 context에서 받을 수도 있음
interface CommitViewPanelProps {
  selectedCommit: Commit | null;
  commitFiles: File[];
  setCommitFiles: (files: File[]) => void;
  onCommitFileDiff: (remote: Remote | null, commit: Commit | null, file: File) => void;
}

export const CommitViewPanel: React.FC<CommitViewPanelProps> = ({
  selectedCommit,
  commitFiles,
  setCommitFiles,
  onCommitFileDiff
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [commitDiff, setCommitDiff] = useState<string>("");
  const { selectedRemote } = useRemoteContext();
  const { on, off } = useGitSocket();

  // 파일 목록 불러오기 - 예시용(여기선 실제 로딩 없음)
  useEffect(() => {
    if (!selectedRemote || !selectedCommit) {
      setCommitFiles([]);
      setSelectedFile(null);
      setCommitDiff("");
      return;
    }

    const handleDiff = (res: { ok: boolean; diff: string; error?: string }) => {
      if (res.ok && res.diff) {
        setCommitDiff(res.diff);
      } else {
        showToast(res.error || "수정 내역을 불러오지 못했습니다.", "error");
      }
    };

    on("fetch_commit_files_diff_response", handleDiff);

    setSelectedFile(null); // 커밋 바뀌면 선택 초기화
    setCommitDiff(""); // diff도 초기화

    return () => {
      off("fetch_commit_files_diff_response", handleDiff)
    }
  }, [selectedRemote, selectedCommit]);

  // 파일 클릭 시 diff 요청 및 로딩 표시
  const [loadingDiff, setLoadingDiff] = useState(false);

  // diff 라인별 하이라이트
  const renderDiff = (diff: string) => {
    let oldLineNum = 0;
    let newLineNum = 0;
    return diff.split('\n').map((line, index) => {
      if (
        line.startsWith('diff --git') ||
        line.startsWith('index') ||
        line.startsWith('--- ') ||
        line.startsWith('+++ ')
      ) {
        return null;
      }

      // 헝크 헤더
      if (line.startsWith('@@')) {
        const match = /@@ -(\d+),?\d* \+(\d+),?\d*/.exec(line);
        if (match) {
          oldLineNum = parseInt(match[1], 10);
          newLineNum = parseInt(match[2], 10);
        }
        return (
          <div
            key={`hunk-${index}`}
            className="flex items-center font-bold bg-gradient-to-r from-yellow-700/70 to-yellow-400/30 text-yellow-200 border-t border-b border-yellow-400/30 py-1 shadow-inner px-1 text-xs"
          >
            <span className="w-9" />
            <span className="w-9" />
            <span className="ml-2 tracking-wide" style={{ whiteSpace: 'pre' }}>{line}</span>
          </div>
        );
      }

      let displayOld: string | number = '';
      let displayNew: string | number = '';
      let textClass = '';
      let icon = null;
      let bgClass = '';

      if (line.startsWith('+')) {
        displayOld = '';
        displayNew = newLineNum;
        newLineNum++;
        bgClass =
          'bg-gradient-to-r from-green-100/50 to-green-100/0 border-l-4 border-green-300';
        textClass = 'text-green-700 font-semibold';
        icon = <Plus size={15} className="inline-block text-green-400 mr-1" />;
      } else if (line.startsWith('-')) {
        displayOld = oldLineNum;
        displayNew = '';
        oldLineNum++;
        bgClass =
          'bg-gradient-to-r from-red-100/50 to-red-50/0 border-l-4 border-red-300';
        textClass = 'text-red-700 font-semibold';
        icon = <Minus size={15} className="inline-block text-red-400 mr-1" />;
      } else {
        displayOld = oldLineNum;
        displayNew = newLineNum;
        oldLineNum++;
        newLineNum++;
        bgClass = 'bg-white border-l-4 border-transparent';
        textClass = 'text-gray-700';
        icon = null;
      }

      return (
        <div
          key={index}
          className={`
            flex items-center px-2 py-0.5
            transition-all text-[13px] font-mono
            ${bgClass}
          `}
          style={{
            whiteSpace: "pre"
          }}
        >
          <span className="w-9 text-xs text-right opacity-50 select-none pr-1">
            {displayOld !== '' ? displayOld : ''}
          </span>
          <span className="w-9 text-xs text-right opacity-50 select-none pr-1">
            {displayNew !== '' ? displayNew : ''}
          </span>
          <span className={`ml-2 flex items-center gap-1 ${textClass} flex-1`}>
            {icon}
            <span>{line}</span>
          </span>
        </div>
      );
    });
  };

  return (
    <section className="
      flex h-[calc(100vh-130px)] rounded-2xl shadow-lg border border-[#ececff] bg-gradient-to-b from-[#f7f5fe] to-[#ede8fa] overflow-hidden
      animate-fade-in-up
    ">
      {/* 좌측 파일 목록 */}
      <div className="
        w-64 min-w-[220px] border-r border-[#e1dbfa] bg-gradient-to-br from-[#f7f5fe] to-[#f0ecfb] p-5 flex flex-col
        overflow-y-auto
      ">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-[#7e4cff] text-lg flex items-center gap-2">
            <FileText size={20} /> 파일 목록
          </span>
        </div>
        {commitFiles.length > 0 ? (
          <ul className="flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {commitFiles.map((file) => (
                <motion.li
                  key={file.path}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.16 }}
                >
                  <button
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg
                      font-mono text-xs text-left
                      ${selectedFile && selectedFile.path === file.path
                        ? "bg-[#e9e3fe] text-[#7e4cff] font-bold ring-2 ring-[#d1c4ff]"
                        : "hover:bg-[#e2d8f8] text-[#464375]"}
                      transition-all duration-100
                    `}
                    onClick={() => {
                      setSelectedFile(file);
                      setCommitDiff(""); // 클릭 시 diff 초기화(로딩효과 주고 싶으면 여기서 setLoadingDiff)
                      onCommitFileDiff(selectedRemote, selectedCommit, file);
                    }}
                  >
                    <FileDiff size={17} className="flex-shrink-0" />
                    <span className="truncate">
                      {file.name
                        ? file.name
                        : (file.path ? file.path.split("/").pop() : "알 수 없음")}
                    </span>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="text-gray-400 text-sm py-6">이 커밋에 변경된 파일이 없습니다.</div>
        )}
      </div>

      {/* 우측 diff 뷰어 */}
      <div className="flex-1 relative bg-gradient-to-tl from-[#f3f0fc] via-[#f7f5ff] to-[#f8f7fb] p-6 overflow-auto">
        {!commitDiff && (
          <div className="h-full flex flex-col items-center justify-center text-[#bdbccf]">
            <FileDiff size={38} className="mb-3" />
            <div className="text-lg font-bold mb-1">파일을 선택해보세요</div>
            <div className="text-sm">좌측에서 커밋 파일을 클릭하면 수정내역(diff)을 볼 수 있습니다.</div>
          </div>
        )}
        {commitDiff && (
          <div className="max-w-full overflow-x-auto rounded-lg bg-white border border-[#e1dbfa] shadow-inner">
            {renderDiff(commitDiff)}
          </div>
        )}
      </div>

      {/* fade-in 애니메이션 */}
      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.35s cubic-bezier(.39,.575,.565,1) both;
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(32px);}
          100% { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </section>
  );
};

export default CommitViewPanel;
