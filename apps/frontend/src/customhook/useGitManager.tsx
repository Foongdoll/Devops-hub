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


export const useGitManager = () => {
  const { showToast, setLoading } = useGlobalUI();
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
  // ==============================

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
  const handleSelectRemote = (remote: Remote) => {
    if (selectedRemote && selectedRemote.id === remote.id) {
      setSelectedRemote(null);
      return;
    }
    setLoading(true);
    // 해당 리모트 커밋히스토리 가져오기
    gitSocket.emit('git-all-branches-commits', { repoPath: remote.path, limit: 30 });

    gitSocket.on('git-all-branches-commits-data', async (data) => {
      await delay(500);
      hideLoading();
      setCommits(data);
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
  const fetchChangedFiles = async () => {
    setShowStageTab(prev => !prev);
    if (showStageTab) {
      setChangedFiles([]);
      setStagedFiles([]);
      return;
    }
    setLoading(true);
    // 선택한 리모트의 변경된 파일 목록 가져오기
    gitSocket.emit('git-status', { repoPath: selectedRemote?.path });
    gitSocket.on('git-status-data', async (data) => {
      const changed = data.filter((e: { file: string; staged: boolean; status: string }) => !e.staged);
      const staged = data.filter((e: { file: string; staged: boolean; status: string }) => e.staged);
      await delay(500);
      hideLoading();
      setChangedFiles(changed);
      setStagedFiles(staged);
    });

    gitSocket.on('git-status-error', async (error) => {
      await delay(500);
      hideLoading();
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
      await delay(500);
      hideLoading();
      showToast("커밋이 성공적으로 완료되었습니다.", "success");
      setChangedFiles([]);
      setStagedFiles([]);
      setCommitMsg("");
      setSelectedFile(null);
    });
    gitSocket.on('git-commit-error', async (error) => {
      await delay(500);
      hideLoading();
      showToast("커밋에 실패했습니다.", "error");
    });

    setLoading(false);
    setStagedFiles([]);
    setCommitMsg("");
    setSelectedFile(null);
  };


  return {
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
    setSelectedFile
  }
}