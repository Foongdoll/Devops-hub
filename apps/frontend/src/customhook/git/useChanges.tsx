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

  const { selectedRemoteBranch, selectedRemote, setConflictModalOpen } = useRemoteContext();
  const { emit, on, off } = useGitSocket();

  // 선택된 줄 번호 관리 (변경 사항에서)
  const [selectedLines, setSelectedLines] = useState<number[]>([]);

  const [socketResponse, setSocketResponse] = useState<boolean>(false);



  // 파일 배열로 받고 서버에서 처리
  // 파일 스테이징/언스테이징
  const stageFile = useCallback((remote: Remote, files: File[]) => {
    showLoading({ message: '파일 스테이징 중...' });
    emit('git_stage_unstage_toggle', { remote, files: files, staged: true });

    // setUnstagedFiles(prev => prev.filter(f => f.path !== file.path));
    // setStagedFiles(prev => [...prev, file]);
    // setSelectedFile(file);
  }, [selectedRemote]);

  const unstageFile = useCallback((remote: Remote, files: File[]) => {
    showLoading({ message: '파일 언스테이징 중...' });
    emit('git_stage_unstage_toggle', { remote, files: files, staged: false });
    // setStagedFiles(prev => prev.filter(f => f.path !== file.path));
    // setUnstagedFiles(prev => [...prev, file]);
    // setSelectedFile(file);
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
  const commit = useCallback((remote: Remote, isPush: boolean) => {
    if (stagedFiles.length && commitMsg.trim()) {
      setStagedFiles([]);
      setCommitMsg('');
    }
    showLoading({ message: '커밋 진행 중...' });
    emit('git_commit', { remote: remote, files: stagedFiles, message: commitMsg, remoteBranch: selectedRemoteBranch, isPush: isPush });

  }, [stagedFiles, commitMsg]);

  // 변경 사항 조회
  const fetchChanges = async (remote: Remote) => {
    setStagedFiles([]);
    setUnstagedFiles([]);
    setFileDiff('');
    emit('fetch_changed_files', { remote: remote });
  }

  // 선택
  const handleToggleLine = (lineNumber: number) => {
    setSelectedLines((prev) =>
      prev.includes(lineNumber)
        ? prev.filter(idx => idx !== lineNumber)
        : [...prev, lineNumber]
    );
  };


  // lines가 없으면 전체, 있으면 부분 discard
  const onDiscard = (remote: Remote, file: File, lines?: number[]) => {
    if (!lines) {
      // 전체 discard 처리 (예: 서버/소켓 emit 등)
      emit('discard_all', { remote: remote, filePath: file.path });
    } else {
      // 선택 줄만 discard (예: 서버/소켓 emit 등)
      emit('discard_lines', { remote: remote, filePath: file.path, lines });
    }
  };


  // 로컬 브랜치 체크아웃 중 충돌 난 파일 커밋, 푸시 처리
  const onCheckoutRemoteBranch = (remote: Remote, conflictFiles: File[], isPush: boolean, remoteBranch: string) => {
    showLoading({ message: '충돌 파일들 커밋 중...' });
    emit('git_commit', {
      remote,
      files: conflictFiles,
      message: "Conflict files commit : " + conflictFiles.map(e => e.name).join(', '),
      isPush,
      remoteBranch
    })

  };

  // 로컬 브랜치 체크아웃 중 충돌 난 파일들 버림 처리
  const onCheckoutConflictFilesDiscard = useCallback((remote: Remote, conflictFiles: File[]) => {
    showLoading({ message: '파일 버림 중...' });
    emit('discard_file', { remote: remote, files: conflictFiles });
  }, []);



  useEffect(() => {
    // 변경 파일 리스트 조회
    on('fetch_changed_files_response', (data: { resultFiles: File[], discard?: boolean }) => {
      if (data.resultFiles) {
        console.log(data.resultFiles);
        const staged: File[] = [];
        const unstaged: File[] = [];
        data.resultFiles.forEach(file => {
          if (file.staged) {
            staged.push(file);
          } else {
            unstaged.push(file);
          }
        });


        setStagedFiles(staged);
        setUnstagedFiles(unstaged);

        emit('fetch_change_count', { remote: selectedRemote });
        if (!data.discard) {
          setFileDiff('');
        }
      }
    });

    // 파일 diff 조회
    on('fetch_file_diff_response', (diff: string) => {
      setFileDiff(diff);
    });

    on('git_commit_response', async (response: {
      success: boolean,
      message: string,
      remote: Remote,
      remoteBranch: string
    }) => {

      try {
        await delay(1000);
        hideLoading();
        if (response.success) {
          showToast('커밋이 성공적으로 완료되었습니다.', 'success');
          setStagedFiles([]);
          setCommitMsg('');
          setSocketResponse(true);
        } else {
          showToast('커밋이 실패하였습니다.', 'error');
          setSocketResponse(false);
        }
      } catch (error: any) {
        showToast(error.message, 'error');
      } finally {
        emit('fetch_changed_files', { remote: response.remote });
        emit('fetch_commit_count', { remote: response.remote, remoteBranch: response.remoteBranch });
        emit('fetch_pull_request_count', { remote: response.remote, remoteBranch: response.remoteBranch });
      }
    });


    on(
      'fetch_conflict_file_diff_response',
      async (data: { conflictBranch: string; left: string; right: string; message?: string }) => {
        if (!data) return;
        setLeft(data.left);
        setRight(data.right);
        data.message && showToast(data.message, 'error');
      }
    );


    on('checkout_remote_branch_response', (data: { success: boolean, message: string, branch: string, conflictFiles: string[], remote?: Remote }) => {
      if (data.success) {
        showToast('원격 브랜치 변경 성공', 'success');
        emit('fetch_changed_files', { remote: data.remote });
        setSelectedFile(null);
        setConflictModalOpen(false);
      } else {
        showToast(`${data.message}`, 'error');
        setConflictModalOpen(false);
      }
    });

    on('discard_file_response', async (data: { success: boolean, message: string, files: [] }) => {
      await delay(500);
      hideLoading();
      if (data.success) {
        showToast('파일이 성공적으로 버려졌습니다.', 'success');
        setSocketResponse(true);

      } else {
        showToast(`파일 버리기 실패: ${data.message}`, 'error');
        setSocketResponse(false);
      }
      emit('fetch_changed_files', { remote: selectedRemote });
    });

    on('discard_all_response', async (data: { success: boolean, filePath: string, error?: string }) => {
      await delay(500);
      hideLoading();
      if (data.success) {
        showToast(`파일 ${data.filePath}이 성공적으로 버려졌습니다.`, 'success');
        setSocketResponse(true);
      } else {
        showToast(`파일 ${data.filePath} 버리기 실패: ${data.error}`, 'error');
        setSocketResponse(false);
      }
      emit('fetch_changed_files', { remote: selectedRemote });
    });


    on('discard_lines_response', async (data: {
      success: boolean,
      message: string,
      remote: Remote,
      filePath: string,
      lines: number[]
    }) => {
      await delay(500);
      hideLoading();

      if (data.success) {
        showToast(`선택한 라인이 성공적으로 버려졌습니다.`, 'success');
        setSocketResponse(true);
        setSelectedLines([]);
        // ✅ 서버 동기화를 위한 최신 상태 요청
        emit('fetch_changed_files', { remote: data.remote, discard: true });
        emit('fetch_file_diff', {
          remote: data.remote,
          filePath: data.filePath,
          fileStaged: false
        });

      } else {
        showToast(`선택한 라인 버리기 실패: ${data.message}`, 'error');
        setSocketResponse(false);
      }
    });

    on('git_stage_unstage_toggle_response', (data: { success: boolean; message: string; files: File[]; staged: boolean }) => {
      hideLoading();

      if (data.success && Array.isArray(data.files)) {
        showToast(data.message ?? '성공', 'success');
        setSocketResponse(true);

        if (data.staged) {
          setStagedFiles(prev => {
            const newFiles = data.files.filter(f => f.path);
            // 중복 제거 (path 기준)
            const existingPaths = new Set(prev.map(f => f.path));
            const filteredNewFiles = newFiles.filter(f => !existingPaths.has(f.path));
            return [...prev, ...filteredNewFiles];
          });

          setUnstagedFiles(prev => prev.filter(f => !data.files.some(df => df.path === f.path)));
        } else {
          setUnstagedFiles(prev => {
            const newFiles = data.files.filter(f => f.path);
            const existingPaths = new Set(prev.map(f => f.path));
            const filteredNewFiles = newFiles.filter(f => !existingPaths.has(f.path));
            return [...prev, ...filteredNewFiles];
          });

          setStagedFiles(prev => prev.filter(f => !data.files.some(df => df.path === f.path)));
        }
      } else {
        showToast(`파일 스테이지/언스테이지 실패: ${data.message || '알 수 없는 오류'}`, 'error');
        setSocketResponse(false);
      }
    });




    return () => {
      off('fetch_changed_files_response');
      off('fetch_file_diff_response');
      off('fetch_conflict_file_diff_response');
      off('git_commit_response');
      off('checkout_remote_branch_response');
      off('discard_file_response');
      off('discard_all_response');
      off('discard_lines_response');
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

    // 체크 아웃 중 충돌난 파일들 커밋, 푸시
    onCheckoutRemoteBranch,
    // 체크 아웃 중 충돌난 파일들 버림
    onCheckoutConflictFilesDiscard,
    socketResponse, setSocketResponse
  };
}
