import { useState, useCallback, useEffect } from 'react';
import type { File } from './useChanges';
import type { Remote } from './useRemote';
import { useGitSocket } from '../../context/GitSocketContext';
import { hideLoading, showLoading, showToast } from '../../utils/notifyStore';
import { applyStashImpl, dropStashImpl, fetchStashsImpl } from '../../services/GitManagerService';
import { delay } from '../../utils/comm';
export type Stash = { name: string; message: string; files: File[] };

export function useStash(initial: Stash[] = []) {
  const [stashes, setStashes] = useState<Stash[]>(initial);
  const [selectedStash, setSelectedStash] = useState<Stash | null>(null);
  const [stashFiles, setStashFiles] = useState<File[]>([]);
  const [selectedStashFile, setSelectedStashFile] = useState<File | null>(null);
  const [stashDiff, setStashDiff] = useState<string>('');
  const [stashMessage, setStashMessage] = useState('');
  const [stashChangedFiles, setStashChangedFiles] = useState<File[]>([]);
  const [selectedChangedFiles, setSelectedChangedFiles] = useState<File[]>([]);

  const { emit, on, off } = useGitSocket();


  const applyStash = useCallback(async (remote: Remote, stash: Stash) => {
    if (!remote || !stash) return;
    showLoading({ message: "스태시 적용 중..." });
    const res = await applyStashImpl(remote, stash.name);
    if (res) {
      setStashes(prev => prev.filter(s => s.name !== stash.name));
      setSelectedStash(null); setStashFiles([]); setSelectedStashFile(null); setStashDiff('');
    }
    await delay(1000);
    hideLoading();
  }, []);
  const dropStash = useCallback(async (remote: Remote, stash: Stash) => {
    if (!remote || !stash) return;
    showLoading({ message: "스태시 적용 중..." });
    const res = await dropStashImpl(remote, stash.name);
    if (res) {
      setStashes(prev => prev.filter(s => s.name !== stash.name));
      if (selectedStash?.name === stash.name) {
        setSelectedStash(null); setStashFiles([]); setSelectedStashFile(null); setStashDiff('');
      }
    } else {
      showToast('스태시 삭제 실패', 'error');
    }

    await delay(1000);
    hideLoading();
  }, [selectedStash]);
  const selectStash = useCallback((stash: Stash) => {
    setSelectedStash(stash);
    setStashFiles(stash.files);
    setSelectedStashFile(null);
    setStashDiff('');
  }, []);
  const selectStashFile = useCallback((file: File) => {
    setSelectedStashFile(file);
  }, []);

  // 로컬 브랜치 체크아웃 중 충돌 난 파일 스테시 
  const onCheckoutConflictFilesStash = useCallback((remote: Remote, conflictFiles: File[]) => {
    if (conflictFiles.length === 0) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newStash: Stash = {
      name: `stash@{${stashes.length}}`, // 또는 `stash-${timestamp}`
      message: `Checkout conflict from ${remote.name}`,
      files: conflictFiles,
    };

    setStashes(prev => [newStash, ...prev]);
  }, []);


  const fetchStashChangeFiles = useCallback((remote: Remote) => {
    emit('fetch_changed_files', { remote: remote });
  }, []);
  const fetchStashs = useCallback((remote: Remote) => {
    fetchStashsImpl(remote).then(data => {
      // console.log('fetchStashsImpl', data);
      setStashes(data);
    });
  }, []);

  useEffect(() => {

    // 변경 파일 리스트 조회
    on('fetch_stash_changed_files_response', (data: { resultFiles: File[], discard?: boolean }) => {
      if (data.resultFiles) {
        const res = data.resultFiles.filter(v => !v.staged);
        setStashChangedFiles(res);
      }
    });
    return () => {
      off('fetch_stash_changed_files_response');
    }
  }, [])

  // 변경 파일을 Stash에 추가 (새 Stash 생성)
  const createStash = useCallback((remote: Remote | null, files: File[], message: string) => {
    if (files.length === 0) {
      showToast('임시 저장할 파일이 없습니다.\n파일을 선택해주세요.', 'info');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newStash: Stash = {
      name: `stash@{${stashes.length}}`,
      message: message || `Stash from ${remote?.name} - ${timestamp}`,
      files,
    };

    // 소켓 emit으로 서버에 Stash 요청
    emit('git_stash_push', {
      remote,
      files,
      newStash: newStash,
    });


  }, [stashes]);


  const fetchStashFileDiff = useCallback((remote: Remote | null, selectedStash: Stash | null, file: File) => {

    if (selectedStash) {
      emit('fetch_stash_file_diff', { remote, filePath: file.path, stash: selectedStash })
    }
    setSelectedStashFile(file);
  }, [selectedStash]);


  // 스태시 안의 파일 선택 -> diff를 보여주는 함수
  const onStashFileSelect = useCallback((remote: Remote | null, selectedStash: Stash | null, file: File) => {
    setSelectedStashFile(file);
    fetchStashFileDiff(remote, selectedStash, file);
  }, []);


  useEffect(() => {
    const handleStashPushResponse = (data: { success: boolean; stash: Stash; error?: string }) => {
      if (data.success && data.stash) {
        setStashes(prev => [data.stash, ...prev]);
        setStashChangedFiles([]); // 변경 파일 목록 비움 (선택사항) 
      } else if (!data.success) {
        // 실패시 알림/롤백 등 
        showToast('임시저장 에러 : ' + data.error, 'error')
      }
    };

    on('fetch_stash_file_diff_response', (data: { diff: string }) => {
      const { diff } = data;
      console.log(data);
      if (diff.trim() === "") {
        showToast("변경 사항을 불러오지 못했습니다.\n새로고침 후 다시 진행부탁드립니다.", "error");
      } else {
        setStashDiff(diff);
      }

    });

    on('git_stash_push_response', handleStashPushResponse);
    return () => {
      off('git_stash_push_response', handleStashPushResponse);
      off('fetch_stash_file_diff_response');
    };
  }, [on, off]);


  useEffect(() => {
    setSelectedChangedFiles([]);
    setSelectedStash(null);
    setSelectedStashFile(null)
    setStashChangedFiles([])
    setStashDiff("")
    setStashFiles([])
    setStashes([])
  }, [])

  return {
    stashes, selectedStash, stashFiles, selectedStashFile, stashDiff,
    applyStash, dropStash, selectStash, selectStashFile,
    setStashes,
    onCheckoutConflictFilesStash,
    fetchStashChangeFiles,
    stashChangedFiles, setStashChangedFiles,
    // 추가
    createStash,
    fetchStashFileDiff,

    onStashFileSelect,

    selectedChangedFiles, setSelectedChangedFiles,
    stashMessage, setStashMessage,

    fetchStashs
  };
}
