import { useState, useCallback, useEffect, useMemo } from "react";
import { useGitSocket } from "../../context/GitSocketContext";
import { useRemoteContext } from "../../context/RemoteContext";
import type { Remote } from "./useRemote";
import type { Branch } from "./useBranches";
import { showLoading } from "../../utils/notifyStore";

// 커밋 타입
export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  parents: string;      // 공백 구분 부모 해시들
  refs: string;         // HEAD -> main, origin/main, 등등
  branches?: string[];  // 파싱된 브랜치명 리스트
}

// 컨텍스트 메뉴 위치와 상태
interface ContextMenuState {
  commit: Commit;
  pos: { x: number; y: number };
}

export const useCommitHistory = () => {
  const { socket, emit } = useGitSocket();
  const [commits, setCommits] = useState<Map<string, Commit[]>>(new Map());
  const [selectedHash, setSelectedHash] = useState<string | null>(null);

  // 컨텍스트 메뉴(우클릭) 상태
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const { selectedRemote } = useRemoteContext();

  // 커밋 히스토리 불러오기
  const fetchCommitHistory = useCallback((remote: Remote, branches: Branch[]) => {
    showLoading({ message: "Commit history loading..." });
    emit("fetch_commit_history", { remote, branches });
  }, [socket, selectedRemote]);



  // 커밋 선택
  const selectCommit = useCallback((hash: string) => {
    setSelectedHash(hash);
  }, [socket, selectedRemote]);

  // 컨텍스트 메뉴 열기
  const openContextMenu = useCallback((commit: Commit, pos: { x: number; y: number }) => {
    setMenu({ commit, pos });
  }, [socket, selectedRemote]);

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = useCallback(() => setMenu(null), []);

  // 메뉴 액션 (실제 git 작업 연결하면 됨)
  const handleMenuAction = useCallback((action: string, commit: Commit) => {
    // 예시: 실제 액션 핸들링 (checkout/merge 등)
    if (action === "checkout") {
      setSelectedHash(commit.hash);
      // checkout 작업...
    }
    if (action === "copy-sha") {
      navigator.clipboard.writeText(commit.hash);
    }
    // 나머지 git 액션 구현
    closeContextMenu();
  }, [closeContextMenu]);





  return {
    // 패널에 넘길 데이터/핸들러 
    commits,
    setCommits,
    selectedHash,
    selectCommit,
    menu, // {commit, pos} | null
    openContextMenu,
    closeContextMenu,
    handleMenuAction,


    // 커밋 히스토리 가져오기
    fetchCommitHistory,

  };
};
