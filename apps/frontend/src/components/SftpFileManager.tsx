import React, { useState, useEffect } from "react";
import { Folder, File, ChevronRight, ChevronDown, RefreshCcw, ArrowLeft, Link2, EyeOff, Terminal, Cog } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { useSftp } from "../customhook/useSftp";

export type SftpState = ReturnType<typeof useSftp>;

type Entry = { name: string; type: "-" | "d" | "l", longname?: string };
type ListData = { remotePath: string; list: Entry[] };
type FileDialog = { file: Entry; path: string } | null;

export function SftpFileManager({ sftp }: { sftp?: SftpState }) {
  const { socket, emit } = useSocket();

  if (!sftp) return null;
  const {
    mode, setMode, tree, setTree, cwd, setCwd,
    openDirs, setOpenDirs, fileDialog, setFileDialog,
    dragging, setDragging, dropTarget, setDropTarget,
    search, setSearch, selected, setSelected,
    showToast, setLoading, handleRefresh,
    toggleSelect, handleDownloadSelected
  } = sftp;

  useEffect(() => {
    if (!socket) return;
    const onPwd = (path: string) => {
      const dir = path.trim() || "/";
      setCwd(dir);
      emit("sftp-list", { remotePath: dir });
      emit("sftp-list", { remotePath: "/" });
    };
    socket.on("sftp-pwd", onPwd);
    return () => { socket.off("sftp-pwd", onPwd); };
  }, [socket, emit]);

  useEffect(() => {
    if (!socket) return;
    const onData = ({ remotePath, list }: ListData) => {
      setTree(prev => ({ ...prev, [remotePath]: list }));
    };
    socket.on("sftp-list-data", onData);
    return () => { socket.off("sftp-list-data", onData); };
  }, [socket]);

  const goTo = (dir: string) => {
    setCwd(dir);
    emit("sftp-list", { remotePath: dir });
  };

  const toggleDir = (path: string) => {
    setOpenDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else {
        next.add(path);
        if (!tree[path]) emit("sftp-list", { remotePath: path });
      }
      return next;
    });
  };

  const onEntryDoubleClick = (entry: Entry) => {
    if (entry.type === "d") {
      const nextDir = cwd === "/" ? `/${entry.name}` : `${cwd}/${entry.name}`;
      setSearch("");
      goTo(nextDir);
    } else {
      setFileDialog({ file: entry, path: cwd });
    }
  };

  const handleOpenFile = (editor: "vi" | "vim") => {
    if (!fileDialog) return;
    const filePath =
      fileDialog.path === "/"
        ? `/${fileDialog.file.name}`
        : `${fileDialog.path}/${fileDialog.file.name}`;
    emit("explorer-open-file", { filePath, editor });
    setFileDialog(null);
  };

  const renderExplorer = () => {
    const filtered = search.trim()
      ? (tree[cwd] || []).filter(e => e.name.toLowerCase().includes(search.trim().toLowerCase()))
      : (tree[cwd] || []);
    return (
      <ul
        className="px-2 py-1"
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={e => {
          e.preventDefault(); e.stopPropagation();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setLoading(true)
            const files = Array.from(e.dataTransfer.files);
            for (let file of files) {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = (reader.result as string).split(",")[1];
                emit("sftp-upload", {
                  remotePath: cwd,
                  fileName: file.name,
                  data: base64,
                });
              };
              reader.readAsDataURL(file);
            }
            handleRefresh();
            setLoading(false);
            showToast(`${e.dataTransfer.files.length} 개 파일 전송 완료`, "success");
          }
        }}
      >
        {cwd !== "/" && (
          <li
            className={`
              flex items-center cursor-pointer rounded-lg px-2 py-1 mb-1
              font-semibold text-[#7068c4] hover:text-[#5746af]
              bg-white/80 hover:bg-[#ede9fe]
              border border-transparent hover:border-[#7a80fc] transition
              ${dropTarget === "상위 폴더" ? "bg-[#ede9fe] border-[#7a80fc] shadow" : ""}
            `}
            onDoubleClick={() => goTo(cwd.replace(/\/[^/]+$/, "") || "/")}
            onDragOver={e => { e.preventDefault(); setDropTarget('상위 폴더'); }}
            onDragLeave={() => setDropTarget(null)}
            onDrop={e => {
              e.stopPropagation();
              e.preventDefault();
              setDropTarget(null);
              setLoading(true);
              const data = e.dataTransfer.getData("application/sftp-file");
              if (!data) return;
              const { name, srcDir } = JSON.parse(data);
              const parent = cwd.replace(/\/[^/]+$/, "") || "/";
              if (srcDir === parent) return;
              emit("sftp-move", {
                src: srcDir === "/" ? `/${name}` : `${srcDir}/${name}`,
                dest: parent === "/" ? `/${name}` : `${parent}/${name}`,
              });
              handleRefresh();
              setLoading(false);
              showToast(`"${name}" 이동 완료!`, "success");
            }}
          >
            <ArrowLeft size={15} className="mr-2 min-w-[18px]" />
            <span className="font-medium select-none">상위 폴더</span>
          </li>
        )}
        {filtered.length === 0 && (
          <li className="text-xs text-[#aaaaca] px-2 py-1 select-none">결과 없음</li>
        )}
        {filtered.map(entry => {
          const fullPath = cwd === "/" ? `/${entry.name}` : `${cwd}/${entry.name}`;
          const isSelected = selected.includes(fullPath);
          const isDir = entry.type === "d";

          let icon = <File size={16} className="text-[#b3b6d9]" />;
          let textClass = "text-[#423e6d]";
          let subLabel = null;

          if (isDir) {
            icon = <Folder size={17} className="text-[#887bff]" />;
            textClass = entry.name.startsWith(".") ? "opacity-50 italic" : "font-semibold";
          } else if (entry.type === "l") {
            icon = <Link2 size={16} className="text-[#eab12f]" />;
            textClass = "text-[#eab12f]";
            subLabel = <span className="ml-2 text-[#ffe87b] text-xs font-mono">(링크)</span>;
          } else if (/\.(conf|ini|env|json|yaml|yml)$/i.test(entry.name)) {
            icon = <Cog size={16} className="text-[#52b8e5]" />;
            textClass = "text-[#3682a6]";
            subLabel = <span className="ml-2 text-[#52b8e5] text-xs font-mono">(설정)</span>;
          } else if (entry.longname?.substring(3, 6).includes("x")) {
            icon = <Terminal size={16} className="text-[#49e7b7]" />;
            textClass = "text-[#31b286]";
            subLabel = <span className="ml-2 text-[#79e5bd] text-xs font-mono">(실행)</span>;
          } else if (entry.name.startsWith(".")) {
            icon = <EyeOff size={16} className="text-[#cac9de]" />;
            textClass = "opacity-60 italic";
            subLabel = <span className="ml-2 text-[#d5d4ef] text-xs font-mono">(숨김)</span>;
          }

          return (
            <li
              key={entry.name}
              className={`
                flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1 transition-all
                border border-transparent
                ${isSelected
                  ? "bg-gradient-to-r from-[#7a80fc]/90 to-[#bba7ee]/90 text-white font-bold border-[#7a80fc] shadow"
                  : isDir
                    ? "hover:bg-[#ede9fe] hover:text-[#6f52e4] hover:border-[#7a80fc] text-[#423e6d]"
                    : "hover:bg-[#f7f6fa] hover:text-[#7068c4] hover:border-[#c3b4fa] text-[#6b6b87]"}
                ${dragging === entry.name ? "ring-2 ring-[#ffbe6f] bg-[#e8e5fd] scale-105" : ""}
                ${dropTarget === entry.name ? "bg-[#ede9fe] border-[#7a80fc]" : ""}
                ${textClass}
              `}
              onClick={e => toggleSelect(e, fullPath)}
              onDoubleClick={() => onEntryDoubleClick(entry)}
              draggable={entry.type !== "d"}
              onDragStart={e => {
                if (entry.type !== "d") {
                  setDragging(entry.name);
                  e.dataTransfer.setData(
                    "application/sftp-file",
                    JSON.stringify({ name: entry.name, srcDir: cwd })
                  );
                }
              }}
              onDragEnd={() => setDragging(null)}
              onDragOver={entry.type === "d" ? (e => {
                e.preventDefault();
                setDropTarget(entry.name);
              }) : undefined}
              onDragLeave={entry.type === "d" ? (() => setDropTarget(null)) : undefined}
              onDrop={entry.type === "d" ? (e => {
                setDropTarget(null);
                setDragging(null);
                setLoading(true);
                const data = e.dataTransfer.getData("application/sftp-file");
                if (data) {
                  const { name, srcDir } = JSON.parse(data);
                  if (srcDir !== (cwd === "/" ? `/${entry.name}` : `${cwd}/${entry.name}`)) {
                    emit("sftp-move", {
                      src: srcDir === "/" ? `/${name}` : `${srcDir}/${name}`,
                      dest:
                        cwd === "/"
                          ? `/${entry.name}/${name}`
                          : `${cwd}/${entry.name}/${name}`,
                    });
                    showToast(`"${name}" 이동 완료!`, "success");
                    handleRefresh();
                    setLoading(false);
                  }
                }
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const files = Array.from(e.dataTransfer.files);
                  for (let file of files) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const base64 = (reader.result as string).split(",")[1];
                      emit("sftp-upload", {
                        remotePath: `${cwd}/${entry.name}`,
                        fileName: file.name,
                        data: base64,
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                  showToast(`${e.dataTransfer.files.length} 개 파일 전송 완료`, "success");
                  handleRefresh();
                  setLoading(false);
                }
              }) : undefined}
            >
              {icon}
              <span className="truncate">
                {entry.name}
                {subLabel}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderTree = (path: string, depth = 0) => {
    const list = tree[path] || [];
    return (
      <ul className="pl-0 m-0 list-none">
        {list.map((entry) => {
          const fullPath = path === "/" ? `/${entry.name}` : `${path}/${entry.name}`;
          const isOpen = openDirs.has(fullPath);
          const isDir = entry.type === "d";
          const isSelected = selected.includes(fullPath);

          let icon = <File size={14} className="mr-2 text-[#b3b6d9]" />;
          let textClass = "text-[#423e6d]";
          let subLabel = null;

          if (isDir) {
            icon = <Folder size={14} className="mr-2 text-[#887bff]" />;
            textClass = entry.name.startsWith(".") ? "opacity-50 italic" : "font-semibold";
          } else if (entry.type === "l") {
            icon = <Link2 size={14} className="mr-2 text-[#eab12f]" />;
            textClass = "text-[#eab12f]";
            subLabel = <span className="ml-2 text-xs text-[#ffe87b]">(링크)</span>;
          } else if (/\.(conf|ini|env|json|yaml|yml)$/i.test(entry.name)) {
            icon = <Cog size={14} className="mr-2 text-[#52b8e5]" />;
            textClass = "text-[#3682a6]";
            subLabel = <span className="ml-2 text-xs text-[#52b8e5]">(설정)</span>;
          } else if (entry.longname?.substring(3, 6).includes("x")) {
            icon = <Terminal size={14} className="mr-2 text-[#49e7b7]" />;
            textClass = "text-[#31b286]";
            subLabel = <span className="ml-2 text-xs text-[#79e5bd]">(실행)</span>;
          } else if (entry.name.startsWith(".")) {
            icon = <EyeOff size={14} className="mr-2 text-[#cac9de]" />;
            textClass = "opacity-60 italic";
            subLabel = <span className="ml-2 text-xs text-[#d5d4ef]">(숨김)</span>;
          }

          if (isDir) {
            return (
              <li key={fullPath}>
                <div
                  className={`
                    flex items-center rounded-lg font-medium cursor-pointer transition-all
                    border-l-4 border-transparent
                    ${isOpen ? "bg-[#e8e5fd] border-l-4 border-[#7a80fc] shadow-inner" : ""}
                    ${isSelected ? "bg-gradient-to-r from-[#7a80fc]/90 to-[#bba7ee]/90 text-white font-bold border-l-4 border-[#7a80fc] shadow" : ""}
                    hover:bg-[#ede9fe] hover:text-[#6f52e4] text-[#423e6d]
                  `}
                  style={{
                    paddingLeft: `${14 + depth * 16}px`,
                  }}
                  onClick={() => {
                    toggleDir(fullPath);
                    if (!tree[fullPath]) emit("sftp-list", { remotePath: fullPath });
                  }}
                  onDoubleClick={() => goTo(fullPath)}
                >
                  {isOpen ? (
                    <ChevronDown size={13} color="#b4b6d3" />
                  ) : (
                    <ChevronRight size={13} color="#b4b6d3" />
                  )}
                  {icon}
                  <span className="truncate">{entry.name}</span>
                  {subLabel}
                </div>
                {isOpen && renderTree(fullPath, depth + 1)}
              </li>
            );
          } else {
            return (
              <li
                key={fullPath}
                onClick={e => toggleSelect(e, fullPath)}
                className={`
                  flex items-center rounded-lg cursor-pointer text-[15px] font-normal transition-all
                  hover:bg-[#f7f6fa] hover:text-[#7068c4] text-[#6b6b87]
                  ${isSelected ? "bg-gradient-to-r from-[#7a80fc]/90 to-[#bba7ee]/90 text-white font-bold border-l-4 border-[#7a80fc] shadow" : ""}
                  ${textClass}
                `}
                style={{ paddingLeft: `${36 + depth * 16}px` }}
                onDoubleClick={() => onEntryDoubleClick(entry)}
              >
                {icon}
                <span className="truncate">{entry.name}</span>
                {subLabel}
              </li>
            );
          }
        })}
      </ul>
    );
  };

  return (
    <div
      className="
        bg-white/70 shadow-xl rounded-2xl min-h-0 h-full flex flex-col
        border border-[#e4e1f6] backdrop-bl-[2.5px] 
        text-[#28294b]
        w-full
      "
      onClick={e => toggleSelect(e, "none")}
    >
      <div className="flex items-center h-10 border-b border-[#ebe5f9] bg-gradient-to-r from-[#ede9fe] to-[#f3e8ff] px-2 gap-1 rounded-t-2xl min-w-0">
        <span
          className={`px-3 h-10 flex items-center font-semibold text-[15px] cursor-pointer border-b-2 border-transparent select-none
            ${mode === "explorer" ? "text-[#7e4cff] border-[#7a80fc] bg-white/80 rounded-t-2xl" : "text-[#888eaf]"}
          `}
          onClick={() => setMode("explorer")}
        >
          탐색기
        </span>
        <span
          className={`px-3 h-10 flex items-center font-semibold text-[15px] cursor-pointer border-b-2 border-transparent select-none
            ${mode === "tree" ? "text-[#7e4cff] border-[#7a80fc] bg-white/80 rounded-t-2xl" : "text-[#888eaf]"}
          `}
          onClick={() => setMode("tree")}
        >
          트리
        </span>
        <span
          className="ml-auto px-2 h-10 flex items-center font-medium text-[15px] text-[#a6abdd] cursor-pointer select-none hover:text-[#7e4cff] transition"
          onClick={handleRefresh}
        >
          <RefreshCcw size={15} className="mb-[-2px] mr-[2px]" />
          새로고침
        </span>
      </div>
      {mode === "explorer" && (
        <div className="flex flex-col px-4 py-2 bg-white/60 border-b border-[#ebe5f9] gap-2">
          <span className="pr-3 text-[14px] font-normal text-[#8e8ed9] truncate">
            현재 폴더: <span className="font-semibold text-[#7e4cff]">{cwd}</span>
          </span>
          <button
            className="w-full px-3 py-1 rounded-lg bg-gradient-to-r from-[#7a80fc] to-[#6e70f2] text-white font-semibold shadow-sm hover:from-[#b8a6ff] hover:to-[#6e70f2] transition"
            onClick={handleDownloadSelected}
          >
            다운로드
          </button>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto py-1 px-1">
        {mode === "explorer" && (
          <input
            type="text"
            value={search}
            id="sftp-search"
            onChange={e => setSearch(e.target.value)}
            placeholder="이 폴더에서 검색"
            className="ml-3 w-40 bg-white border border-[#d5d2ea] rounded px-3 py-1 text-[14px] text-[#7a80fc] focus:outline-none focus:ring focus:ring-[#888ebd]/30 transition"
            style={{ minWidth: 90 }}
          />
        )}
        {mode === "tree" ? renderTree("/") : renderExplorer()}
      </div>
      {fileDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-xl shadow-xl px-8 py-6 flex flex-col items-center gap-3 min-w-[270px] border border-[#ecebff]">
            <div className="text-lg font-bold mb-2 text-[#7e4cff]">
              파일 열기 옵션
            </div>
            <div className="text-[15px] text-[#6666a8] mb-3">
              <span className="font-semibold text-[#7e4cff]">{fileDialog?.file.name}</span>
              <span> 을(를) 어떻게 열까요?</span>
            </div>
            <div className="flex gap-4">
              <button
                className="px-5 py-1 rounded-lg bg-[#ecebff] text-[#7e4cff] font-medium hover:bg-[#bba7ee] transition"
                onClick={() => handleOpenFile("vi")}
              >
                vi로 열기
              </button>
              <button
                className="px-5 py-1 rounded-lg bg-[#7a80fc] text-white font-medium hover:bg-[#6e70f2] transition"
                onClick={() => handleOpenFile("vim")}
              >
                vim으로 열기
              </button>
            </div>
            <button
              className="mt-4 px-4 py-1 rounded text-[#7a80fc] border border-[#ecebff] hover:bg-[#ecebff] transition"
              onClick={() => setFileDialog(null)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
