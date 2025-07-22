import { useState, useCallback, useEffect, useMemo } from "react";
import { useGitSocket } from "../../context/GitSocketContext";
import { useRemoteContext } from "../../context/RemoteContext";
import type { Remote } from "./useRemote";

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
  const { socket, isConnected, emit, on, off } = useGitSocket();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);

  // 컨텍스트 메뉴(우클릭) 상태
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  // 소켓 이벤트 리스너 등록
  const { selectedRemote, setCommitBranches } = useRemoteContext();

  // 커밋 히스토리 불러오기
  const fetchCommitHistory = useCallback((remote: Remote) => {    
    emit("fetch_commit_history", remote);
  }, [socket]);

  useEffect(() => {
    if (!selectedRemote) return;
    fetchCommitHistory(selectedRemote);

    const handler = (commits: Commit[]) => setCommits(commits);

    on("fetch_commit_history_response", handler);

    return () => {
      off("fetch_commit_history_response", handler); // 콜백 명시
    };
  }, [selectedRemote]);

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
  // 커밋 데이터에 브랜치명 필드 붙이기
  // 전체 브랜치명 컬럼 추출
  // 브랜치명 추출 함수
  const getAllBranches = (commits: Commit[]) => {
    const branchesSet = new Set<string>();
    commits.forEach(commit => {
      if (commit.refs) {
        commit.refs.split(',').forEach(ref => {
          const branch = ref.trim().replace(/^(HEAD -> )?/, ''); // HEAD -> 제거
          if (branch) branchesSet.add(branch);
        });
      }
    });
    return Array.from(branchesSet);
  }

  function withBranches(commits: Commit[]): Commit[] {
    // 1. 커밋 해시로 바로 찾을 수 있게 맵 생성
    const commitMap = new Map<string, Commit>();
    commits.forEach(c => commitMap.set(c.hash, { ...c }));

    // 2. 브랜치명과 해시 추출 (refs)
    let branchTips: { branch: string, hash: string }[] = [];
    for (const c of commits) {
      if (c.refs) {
        // "HEAD -> main, origin/main" 등에서 ','로 나누기
        c.refs.split(',').forEach(ref => {
          let name = ref.trim();

          // "HEAD -> main"처럼 "HEAD ->"가 앞에 있으면 제거
          if (name.startsWith("HEAD ->")) {
            name = name.replace("HEAD ->", "").trim();
          }

          // 빈 값은 스킵
          if (name) {
            branchTips.push({ branch: name, hash: c.hash });
          }
        });
      }
    }


    // 3. 브랜치 tip에서 과거로 따라가며, 지나간 커밋에 브랜치 할당
    for (const { branch, hash } of branchTips) {
      let currentHash = hash;
      const visited = new Set<string>();
      while (currentHash && !visited.has(currentHash)) {
        visited.add(currentHash);
        const c = commitMap.get(currentHash);
        if (!c) break;
        if (!c.branches) c.branches = [];
        if (!c.branches.includes(branch)) c.branches.push(branch);

        // parent는 공백 구분
        const parentHashes = c.parents ? c.parents.split(' ') : [];
        // 브랜치 추적은 "첫 번째 parent만" (일반적인 브랜치), 머지는 특별 처리 필요
        // 여기선 단순화하여 첫 parent만 따라감
        currentHash = parentHashes[0];
      }
    }

    // 4. 결과 배열 반환
    return Array.from(commitMap.values());
  }

  // withBranches로 커밋 가공, 전체 브랜치 추출 (파생값으로 관리)
  const commitsWithBranches = useMemo(() => withBranches(commits), [commits]);
  const commitBranches = useMemo(() => getAllBranches(commitsWithBranches), [commitsWithBranches]);

  useEffect(() => {
    setCommitBranches(commitBranches); // 필요하다면 context 등 상태에 동기화
  }, [commitBranches, setCommitBranches]);


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


    // 커밋 히스토리 가져오기
    fetchCommitHistory,
    commitsWithBranches,
    commitBranches,
  };
};
