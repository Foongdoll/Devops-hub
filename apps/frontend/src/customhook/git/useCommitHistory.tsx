import { useState, useCallback } from "react";

// Commit 타입 (커스터마이즈해서 쓰세요)
export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  branches?: string[];
}

// 컨텍스트 메뉴 위치와 상태
interface ContextMenuState {
  commit: Commit;
  pos: { x: number; y: number };
}

export const useCommitHistory = (initialCommits: Commit[] = []) => {
  // 커밋 리스트
  const [commits, setCommits] = useState<Commit[]>(initialCommits);

  // 선택된 커밋 (선택 시 하이라이트)
  const [selectedHash, setSelectedHash] = useState<string | null>(null);

  // 컨텍스트 메뉴(우클릭) 상태
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  // 커밋 선택
  const selectCommit = useCallback((hash: string) => {
    setSelectedHash(hash);
  }, []);

  // 컨텍스트 메뉴 열기
  const openContextMenu = useCallback((commit: Commit, pos: { x: number; y: number }) => {
    setMenu({ commit, pos });
  }, []);

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

  // (선택) 커밋 데이터 새로고침 등도 필요시 추가
  const refreshCommits = useCallback((list: Commit[]) => setCommits(list), []);

  return {
    // 패널에 넘길 데이터/핸들러
    commits,
    selectedHash,
    selectCommit,
    menu, // {commit, pos} | null
    openContextMenu,
    closeContextMenu,
    handleMenuAction,
    refreshCommits,
  };
};
