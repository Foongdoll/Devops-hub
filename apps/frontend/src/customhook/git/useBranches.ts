import { useState, useCallback, useEffect } from 'react';
import type { Remote } from './useRemote';
import { fetchBranchesImpl } from '../../services/GitManagerService';
import { useRemoteContext } from '../../context/RemoteContext';
import { useGitSocket } from '../../context/GitSocketContext';
import { showToast } from '../../utils/notifyStore';
import type { File } from './useChanges';
export type Branch = { name: string; current?: boolean; fullname?: string };
export type TrackingBranch = { local: string; remote: string; ahead?: number; behind?: number };

export function useBranches() {
  const { setLocalBranches, setRemoteBranches, setSelectedLocalBranch, setSelectedRemoteBranch, setConflictModalOpen, selectedRemote, conflictModalOpen } = useRemoteContext();
  const { emit, on, off } = useGitSocket();
  const [conflictFiles, setConflictFiles] = useState<File[]>([]);
  const [conflictBranch, setConflictBranch] = useState<string>('');
  

  const fetchBranches = useCallback(async (remote: Remote) => {
    const result = await fetchBranchesImpl(remote) as { local: Branch[], remote: Branch[], tracking: TrackingBranch[] };
    if (!result) return false;

    setLocalBranches(result.local);
    setRemoteBranches(result.remote);
    setSelectedLocalBranch(result.local.find(b => b.current)?.name || '');
    setSelectedRemoteBranch(result.remote.find(b => b.current)?.name || '');
    emit('connect_git', { remote: remote })        
    emit('fetch_changed_files', { remote: remote });
    emit('fetch_commit_count', { remote: remote, remoteBranch: result.remote.find(b => b.current)?.name || '' });
    emit('fetch_pull_request_count', { remote: remote, remoteBranch: result.remote.find(b => b.current)?.name || '' });
    return true;
  }, [selectedRemote]);

  const selecteLocalBranch = useCallback(async (branch: string, remote: Remote) => {
    if (branch === '') {
      showToast('브랜치를 선택해주세요.', 'error');
      return;
    }

    // // 요청 보내서 checkout 진행해야하고 -vv 로 브랜치 정보 최신화 해줘야함    
    // const result = await showConfirm('로컬 브랜치 경고', `로컬 브랜치가 달라지면 현재 작업 중인 내용이 사라지거나 충돌이 발생할 수 있습니다. 
    //   정말 ${branch}로 변경하시겠습니까?\n\n로컬 브랜치 변경 후 추적할 원격 리모트 브랜치를 선택해야 합니다.`,
    //   { select: true, data: remoteBranches.map(b => b.name) }
    // )

    // if (!result[0] || !result[1]) return;
    if (!remote) return;

    emit('checkout_local_branch', { branch, selectedRemoteBranch: '', remote });    
  }, []);

  const selectRemoteBranch = useCallback((branch: string) => {
    // 요청 보내서 checkout 진행해야하고 -vv 로 브랜치 정보 최신화 해줘야함
    setSelectedRemoteBranch(branch);
  }, [selectedRemote]);


  useEffect(() => {
    on('checkout_local_branch_response', (data: { success: boolean; message: string, branch: string, conflictFiles: File[], remote? : Remote}) => {      
      if (data.success) {
        showToast('로컬 브랜치 변경 성공', 'success');
        setSelectedLocalBranch(data.branch);
        emit('fetch_changed_files', { remote: data.remote });
      } else {
        showToast(`${data.message}`, 'error');
        if (data.conflictFiles.length > 0) {
          setConflictFiles(data.conflictFiles);
          setConflictModalOpen(true);        
          setConflictBranch(data.branch);  
        }
      }
    })
    return () => {
      off('checkout_local_branch_response');
    }
  }, [conflictModalOpen]);



  return {
    // 브랜치 설정
    fetchBranches,
    selecteLocalBranch,
    selectRemoteBranch,

    // 충돌 관련
    conflictFiles,
    setConflictFiles,
    conflictBranch,
    setConflictBranch
  };
}
