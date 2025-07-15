import { useState } from "react";
import { useGlobalUI } from "../context/GlobalUIContext";
import { useSocket } from "../context/SocketContext";
import { zipDownloadEvent } from "../services/TerminalService";
export type Entry = { name: string; type: "-" | "d" | "l", longname?: string };
export type ListData = { remotePath: string; list: Entry[] };
export type FileDialog = { file: Entry; path: string } | null;


export const useSftp = () => {
    const { emit } = useSocket();
    const [mode, setMode] = useState<"explorer" | "tree">("explorer");
    const [tree, setTree] = useState<Record<string, Entry[]>>({});
    const [cwd, setCwd] = useState<string>("/");
    const [openDirs, setOpenDirs] = useState<Set<string>>(new Set(["/"]));
    const [fileDialog, setFileDialog] = useState<FileDialog>(null);
    const [dragging, setDragging] = useState<string | null>(null); // 드래그 중인 파일명(고유)
    const [dropTarget, setDropTarget] = useState<string | null>(null); // 드롭 가능한 폴더명(경로)
    const { showToast, setLoading } = useGlobalUI();

    const [search, setSearch] = useState("");

    const [selected, setSelected] = useState<string[]>([]); // 선택된 파일들의 "풀패스" (예: /home/xxx.txt)
    // 새로고침
    const handleRefresh = () => {
        if (mode === "explorer") emit("sftp-list", { remotePath: cwd });
        else emit("sftp-list", { remotePath: "/" });
    };

    function toggleSelect(e: React.MouseEvent, fullPath: string) {
        e.stopPropagation();
        e.preventDefault();

        if (e.ctrlKey) {
            setSelected(prev =>
                prev.includes(fullPath)
                    ? prev.filter(p => p !== fullPath)
                    : [...prev, fullPath]
            );
        } else if (fullPath === "none") {
            setSelected([]);
        } else {
            setSelected([fullPath]);
        }
    }

    function handleDownloadSelected() {
        if (!selected.length) {
            showToast("선택된 파일이 없습니다!", "error");
            return;
        }
        zipDownloadEvent(isLoading);        
        emit("sftp-download-zip", { files: selected });
    }

    const isLoading = () => {
        setLoading(false);    
    };

    return {
        mode,
        setMode,
        tree,
        setTree,
        cwd,
        setCwd,
        openDirs,
        setOpenDirs,
        fileDialog,
        setFileDialog,
        dragging,
        setDragging,
        dropTarget,
        setDropTarget,
        search,
        setSearch,
        selected,
        setSelected,
        handleRefresh,
        // Global UI actions
        showToast,
        setLoading,
        toggleSelect,
        handleDownloadSelected

    }
}