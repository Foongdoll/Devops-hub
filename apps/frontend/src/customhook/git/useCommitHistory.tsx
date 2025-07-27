import { useState, useCallback, useEffect, useMemo } from "react";
import { useGitSocket } from "../../context/GitSocketContext";
import { useRemoteContext } from "../../context/RemoteContext";
import type { Remote } from "./useRemote";
import type { Branch } from "./useBranches";
import { showConfirm, showLoading } from "../../utils/notifyStore";
import type { File } from "./useChanges";

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
  const [selectedCommit, setselectedCommit] = useState<Commit | null>(null);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [currentBranchTipHash, setCurrentBranchTipHash] = useState<string>("");
  // 컨텍스트 메뉴(우클릭) 상태
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const [commitFiles, setCommitFiles] = useState<File[]>([]);

  const { selectedRemote } = useRemoteContext();

  // 커밋 히스토리 불러오기
  const fetchCommitHistory = useCallback((remote: Remote, branches: Branch[]) => {
    showLoading({ message: "Commit history loading..." });
    emit("fetch_commit_history", { remote, branches });
  }, [socket, selectedRemote]);

  // 현재 헤드 브랜치의 tip 해시를 가져오기
  const fetchHeadBranchTip = useCallback((remote: Remote) => {
    emit("fetch_head_branch_tip", { remote: remote });
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
  const handleMenuAction = useCallback(async (remote: Remote | null, action: string, commit: Commit) => {
    setSelectedHash(commit.hash);
    setselectedCommit(commit);
    let ok: boolean | undefined;

    switch (action) {
      case "files":
        onCommitFiles(remote, commit);

        break;
      case "checkout":
        const isTip = currentBranchTipHash === commit.hash;
        if (!isTip) {
          [ok] = await showConfirm(
            "정말 작업 상태를 변경하시겠습니까?",
            "이 커밋을 체크아웃 시 분리된 HEAD가 생성되고 (나중에 새로 브랜치를 만들지 않는 이상) 아무런 브랜치에도 있을 수 없게 됩니다.\n\n정말 하려던 게 맞습니까? 아니면, 취소 버튼을 누르고 다른 커밋을 고르세요.",
          );
          if (ok) {
            emit('git_checkout_commit', { remote: remote, hash: commit.hash });
          }
        } else {
          emit('git_checkout_commit', { hash: commit.hash });
        }
        break;

      case "merge":
        [ok] = await showConfirm(
          "정말 병합하시겠습니까?",
          `커밋 ${commit.hash.slice(0, 8)} (${commit.message})을(를) 현재 브랜치에 병합합니다.`
        );
        if (ok) {
          emit("git_merge_commit", { remote, hash: commit.hash });
        }
        break;

      case "rebase":
        [ok] = await showConfirm(
          "정말 리베이스하시겠습니까?",
          `커밋 ${commit.hash.slice(0, 8)} (${commit.message})을(를) 기준으로 현재 브랜치를 리베이스합니다.\n작업 내용이 변경될 수 있습니다.`
        );
        if (ok) {
          emit("git_rebase_commit", { remote, hash: commit.hash });
        }
        break;

      case "tag":
        // 태그명 입력 받기 (프롬프트나 커스텀 모달 가능)
        var tagName = prompt("생성할 태그 이름을 입력하세요.", "");
        if (!tagName || !tagName.trim()) break;

        [ok] = await showConfirm(
          "태그 생성",
          `커밋 ${commit.hash.slice(0, 8)}에 태그 '${tagName}'을(를) 추가하시겠습니까?`
        );
        if (ok) {
          emit("git_tag_commit", { remote, hash: commit.hash, tag: tagName.trim() });
        }
        break;

      case "copy":
        navigator.clipboard.writeText(commit.hash);
        showLoading({ message: "SHA copied to clipboard!" });
        break;
    }
    closeContextMenu();

  }, [closeContextMenu, emit, showConfirm, showLoading, currentBranchTipHash]);

  const onCommitFiles = (remote: Remote | null, commit: Commit) => {
    emit("fetch_commit_files", { remote: remote, commit: commit })
  }

  const onCommitFileDiff = (remote: Remote | null, commit: Commit | null, file: File) => {
    emit("fetch_commit_files_diff", { remote: remote, commit: commit, filePath: file.path })
  }

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
    fetchHeadBranchTip,
    setCurrentBranchTipHash,
    currentBranchTipHash,

    // 커밋 히스토리 가져오기
    fetchCommitHistory,
    // 특정 커밋 파일, 파일 내용
    commitFiles, setCommitFiles,    
    onCommitFiles, onCommitFileDiff,
    selectedCommit, setselectedCommit
  };
};
