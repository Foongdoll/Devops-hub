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

  

  // 최초 연결 시 pwd+루트 트리 요청
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

  // 폴더 리스트 수신
  useEffect(() => {
    if (!socket) return;
    const onData = ({ remotePath, list }: ListData) => {
      setTree(prev => ({ ...prev, [remotePath]: list }));
    };
    socket.on("sftp-list-data", onData);
    return () => { socket.off("sftp-list-data", onData); };
  }, [socket]);

  // 탐색기 폴더 이동
  const goTo = (dir: string) => {
    setCwd(dir);
    emit("sftp-list", { remotePath: dir });
  };

  // 트리 폴더 펼침
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

  // **폴더/파일 더블클릭**
  const onEntryDoubleClick = (entry: Entry) => {
    if (entry.type === "d") {

      const nextDir = cwd === "/" ? `/${entry.name}` : `${cwd}/${entry.name}`;
      setSearch(""); // 검색 초기화
      goTo(nextDir);
    } else {
      // 파일: vi/vim 다이얼로그
      setFileDialog({ file: entry, path: cwd });
    }
  };

  // **파일 열기: vi/vim 선택 후 터미널 명령 전송**
  const handleOpenFile = (editor: "vi" | "vim") => {
    if (!fileDialog) return;
    const filePath =
      fileDialog.path === "/"
        ? `/${fileDialog.file.name}`
        : `${fileDialog.path}/${fileDialog.file.name}`;
    emit("explorer-open-file", { filePath, editor });
    setFileDialog(null);
  };

  // **A안: 탐색기**
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
          // 로컬 업로드만 허용
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
            className={`flex items-center text-[#94a7e1] cursor-pointer rounded px-2 py-1 mb-1 transition
      hover:bg-[#262753]
      ${dropTarget === "상위 폴더" ? "bg-[#483c77]/70 ring-2 ring-[#7a80fc]" : ""}`}
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
        {
          filtered.length === 0 && (
            <li className="text-xs text-[#a0a0bc] px-2 py-1 select-none">결과 없음</li>
          )
        }
        {
          filtered.map(entry => {
            // =========== 상태 분석 ===========
            const fullPath = cwd === "/" ? `/${entry.name}` : `${cwd}/${entry.name}`;
            const isHidden = entry.name.startsWith(".");
            const isConfig = /\.(conf|ini|env|json|yaml|yml)$/i.test(entry.name);
            const isExecutable = entry.longname?.substring(3, 6).includes("x");
            let icon = null, textClass = "", subLabel = null;

            if (entry.type === "d") {
              icon = <Folder size={17} className="text-[#6b83ee] min-w-[20px]" />;
              textClass = isHidden ? "opacity-60 italic" : "";
            } else if (entry.type === "l") {
              icon = <Link2 size={16} className="text-[#f0d36b] min-w-[20px]" />;
              textClass = "text-[#f0d36b]";
              subLabel = <span className="ml-2 text-[#ffe87b] text-xs font-mono">(링크)</span>;
            } else if (isConfig) {
              icon = <Cog size={16} className="text-[#6bc0ee] min-w-[20px]" />;
              textClass = "text-[#6bc0ee]";
              subLabel = <span className="ml-2 text-[#6bc0ee] text-xs font-mono">(설정)</span>;
            } else if (isExecutable) {
              icon = <Terminal size={16} className="text-[#7ae67a] min-w-[20px]" />;
              textClass = "text-[#7ae67a]";
              subLabel = <span className="ml-2 text-[#8af79f] text-xs font-mono">(실행)</span>;
            } else if (isHidden) {
              icon = <EyeOff size={16} className="text-[#b8b8c8] min-w-[20px]" />;
              textClass = "opacity-60 italic";
              subLabel = <span className="ml-2 text-[#bbbfd8] text-xs font-mono">(숨김)</span>;
            } else {
              icon = <File size={16} className="text-[#c1b9d8] min-w-[20px]" />;
            }

            return (
              <li
                key={entry.name}
                className={`
                  flex items-center gap-2 cursor-pointer rounded px-2 py-1 transition
                  ${selected.includes(fullPath) ? "bg-[#7a80fc]/80 text-white font-semibold" : ""}
                  ${entry.type === "d" ? "hover:bg-[#212a48] text-[#f1f2ff]" : "hover:bg-[#191a3c] text-[#8da7cf]"}
                  ${dragging === entry.name ? "ring-2 ring-[#ffbe6f] bg-[#3c3462] scale-105" : ""}
                  ${dropTarget === entry.name ? "bg-[#2835a7]/40 ring-2 ring-[#7a80fc]" : ""}
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
                  // 로컬 업로드
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
          })
        }
      </ul>
    )
  };

  const renderTree = (path: string, depth = 0) => {
    const list = tree[path] || [];
    return (
      <ul className="pl-0 m-0 list-none">
        {list.map((entry) => {
          const fullPath = path === "/" ? `/${entry.name}` : `${path}/${entry.name}`;
          // ========== ① entry별 속성 계산 ==========
          const isHidden = entry.name.startsWith(".");
          const isConfig = /\.(conf|ini|env|json|yaml|yml)$/i.test(entry.name);
          const isExecutable = entry.longname?.substring(3, 6).includes("x");
          let icon = null, textClass = "", subLabel = null;

          if (entry.type === "d") {
            // 디렉터리
            icon = <Folder size={14} color="#7b85b1" className="mr-2" />;
            textClass = isHidden ? "opacity-60 italic" : "";
          } else if (entry.type === "l") {
            // 링크
            icon = <Link2 size={14} className="mr-2 text-[#f8d568]" />;
            textClass = "text-[#f8d568]";
            subLabel = <span className="ml-2 text-xs text-[#ffe87b]">(링크)</span>;
          } else if (isConfig) {
            // 설정파일
            icon = <Cog size={14} className="mr-2 text-[#6bc0ee]" />;
            textClass = "text-[#6bc0ee]";
            subLabel = <span className="ml-2 text-xs text-[#6bc0ee]">(설정)</span>;
          } else if (isExecutable) {
            // 실행파일
            icon = <Terminal size={14} className="mr-2 text-[#7ae67a]" />;
            textClass = "text-[#7ae67a]";
            subLabel = <span className="ml-2 text-xs text-[#8af79f]">(실행)</span>;
          } else if (isHidden) {
            // 숨김파일
            icon = <EyeOff size={14} className="mr-2 text-[#b8b8c8]" />;
            textClass = "opacity-60 italic";
            subLabel = <span className="ml-2 text-xs text-[#bbbfd8]">(숨김)</span>;
          } else {
            // 일반파일
            icon = <File size={14} className="mr-2 text-[#c1b9d8]" />;
          }

          // ========== ② 렌더링 ==========
          if (entry.type === "d") {
            const isOpen = openDirs.has(fullPath);
            return (
              <li key={fullPath}>
                <div
                  className={`flex items-center rounded-sm font-medium transition-colors cursor-pointer ${textClass}
                  ${isOpen ? "bg-[#232347] text-[#c3c7e6]" : ""}
                  hover:bg-[#28294b] hover:text-[#dadcfb]`}
                  style={{
                    paddingLeft: `${14 + depth * 14}px`,
                    borderLeft: isOpen ? "2px solid #635bff" : "2px solid transparent",
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
                className={`flex items-center rounded-sm cursor-pointer text-[15px] font-normal ${textClass}
                hover:bg-[#25274a] hover:text-[#e6e8fe]`}
                style={{ paddingLeft: `${35 + depth * 14}px` }}
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
    <div className="bg-[#22223c] rounded-lg min-h-[100%] shadow-none border-none text-white flex flex-col" onClick={e => toggleSelect(e, "none")}>
      {/* 탭 헤더 */}
      <div className="flex items-center h-9 border-b border-[#393c58] bg-[#22223c] px-2 gap-1 whitespace-nowrap min-w-0">
        <span
          className={`px-3 h-9 flex items-center font-medium text-[15px] cursor-pointer border-b-2 border-transparent select-none
          ${mode === "explorer" ? "text-[#ecebff] border-[#7a80fc]" : "text-[#aab1e2]"}
        `}
          onClick={() => setMode("explorer")}
        >
          탐색기
        </span>
        <span
          className={`px-3 h-9 flex items-center font-medium text-[15px] cursor-pointer border-b-2 border-transparent select-none
          ${mode === "tree" ? "text-[#ecebff] border-[#7a80fc]" : "text-[#aab1e2]"}
        `}
          onClick={() => setMode("tree")}
        >
          트리
        </span>
        <span
          className="px-2 h-9 flex items-center font-medium text-[15px] text-[#a6abdd] cursor-pointer select-none"
          onClick={handleRefresh}
        >
          <RefreshCcw size={13} className="mb-[-2px] mr-[2px]" />
          새로고침
        </span>


      </div>
      {mode === "explorer" && (
      <div className="flex flex-col items-center justify-between px-4 py-2 bg-[#22223c] border-b border-[#393c58] gap-2">
        <span className="pr-3 text-[14px] font-normal text-[#888eaf] truncate">
          현재 폴더 경로: {cwd}
        </span>
        <span
          className="w-full ml-2 px-3 py-1 rounded bg-[#7a80fc] text-white cursor-pointer text-[14px] font-semibold hover:bg-[#5560be]"
          onClick={handleDownloadSelected}
        >
          다운로드
        </span>
      </div>
      )}
      {/* 본문 */}
      <div className="flex-1 max-h-[600px] overflow-y-auto py-1">
        {mode === "explorer" && (
          <input
            type="text"
            value={search}
            id="sftp-search"
            onChange={e => setSearch(e.target.value)}
            placeholder="이 폴더에서 검색"
            className="ml-3 w-40 bg-[#22223c] border border-[#353773] rounded px-3 py-1 text-[14px] text-[#c7cdfa] focus:outline-none focus:ring focus:ring-[#888ebd]/40 transition"
            style={{ minWidth: 90 }}
          />
        )}
        {mode === "tree" ? renderTree("/") : renderExplorer()}
      </div>
      {/* 파일 열기 다이얼로그 */}
      {fileDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-[#22223c] rounded-xl shadow-xl px-8 py-6 flex flex-col items-center gap-3 min-w-[270px]">
            <div className="text-lg font-semibold mb-2 text-[#ecebff]">
              파일 열기 옵션
            </div>
            <div className="text-[15px] text-[#9fa6c8] mb-3">
              <span className="font-semibold text-[#d8deff]">{fileDialog?.file.name}</span>
              <span> 을(를) 어떻게 열까요?</span>
            </div>
            <div className="flex gap-4">
              <button
                className="px-5 py-1 rounded-lg bg-[#353773] text-white font-medium hover:bg-[#454b8a] transition"
                onClick={() => handleOpenFile("vi")}
              >
                vi로 열기
              </button>
              <button
                className="px-5 py-1 rounded-lg bg-[#7a80fc] text-white font-medium hover:bg-[#5560be] transition"
                onClick={() => handleOpenFile("vim")}
              >
                vim으로 열기
              </button>
            </div>
            <button
              className="mt-4 px-4 py-1 rounded text-[#abb2df] border border-[#353773] hover:bg-[#232347] transition"
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