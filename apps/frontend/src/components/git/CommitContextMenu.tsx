import React from "react";
import { Check, Code, GitBranch, Copy, Trash2, Code2, Archive } from "lucide-react";
import type { Commit } from "./CommitHistoryPanel";

export interface CommitContextMenuProps {
  commit: Commit;
  pos: { x: number; y: number };
  onAction: (action: string, commit: Commit) => void;
  onClose: () => void;
}

const menuItems = [
  { label: "체크아웃", icon: <Check />, action: "checkout" },
  { label: "병합", icon: <GitBranch />, action: "merge" },
  { label: "리베이스", icon: <Code />, action: "rebase" },
  { label: "태그...", icon: <Code2 />, action: "tag" },
  { label: "아카이브...", icon: <Archive />, action: "archive" },
  { label: "브랜치...", icon: <GitBranch />, action: "branch" },
  { label: "SHA 값 복사", icon: <Copy />, action: "copy-sha" },
  { label: "삭제", icon: <Trash2 />, action: "delete" },
];

export const CommitContextMenu: React.FC<CommitContextMenuProps> = ({
  commit,
  pos,
  onAction,
  onClose,
}) => {
  // context menu는 포탈로 띄우거나, fixed 위치에 배치
  return (
    <div
      className="fixed z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-lg py-2 min-w-[180px]"
      style={{ left: pos.x, top: pos.y }}
      onClick={onClose}
      tabIndex={-1}
    >
      {menuItems.map((item) => (
        <button
          key={item.label}
          className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-200 hover:bg-blue-950 transition"
          onClick={(e) => {
            e.stopPropagation();
            onAction(item.action, commit);
            onClose();
          }}
        >
          <span className="w-4 h-4">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
};
