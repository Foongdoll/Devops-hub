import { useEffect, useState } from "react";
import { useGlobalUI } from "../context/GlobalUIContext";
import { addRemote, deleteRemote, getRemotes, gitSocket } from "../services/GitManagerService";

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

export const useGitManager = () => {
  const { showToast } = useGlobalUI();
  const [remotes, setRemotes] = useState<Remote[]>([]);
  const [selectedRemote, setSelectedRemote] = useState<Remote | null>(null);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [commits, setCommits] = useState<GitBranchCommits[]>([]);

  useEffect(() => {
    const fetchRemotes = async () => {
      const res = await getRemotes();
      if (res) {
        setRemotes(res);
      }
    };
    fetchRemotes();
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

    const res = await addRemote(remote);
    if (res) {
      setRemotes([...remotes, res]);
      showToast("원격 저장소가 추가되었습니다.", "success");
    } else {
      showToast("원격 저장소 추가에 실패했습니다.", "error");
    }
  }

  // 리모트 선택
  const handleSelectRemote = (remote: Remote) => {
    if (selectedRemote && selectedRemote.id === remote.id) {
      setSelectedRemote(null);
      return;
    }

    gitSocket.emit('git-all-branches-commits', { repoPath: remote.path, limit: 30 });

    gitSocket.on('git-all-branches-commits-data', (data) => {
      console.log(data)
      setCommits(data);
    });

    gitSocket.on('git-all-branches-commits-error', (error) => {
      console.error(error);
      showToast("브랜치 커밋 정보를 가져오는 데 실패했습니다.", "error");
    });

    setSelectedRemote(remote);
  };


  return {
    remotes,
    setRemotes,
    selectedRemote,
    setSelectedRemote,
    showRemoteModal,
    setShowRemoteModal,
    showConfigModal,
    setShowConfigModal,
    handleDeleteRemote,
    handleAddRemote,
    handleSelectRemote,
    commits,    
  }
}