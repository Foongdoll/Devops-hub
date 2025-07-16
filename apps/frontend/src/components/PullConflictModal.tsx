import React from "react";
import { AlertTriangle } from "lucide-react";
import type { PullConflictModalProps } from "../customhook/useGitManager";

export function PullConflictModal({
  open,
  conflictFiles,
  onResolve,
  onClose,
  details,
}: PullConflictModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-3 text-gray-400 hover:text-gray-600 text-xl"
        >
          &times;
        </button>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="text-yellow-500 w-6 h-6" />
          <span className="font-bold text-lg text-[#5248a1]">
            충돌 파일 발생!
          </span>
        </div>
        <div className="mb-4 text-sm text-gray-600">
          <b>Merge/Rebase 중 충돌이 발생했습니다.</b>
          <br />
          아래 파일을 직접 수정/저장 후, <b>"충돌 해결 완료"</b>를 눌러주세요.
        </div>
        <ul className="mb-4 bg-[#f6f6fd] border border-[#e6e3fa] rounded-lg p-3 max-h-40 overflow-y-auto">
          {conflictFiles.length > 0 ? (
            conflictFiles.map((f) => (
              <li key={f} className="text-xs text-[#b52d2d] font-mono break-all py-1 px-2 rounded hover:bg-[#fbe8e8]">
                {f}
              </li>
            ))
          ) : (
            <li className="text-xs text-gray-400 italic py-2 px-2">충돌 파일 정보를 찾을 수 없습니다.</li>
          )}
        </ul>
        {details && (
          <details className="mb-2 text-xs text-gray-400">
            <summary>상세 로그</summary>
            <pre className="whitespace-pre-wrap">{details}</pre>
          </details>
        )}
        <button
          onClick={onResolve}
          className="w-full py-2 rounded bg-[#7a80fc] hover:bg-[#5248a1] text-white font-semibold mt-2 text-sm"
        >
          충돌 해결 완료
        </button>
      </div>
    </div>
  );
}
