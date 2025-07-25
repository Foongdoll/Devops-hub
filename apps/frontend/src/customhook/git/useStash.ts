import { useState, useCallback, useEffect } from 'react';
import type { File } from './useChanges';
import type { Remote } from './useRemote';
import { useGitSocket } from '../../context/GitSocketContext';
import { showToast } from '../../utils/notifyStore';
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


  const applyStash = useCallback((stash: Stash) => {
    setStashes(prev => prev.filter(s => s.name !== stash.name));
    setSelectedStash(null); setStashFiles([]); setSelectedStashFile(null); setStashDiff('');
  }, []);
  const dropStash = useCallback((stash: Stash) => {
    setStashes(prev => prev.filter(s => s.name !== stash.name));
    if (selectedStash?.name === stash.name) {
      setSelectedStash(null); setStashFiles([]); setSelectedStashFile(null); setStashDiff('');
    }
  }, [selectedStash]);
  const selectStash = useCallback((stash: Stash) => {
    setSelectedStash(stash); setStashFiles(stash.files); setSelectedStashFile(null); setStashDiff('');
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


  const fetchStashChanges = useCallback((remote: Remote) => {
    emit('fetch_changed_files', { remote: remote });
  }, []);

  useEffect(() => {

    // 변경 파일 리스트 조회
    on('fetch_changed_files_response', (data: { changedFiles: { status: string; path: string, staged: boolean }[], discard?: boolean }) => {
      if (data) {
        const res = data.changedFiles.map(({ status, path, staged }) => ({ status, path, name: path, staged }) as File);
        setStashChangedFiles(res);
      }
    });
  }, [])

  // 변경 파일을 Stash에 추가 (새 Stash 생성)
  const createStash = useCallback((remote: Remote, files: File[], message: string) => {
    if (files.length === 0) {
      showToast('임시 저장할 파일이 없습니다.\n파일을 선택해주세요.', 'info');
      return;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newStash: Stash = {
      name: `stash@{${stashes.length}}`,
      message: message || `Stash from ${remote.name} - ${timestamp}`,
      files,
    };

    // 소켓 emit으로 서버에 Stash 요청
    emit('git_stash_push', {
      remote,
      files,
      newStash: newStash,
    });


  }, [stashes]);


  const fetchStashFileDiff = useCallback((file: File) => {
    // 실제로는 socket emit 등으로 diff를 받아올 수도 있음
    // 임시로 file.path와 stash.name 기반의 예시
    if (selectedStash) {
      // 서버/소켓 연동 시 emit('fetch_stash_diff', { stash: selectedStash.name, filePath: file.path })
      setStashDiff(`// ${selectedStash.name}의 파일 diff 예시: ${file.name}\n(diff 내용 출력 위치)`);
    }
    setSelectedStashFile(file);
  }, [selectedStash]);




  const onStashFileSelect = useCallback((file: File) => {

  }, []);


  useEffect(() => {
    const handleStashPushResponse = (data: { success: boolean; stash: Stash; error?: string }) => {
      if (data.success && data.stash) {
        setStashes(prev => [data.stash, ...prev]);
        setStashChangedFiles([]); // 변경 파일 목록 비움 (선택사항)
        setStashes(prev => [data.stash!, ...prev]);
      } else if (!data.success) {
        // 실패시 알림/롤백 등
        showToast('임시저장 에러 : ' + data.error, 'error')
      }
    };

    on('git_stash_push_response', handleStashPushResponse);
    return () => {
      off('git_stash_push_response', handleStashPushResponse);
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
    fetchStashChanges,
    stashChangedFiles, setStashChangedFiles,
    // 추가
    createStash,
    fetchStashFileDiff,

    onStashFileSelect,

    selectedChangedFiles, setSelectedChangedFiles,
    stashMessage, setStashMessage
  };
}
