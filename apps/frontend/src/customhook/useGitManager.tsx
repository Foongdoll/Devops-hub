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

export type PushedFile = {
  path: string;
  status: string; // 'M'(수정), 'A'(추가), 'D'(삭제) 등
};

export const useGitManager = () => {
  const { showToast, setLoading, showConfirm } = useGlobalUI();
  const [remotes, setRemotes] = useState<Remote[]>([]);
  const [selectedRemote, setSelectedRemote] = useState<Remote | null>(null);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [commits, setCommits] = useState<GitBranchCommits[]>([]);

  const [tab, setTab] = useState<"change" | "stage" | "commit">("change");

  // gitrepository 컴포넌트 사용 상태
  const [showStageTab, setShowStageTab] = useState(false);

  const [changedFiles, setChangedFiles] = useState<GitStatusFile[]>([]);
  const [stagedFiles, setStagedFiles] = useState<GitStatusFile[]>([]);
  const [commitMsg, setCommitMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState<GitStatusFile | null>(null);
  const [isPushForward, setIsPushForward] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedPushBranch, setSelectedPushBranch] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictFiles, setConflictFiles] = useState<string[]>([]);
  const [pullDetails, setPullDetails] = useState<string | null>(null);
  const [pullCount, setPullCount] = useState<number>(0);
  const [pushCount, setPushCount] = useState<number>(0);
  const [fetchCount, setFetchCount] = useState<number>(0);
  // ==============================

  // 푸쉬 관련
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushLocal, setPushLocal] = useState("");
  const [pushRemote, setPushRemote] = useState("");
  const [localBranches, setLocalBranches] = useState<string[]>([]);
  const [remoteBranches, setRemoteBranches] = useState<string[]>([]);
  const [pushedFiles, setPushedFiles] = useState<PushedFile[]>([]);
  // ==============================

  // 풀 관련
  const [showPullModal, setShowPullModal] = useState(false);
  const [pullLocal, setPullLocal] = useState('');
  const [pullRemote, setPullRemote] = useState('');
  // ==============================


  useEffect(() => {
    if (!gitSocket.getSocket().connected && localStorage.getItem('reload') !== "Y") {
      localStorage.setItem("reload", "Y");
      location.reload();
    } else {
      localStorage.removeItem("reload");
    }
    const fetchRemotes = async () => {
      const res = await getRemotes();
      if (res) {
        setRemotes(res);
      }
      setShowStageTab(false);
    };

    const fetchBranches = async () => {
      gitSocket.emit('git-branches', { repoPath: selectedRemote?.path });
      gitSocket.on('git-branches-data', async (branches: { remoteBranches: string[], localBranches: string[] }) => {
        setLocalBranches(branches.localBranches);
        setRemoteBranches(branches.remoteBranches);
      });
      gitSocket.on('git-local-branches-error', (error) => {
        showToast("로컬 브랜치 목록을 가져오는 데 실패했습니다.", "error");
        console.error(error);
      });

    }

    if (!selectedRemote) {
      fetchRemotes();
    } else {
      if (remoteBranches.length === 0)
        fetchBranches();
    }
  }, [selectedRemote]);


  useEffect(() => {

    // 커밋 파일 목록 가져오기
    gitSocket.on('git-commit-files-data', (data: { branch: string, files: PushedFile[] }) => {
      setPushedFiles(data.files);
      showToast(`선택한 브랜치의 커밋 파일 목록을 가져왔습니다.`, "success");
    });
    gitSocket.on('git-commit-files-error', (error) => {
      showToast("커밋 파일 목록을 가져오는 데 실패했습니다: " + error, "error");
      setPushedFiles([]);
    });


    // 풀 관련 
    gitSocket.on('git-pull-success', ({ message }) => showToast(message, "success"));
    gitSocket.on('git-pull-error', ({ message }) => showToast(message, "error"));

    gitSocket.on('git-pull-conflict', ({ message, stderr }: { message: string; stderr: string }) => {
      // 1. 충돌 안내
      showToast(message, "warn");
      // 2. 충돌 파일 리스트, diff 등 보여주는 컴포넌트 오픈
      setConflictFiles(stderr.split('\n').filter(f => f.trim() !== ""));
      setPullDetails(stderr);
      setShowConflictModal(true);
    });



    // 브랜치 커밋 목록 가져오기
    gitSocket.on('git-all-branches-commits-data', async (data: GitBranchCommits[]) => {
      await delay(500);
      hideLoading();
      setCommits(data);
      const initBranchList = data.map(b => b.branch);
      setRemoteBranches(initBranchList);
    });
    // 커밋 히스토리 에러..! 
    gitSocket.on('git-all-branches-commits-error', async (error) => {
      await delay(500);
      hideLoading();
      console.log(error);
      showToast("브랜치 커밋 정보를 가져오는 데 실패했습니다.", "error");
    });
    // 커밋 개수, pull 개수 가져오기    
    gitSocket.on('git-counts-data', ({ pullCount, pushCount, fetchCount }) => {
      setPullCount(pullCount);
      setPushCount(pushCount);
      setFetchCount(fetchCount);
      hideLoading();
      // showToast('성공적으로 Fetch 되었습니다.', 'info');
    });

    gitSocket.on('git-counts-error', (error) => {
      showToast("카운트 정보를 가져오는 데 실패했습니다.", "error");
      console.log(error);
      hideLoading();
    });


    return () => {
      gitSocket.off('git-commit-files-data');
      gitSocket.off('git-commit-files-error');
      gitSocket.off('git-pull-success');
      gitSocket.off('git-pull-error');
      gitSocket.off('git-pull-conflict');
    }
  }, []);

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

      gitSocket.emit('git-branch-list', { repoPath: path, remote: name });
      gitSocket.on('git-branch-list-data', async (branches: string[]) => {

        const [ok, data] = await showConfirm("원격 저장소가 추가되었습니다.", "원격 저장소와 동기화를 진행하시겠습니까?", { select: true, data: branches });

        if (ok) {
          // 동기화 로직 추가
          gitSocket.emit('git-sync', { repoPath: path, remote: name, branch: data });
          gitSocket.on('git-sync-success', () => {
            showToast("선택하신 브랜치로 동기화가 완료되었습니다.", "success");
          });
          gitSocket.on('git-sync-error', (error) => {
            showToast("동기화에 실패했습니다: " + error.message, "error");
          });
        }


      });

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
    gitSocket.emit('git-counts', { repoPath: remote.path });

    setSelectedBranch('전체');
    setSelectedRemote(remote);
  };

  // 커밋 탭 - 변경된 파일 목록 가져오기
  const fetchChangedFiles = async (sw = false) => {
    console.log(sw);
    if (sw) {
      setShowStageTab(true);
    } else {
      setShowStageTab(prev => !prev);
    }
    if (showStageTab && !sw) {
      setChangedFiles([]);
      setStagedFiles([]);
      setSelectedFile(null);
      return;
    }
    if (showStageTab && !sw) {
      setLoading(true);
    }

    // 선택한 리모트의 변경된 파일 목록 가져오기
    gitSocket.emit('git-status', { repoPath: selectedRemote?.path });
    gitSocket.on('git-status-data', async (data) => {
      const changed = data.filter((e: { file: string; staged: boolean; status: string }) => !e.staged);
      const staged = data.filter((e: { file: string; staged: boolean; status: string }) => e.staged);
      if (showStageTab && !sw) {
        await delay(500);
        hideLoading();
      }
      setChangedFiles(changed);
      setStagedFiles(staged);
    });

    gitSocket.on('git-status-error', async (error) => {
      if (showStageTab && !sw) {
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
    gitSocket.emit('git-commit', { stagedFiles, commitMsg, selectedBranch: selectedPushBranch, repoPath: selectedRemote?.path, isPushForward });
    gitSocket.on('git-commit-success', async (data) => {
      await delay(1000);
      hideLoading();
      showToast(isPushForward ? "커밋 후 푸시가 완료되었습니다." : "커밋이 성공적으로 완료되었습니다.", "success");
      handleFetch();
      fetchChangedFiles(true);
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

  const handleFetch = async () => {
    setLoading(true);
    gitSocket.emit('git-counts', { repoPath: selectedRemote?.path });
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

  const handlePush = async () => {
    if (pushedFiles.length === 0) {
      showToast("커밋할 파일이 없습니다.", "warn");
      return;
    }

    gitSocket.emit('git-push', { repoPath: selectedRemote?.path, remote: selectedRemote?.name, remoteBranch: pushRemote, localBranch: pushLocal });

    gitSocket.on('git-push-success', ({ message }) => {
      showToast("Push 완료: " + message, "success");
      handleFetch();
      setPushedFiles([]);
    });

    gitSocket.on('git-push-error', ({ message }) => {
      showToast("Push 실패: " + message, "error");
    });
  }

  // 푸쉬 모달 제어
  const handleModalPush = async () => {
    if (!pushLocal || !pushRemote) {
      showToast("브랜치를 모두 선택하세요.", "warn");
      return;
    }
    setLoading(true);
    await handlePush();
    await delay(1000);
    hideLoading();
    await setShowPushModal(false);
  };

  // 로컬 브랜치 마다 커밋할 파일 목록 조회
  const handleLocalCommitFiles = (branch: string) => {

    if (branch === "") {
      showToast("커밋할 브랜치를 선택해주세요.", "warn");
      setPushedFiles([]);
      return;
    }
    gitSocket.emit('git-commit-files', { repoPath: selectedRemote?.path, branch, remote: selectedRemote?.name });

  }



  const handleModalPull = () => {
    console.log(pullLocal, pullRemote);
    if (pullLocal === "" || pullRemote === "") {
      showToast("모든 필드를 입력해주세요.", "warn");
      return;
    }
    gitSocket.emit('git-pull', { repoPath: selectedRemote?.path, remote: selectedRemote?.name, localBranche: pullLocal, remoteBranch: pullRemote, strategy: "" });
    setShowPullModal(false);
  };


  return {
    handleLocalCommitFiles,
    // 리모트 관련 상태
    remoteBranches,
    setRemoteBranches,
    // 푸쉬 모달
    localBranches,
    showPushModal,
    setShowPushModal,
    pushLocal,
    setPushLocal,
    pushRemote,
    setPushRemote,
    handleModalPush,
    //    
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
    setPullDetails,
    pullCount,
    setPullCount,
    pushCount,
    setPushCount,
    fetchCount,
    setFetchCount,
    pushedFiles, setPushedFiles,
    selectedPushBranch, setSelectedPushBranch,
    showPullModal, setShowPullModal,
    pullLocal, setPullLocal,
    pullRemote, setPullRemote,
    handleModalPull,
  }
}