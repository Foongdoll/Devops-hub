import { useState, useCallback, useEffect } from 'react';
import { useGitSocket } from '../../context/GitSocketContext';
import { useRemoteContext } from '../../context/RemoteContext';
import type { Remote } from './useRemote';
import { hideLoading, showLoading, showToast } from '../../utils/notifyStore';
import { delay } from '../../utils/comm';
export type File = { status: string; path: string; name: string; staged: boolean };

export function useChanges(initialUnstaged: File[] = [], initialStaged: File[] = []) {
  const [unstagedFiles, setUnstagedFiles] = useState<File[]>(initialUnstaged);
  const [stagedFiles, setStagedFiles] = useState<File[]>(initialStaged);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDiff, setFileDiff] = useState<string>('');
  const [commitMsg, setCommitMsg] = useState('');

  // 충돌 파일 left, right 비교 변수
  const [left, setLeft] = useState<string>('');
  const [right, setRight] = useState<string>('');

  const { selectedRemoteBranch, selectedRemote } = useRemoteContext();
  const { emit, on, off } = useGitSocket();

  // 선택된 줄 번호 관리 (변경 사항에서)
  const [selectedLines, setSelectedLines] = useState<number[]>([]);

  // 파일 스테이징/언스테이징
  const stageFile = useCallback((file: File) => {
    setUnstagedFiles(prev => prev.filter(f => f.path !== file.path));
    setStagedFiles(prev => [...prev, file]);
    setSelectedFile(file);
  }, [selectedRemote]);
  const unstageFile = useCallback((file: File) => {
    setStagedFiles(prev => prev.filter(f => f.path !== file.path));
    setUnstagedFiles(prev => [...prev, file]);
    setSelectedFile(file);
  }, [selectedRemote]);

  // 파일 선택 (ChangePanel)
  const selectFile = useCallback((file: File, remote: Remote) => {

    emit('fetch_file_diff', { remote: remote, filePath: file.path, fileStaged: file.staged });

    setFileDiff('');
    setSelectedFile(file);
  }, [selectedRemote]);

  // 파일 선택 (ConflictModal)
  const selectConflictFile = useCallback((file: File, remote: Remote, conflictBranch: string, selectedLocalBranch: string) => {
    emit('fetch_conflict_file_diff', { remote: remote, filePath: file.path, fileStaged: file.staged, conflictBranch, selectedLocalBranch });
    setSelectedFile(file);
    setFileDiff('');
  }, [selectedRemote]);

  // 커밋
  const commit = useCallback((remote: Remote) => {
    if (stagedFiles.length && commitMsg.trim()) {
      setStagedFiles([]);
      setCommitMsg('');
    }

    showLoading({ message: '커밋 진행 중...' });
    emit('commit_files', { remote: remote, files: stagedFiles, message: commitMsg, remoteBranch: selectedRemoteBranch });

  }, [stagedFiles, commitMsg]);

  // 변경 사항 조회
  const fetchChanges = async (remote: Remote) => {
    setStagedFiles([]);
    setUnstagedFiles([]);
    setFileDiff('');
    emit('fetch_changed_files', remote);
  }



  // 선택
  const handleToggleLine = (lineIdx: number) => {
    setSelectedLines((prev) =>
      prev.includes(lineIdx)
        ? prev.filter(idx => idx !== lineIdx)
        : [...prev, lineIdx]
    );
  };


  // lines가 없으면 전체, 있으면 부분 discard
  const onDiscard = (remote: Remote, file: File, lines?: number[]) => {
    console.log('Discarding file:', file, 'Lines:', lines, 'Remote:', remote);
    if (!lines) {
      // 전체 discard 처리 (예: 서버/소켓 emit 등)
      emit('discard_all', { remote: remote, filePath: file.path });
    } else {
      // 선택 줄만 discard (예: 서버/소켓 emit 등)
      emit('discard_lines', { remote: remote, filePath: file.path, lines });
    }
  };



  useEffect(() => {
    // 변경 파일 리스트 조회
    on('fetch_changed_files_response', (data: { status: string; path: string, staged: boolean }[]) => {
      if (data) {
        const staged: File[] = [];
        const unstaged: File[] = [];
        data.forEach(({ status, path, staged: isStaged }) => {
          const file = { status, path, name: path, staged: isStaged } as File;
          if(!file.path) return;
          if (isStaged) staged.push(file);
          else unstaged.push(file);
        });
        
        console.log(data);
        setStagedFiles(staged);
        setUnstagedFiles(unstaged);
        setFileDiff('');
      }
    });

    // 파일 diff 조회
    on('fetch_file_diff_response', (diff: string) => {
      setFileDiff(diff);
    });

    on('commit_files_response', async (response: {
      success: boolean,
      message: string,
      remote: Remote,
      remoteBranch: string
    }) => {
      await delay(1000);
      hideLoading();
      if (response.success) {
        showToast('커밋이 성공적으로 완료되었습니다.', 'success');
        setStagedFiles([]);
        setCommitMsg('');

        emit('fetch_pull_request_count', { remote: response.remote, remoteBranch: response.remoteBranch });
        emit('fetch_commit_count', { remote: response.remote, remoteBranch: response.remoteBranch });

      } else {
        showToast('커밋이 실패하였습니다.', 'error');
        // console.error(response.message);
      }
    });


    on('fetch_conflict_file_diff_response', (data: { left: string, right: string }) => {
      if (data) {
        setLeft(data.left);
        setRight(data.right);
      }
    });

    return () => {
      off('fetch_changed_files_response');
      off('fetch_file_diff_response');
      off('fetch_conflict_file_diff_response');
    }
  }, [selectedRemote])

  return {
    unstagedFiles, stagedFiles, selectedFile, fileDiff,
    stageFile, unstageFile, selectFile, setSelectedFile,
    commitMsg, setCommitMsg, commit,
    setUnstagedFiles, setStagedFiles,

    fetchChanges,

    // 충돌 파일 관련
    selectConflictFile,
    left, setLeft,
    right, setRight,


    handleToggleLine, onDiscard,
    selectedLines, setSelectedLines,
  };
}
