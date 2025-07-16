import { useEffect, useState } from "react";
import { useGlobalUI } from "../context/GlobalUIContext";
import { addRemote, deleteRemote, getRemotes, gitSocket } from "../services/GitManagerService";
import { hideLoading } from "../utils/notifyStore";
import { delay } from "../utils/comm";

export type Remote = {
  id: string;
  name: string;
  url: string;
  path: string;
};

export interface GitCommit {
  hash: string;
  message: string;
  branches: string[];
  date: string;
  author: string;
}

export interface GitBranchCommits {
  branch: string;
  commits: GitCommit[];
}

export type GitStatusFile = {
  file: string;
  staged: boolean;
  status: string;
  diff?: string[];
}

export interface PullConflictModalProps {
  open: boolean;
  conflictFiles: string[];
  onResolve: () => void;    // 해결 완료 콜백
  onClose: () => void;      // 모달 닫기 콜백
  details?: string;         // (선택) 추가 상세 메시지
}

export const useGitManager = () => {
  const { showToast, setLoading, showConfirm } = useGlobalUI();
  const [remotes, setRemotes] = useState<Remote[]>([]);
  const [selectedRemote, setSelectedRemote] = useState<Remote | null>(null);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [commits, setCommits] = useState<GitBranchCommits[]>([]);


  // gitrepository 컴포넌트 사용 상태
  const [showStageTab, setShowStageTab] = useState(false);
  const [tab, setTab] = useState<"change" | "stage" | "commit">("change");
  const [changedFiles, setChangedFiles] = useState<GitStatusFile[]>([]);
  const [stagedFiles, setStagedFiles] = useState<GitStatusFile[]>([]);
  const [commitMsg, setCommitMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState<GitStatusFile | null>(null);
  const [isPushForward, setIsPushForward] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [branchList, setBranchList] = useState<string[]>([]);
  // ==============================
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictFiles, setConflictFiles] = useState<string[]>([]);
  const [pullDetails, setPullDetails] = useState<string | null>(null);

  useEffect(() => {
    const fetchRemotes = async () => {
      const res = await getRemotes();
      if (res) {
        setRemotes(res);
      }
      setShowStageTab(false);
    };

    if (!selectedRemote) {
      fetchRemotes();
    }
  }, [selectedRemote]);

  // 리모드 삭제
  const handleDeleteRemote = async (id: string) => {
    const res = await deleteRemote(id);

    if (res) {
      setRemotes(remotes.filter(r => r.id !== id))
      showToast("원격 저장소가 삭제되었습니다.", "success");
    } else {
      showToast("원격 저장소 삭제에 실패했습니다.", "error");
    }

  };
  // 리모트 추가
  const handleAddRemote = async (remote: { name: string; url: string, path: string }) => {
    const { name, url, path } = remote;

    if (name.trim() === "" || url.trim() === "" || path.trim() === "") {
      showToast("모든 필드를 입력해주세요.", "error");
      return;
    }
    setLoading(true);
    const res = await addRemote(remote);
    if (res) {
      setRemotes([...remotes, res]);
      showToast("원격 저장소가 추가되었습니다.", "success");
    } else {
      showToast("원격 저장소 추가에 실패했습니다.", "error");
    }
    setLoading(false);
  }

  // 리모트 선택
  const handleSelectRemote = async (remote: Remote) => {
    if (selectedRemote && selectedRemote.id === remote.id) {
      setSelectedRemote(null);
      return;
    }
    setLoading(true);
    // 해당 리모트 커밋히스토리 가져오기
    gitSocket.emit('git-all-branches-commits', { repoPath: remote.path, limit: 30 });

    gitSocket.on('git-all-branches-commits-data', async (data: GitBranchCommits[]) => {
      await delay(500);
      hideLoading();
      setCommits(data);
      const initBranchList = data.map(b => b.branch);
      setBranchList(initBranchList);
    });
    // 커밋 히스토리 에러..! 
    gitSocket.on('git-all-branches-commits-error', async (error) => {
      await delay(500);
      hideLoading();
      showToast("브랜치 커밋 정보를 가져오는 데 실패했습니다.", "error");
    });

    setSelectedBranch('전체');
    setSelectedRemote(remote);
  };

  // 커밋 탭 - 변경된 파일 목록 가져오기
  const fetchChangedFiles = async (sw = showStageTab) => {
    setShowStageTab(prev => !prev);
    if (showStageTab && sw) {
      setChangedFiles([]);
      setStagedFiles([]);
      setSelectedFile(null);
      return;
    }
    if (showStageTab && sw) {
      setLoading(true);
    }

    // 선택한 리모트의 변경된 파일 목록 가져오기
    gitSocket.emit('git-status', { repoPath: selectedRemote?.path });
    gitSocket.on('git-status-data', async (data) => {
      const changed = data.filter((e: { file: string; staged: boolean; status: string }) => !e.staged);
      const staged = data.filter((e: { file: string; staged: boolean; status: string }) => e.staged);
      if (showStageTab && sw) {
        await delay(500);
        hideLoading();
      }
      setChangedFiles(changed);
      setStagedFiles(staged);
    });

    gitSocket.on('git-status-error', async (error) => {
      if (sw) {
        await delay(500);
        hideLoading();
      }
      showToast("변경된 파일 목록을 가져오는 데 실패했습니다.", "error");
    });

  };

  const onDiffFileClick = (file: GitStatusFile) => {
    gitSocket.emit('git-diff-file', { repoPath: selectedRemote?.path, file });

    // 소켓 수신
    gitSocket.on('git-diff-file-data', ({ file, diff }) => {
      // 선택된 파일의 diff 데이터를 처리
      file.diff = diff.split('\n');
      setSelectedFile(file)
    });
  };

  // 커밋 실행
  const handleCommit = () => {

    if (commitMsg === "") {
      showToast("커밋 메시지를 입력해주세요.", "error");
      return;
    } else if (stagedFiles.length === 0) {
      showToast("커밋할 파일이 없습니다.", "error");
      return;
    }
    setLoading(true);
    gitSocket.emit('git-commit', { stagedFiles, commitMsg, repoPath: selectedRemote?.path, isPushForward });
    gitSocket.on('git-commit-success', async (data) => {
      await delay(1000);
      hideLoading();
      showToast(isPushForward ? "커밋 후 푸시가 완료되었습니다." : "커밋이 성공적으로 완료되었습니다.", "success");
      fetchChangedFiles(!showStageTab);
      setCommitMsg("");
      setSelectedFile(null);
    });
    gitSocket.on('git-commit-error', async (error) => {
      await delay(1000);
      hideLoading();
      showToast("커밋에 실패했습니다.", "error");
    });

    setCommitMsg("");
    setSelectedFile(null);
  };

  // 깃 풀
  const handlePull = async () => {
    gitSocket.emit('git-pull', { repoPath: selectedRemote?.path, branch: selectedBranch, strategy: "" });

    gitSocket.on('git-pull-success', ({ message }) => showToast(message, "success"));
    gitSocket.on('git-pull-error', ({ message }) => showToast(message, "error"));

    gitSocket.on('git-pull-conflict', ({ message, stderr }) => {
      // 1. 충돌 안내
      showToast(message, "warn");
      // 2. 충돌 파일 리스트, diff 등 보여주는 컴포넌트 오픈
      setConflictFiles(stderr.split('\n').filter(f => f.trim() !== ""));
      setPullDetails(stderr);
      setShowConflictModal(true);
    });
  }

  // 충돌 해결
  const handleResolve = () => {
    setLoading(true);
    // 1. 서버에 '남은 충돌파일' 체크 요청
    gitSocket.emit('git-conflict-check', { repoPath: selectedRemote?.path });

    gitSocket.on('git-conflict-check-result', async ({ remainConflicts }) => {
      setLoading(false);
      if (!remainConflicts || remainConflicts.length === 0) {
        // 모든 충돌 해결됨: 자동 커밋
        setShowConflictModal(false);
        const res = await showConfirm("충돌이 모두 해결되었습니다.", "충돌 커밋을 진행하시겠습니까?");
        if (!res) return;

        // 커밋 실행
        gitSocket.emit('git-commit', {
          repoPath: selectedRemote?.path,
          commitMsg: 'Resolve merge conflicts',
          stagedFiles: conflictFiles,     // 충돌 파일 목록
          isPushForward: false,
        });

        // 커밋 완료 이벤트 수신
        gitSocket.on('git-commit-success', () => {
          showToast("충돌 커밋이 완료되었습니다.", "success");
          // 필요하다면 추가 동작(새로고침 등)
        });
        gitSocket.on('git-commit-error', (error) => {
          showToast("충돌 커밋에 실패했습니다: " + (error.message || error), "error");
        });

      } else {
        showToast(
          `아직 충돌이 남아있습니다:\n${remainConflicts.join("\n")}\n모든 파일을 수정/스테이지 후 다시 시도해주세요.`,
          'error'
        );
      }
    });


    gitSocket.on('git-conflict-check-error', ({ message }) => {
      setLoading(false);
      showToast("충돌 상태 확인 실패: " + message, 'error');
    });
  };

  const handlePush = async () => {
    gitSocket.emit('git-push', { repoPath: selectedRemote?.path, remote: "origin", branch: selectedBranch });

    gitSocket.on('git-push-success', ({ message }) => {
      showToast("Push 완료: " + message, "success");
    });

    gitSocket.on('git-push-error', ({ message }) => {
      showToast("Push 실패: " + message, "error");
    });
  }

  const handleFetch = async () => {
    setLoading(true);
    gitSocket.emit('git-fetch', { repoPath: selectedRemote?.path, remote: "origin" });

    gitSocket.on('git-fetch-success', ({ message }) => {
      showToast("Fetch 완료: " + message, "success");
      setLoading(false);
    });
    gitSocket.on('git-fetch-error', ({ message }) => {
      showToast("Fetch 실패: " + message, "error");
      setLoading(false);
    });
  };

  // STASH (변경사항 임시 저장)
  const handleStash = async () => {
    setLoading(true);
    gitSocket.emit('git-stash', { repoPath: selectedRemote?.path });

    gitSocket.on('git-stash-success', ({ message }) => {
      showToast("Stash 완료: " + message, "success");
      setLoading(false);
    });
    gitSocket.on('git-stash-error', ({ message }) => {
      showToast("Stash 실패: " + message, "error");
      setLoading(false);
    });
  };

  // POP STASH (임시 저장 불러오기)
  const handlePopStash = async () => {
    setLoading(true);
    gitSocket.emit('git-stash-pop', { repoPath: selectedRemote?.path });

    gitSocket.on('git-stash-pop-success', ({ message }) => {
      showToast("Stash pop 완료: " + message, "success");
      setLoading(false);
    });
    gitSocket.on('git-stash-pop-error', ({ message }) => {
      showToast("Stash pop 실패: " + message, "error");
      setLoading(false);
    });
  };


  return {
    // 
    handlePull,
    handleResolve,
    handlePush,
    handleFetch,
    handleStash,
    handlePopStash,
    // 원격 저장소 관련 상태
    remotes,
    setRemotes,
    selectedRemote,
    setSelectedRemote,
    // 원격 저장소 추가 모달
    showRemoteModal,
    setShowRemoteModal,
    // 원격 저장소 설정 모달
    showConfigModal,
    setShowConfigModal,

    handleDeleteRemote,
    handleAddRemote,
    handleSelectRemote,
    branchList,
    setBranchList,
    commits,
    handleCommit,
    setIsPushForward,
    isPushForward,
    selectedBranch,
    setSelectedBranch,
    // gitrepository 컴포넌트 사용 상태
    showStageTab,
    setShowStageTab,
    tab,
    setTab,
    changedFiles,
    setChangedFiles,
    stagedFiles,
    setStagedFiles,
    commitMsg,
    setCommitMsg,
    fetchChangedFiles,
    onDiffFileClick,
    selectedFile,
    setSelectedFile,
    showConflictModal,
    setShowConflictModal,
    conflictFiles,
    setConflictFiles,
    pullDetails,
    setPullDetails
  }
}