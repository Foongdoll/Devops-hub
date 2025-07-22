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

  const { selectedRemoteBranch } = useRemoteContext();
  const { emit, on, off } = useGitSocket();

  // 파일 스테이징/언스테이징
  const stageFile = useCallback((file: File) => {
    setUnstagedFiles(prev => prev.filter(f => f.path !== file.path));
    setStagedFiles(prev => [...prev, file]);
    setSelectedFile(file);
  }, []);
  const unstageFile = useCallback((file: File) => {
    setStagedFiles(prev => prev.filter(f => f.path !== file.path));
    setUnstagedFiles(prev => [...prev, file]);
    setSelectedFile(file);
  }, []);

  // 파일 선택
  const selectFile = useCallback((file: File, remote: Remote) => {
    emit('fetch_file_diff', { remote: remote, filePath: file.path, fileStaged: file.staged });

    setFileDiff('');
    setSelectedFile(file);
  }, []);

  // 커밋
  const commit = useCallback((remote: Remote) => {
    if (stagedFiles.length && commitMsg.trim()) {
      setStagedFiles([]);
      setCommitMsg('');
    }

    showLoading({ message: '커밋 진행 중...' });
    emit('commit_files', { remote: remote, files: stagedFiles, message: commitMsg, remoteBranch: selectedRemoteBranch });

  }, [stagedFiles, commitMsg]);


  const fetchChanges = async (remote: Remote) => {
    setStagedFiles([]);
    setUnstagedFiles([]);
    setFileDiff('');
    emit('fetch_changed_files', remote);
  }

  useEffect(() => {
    // 변경 파일 리스트 조회
    on('fetch_changed_files_response', (data: { status: string; path: string, staged: boolean }[]) => {
      if (data) {
        const staged: File[] = [];
        const unstaged: File[] = [];
        data.forEach(({ status, path, staged: isStaged }) => {
          const file = { status, path, name: path, staged: isStaged } as File;
          if (isStaged) staged.push(file);
          else unstaged.push(file);
        });
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
    return () => {
      off('fetch_changed_files_response');
      off('fetch_file_diff_response');
    }
  }, [])

  return {
    unstagedFiles, stagedFiles, selectedFile, fileDiff,
    stageFile, unstageFile, selectFile,
    commitMsg, setCommitMsg, commit,
    setUnstagedFiles, setStagedFiles,

    fetchChanges,
  };
}
