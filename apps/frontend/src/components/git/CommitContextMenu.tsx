import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, GitBranch, Code, Code2, Copy, Trash2, FileArchive } from "lucide-react";
import type { Commit } from "../../customhook/git/useCommitHistory";
import type { Remote } from "../../customhook/git/useRemote";
import type { tabType } from "../../customhook/useGitManager";

export interface CommitContextMenuProps {
  commit: Commit;
  pos: { x: number; y: number };
  onAction: (remote: Remote | null, action: string, commit: Commit) => void;
  setTab: (tab: tabType) => void;
  remote: Remote | null;
}

const menuItems = [
  { label: "커밋파일보기", icon: <FileArchive size={17} />, action: "files" },
  { label: "체크아웃", icon: <Check size={17} />, action: "checkout" },
  { label: "병합...", icon: <GitBranch size={17} />, action: "merge" },
  { label: "리베이스...", icon: <Code size={17} />, action: "rebase" },
  { label: "태그...", icon: <Code2 size={17} />, action: "tag" },
  { label: "SHA 값 복사", icon: <Copy size={17} />, action: "copy" },
];

export const CommitContextMenu: React.FC<CommitContextMenuProps> = ({
  commit, pos, onAction, remote, setTab
}) => {
  const menuRef = useRef<HTMLDivElement>(null);


  // 화면 밖으로 안나가게 위치 보정
  const [coords, setCoords] = React.useState(pos);
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const { innerWidth, innerHeight } = window;
    const rect = menu.getBoundingClientRect();
    let x = pos.x, y = pos.y;
    if (x + rect.width > innerWidth) x = innerWidth - rect.width - 12;
    if (y + rect.height > innerHeight) y = innerHeight - rect.height - 12;
    if (x < 0) x = 4;
    if (y < 0) y = 4;
    setCoords({ x, y });
  }, [pos]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[148px] bg-[#232344] border border-[#47478e] rounded-xl shadow-2xl p-1 animate-pop"
      style={{
        left: coords.x,
        top: coords.y,
      }}
    >
      {menuItems.map((item, i) => (
        <button
          key={item.action}
          className="flex items-center gap-2 px-3 py-2 w-full hover:bg-blue-950/70 hover:text-blue-300 rounded-lg text-sm text-gray-200 transition select-none"
          onClick={() => {
            onAction(remote || null, item.action, commit);
            if (item.action === "files") {
              setTab("commitview");
            }
          }}
        >
          {item.icon}
          <span className="whitespace-nowrap">{item.label}</span>
        </button>
      ))}
    </div>,
    document.body
  );
};
