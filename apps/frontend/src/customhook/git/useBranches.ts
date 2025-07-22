import { useState, useCallback, useEffect } from 'react';
import type { Remote } from './useRemote';
import { fetchBranchesImpl } from '../../services/GitManagerService';
import { useRemoteContext } from '../../context/RemoteContext';
import { useGlobalUI } from '../../context/GlobalUIContext';
import { useGitSocket } from '../../context/GitSocketContext';
import { showToast } from '../../utils/notifyStore';
export type Branch = { name: string; current?: boolean; fullname?: string };
export type TrackingBranch = { local: string; remote: string; ahead?: number; behind?: number };

export function useBranches() {
  const { setLocalBranches, setRemoteBranches, setSelectedLocalBranch, setSelectedRemoteBranch } = useRemoteContext();  
  const { emit, on, off } = useGitSocket();
  const { selectedRemote } = useRemoteContext();
  const fetchBranches = useCallback(async (remote: Remote) => {
    const result = await fetchBranchesImpl(remote) as { local: Branch[], remote: Branch[], tracking: TrackingBranch[] };
    if (!result) return false;

    setLocalBranches(result.local);
    setRemoteBranches(result.remote);
    setSelectedLocalBranch(result.local.find(b => b.current)?.name || '');    
    setSelectedRemoteBranch(result.remote.find(b => b.current)?.name || '');
    
    return true;
  }, []);

  const selecteLocalBranch = useCallback(async (branch: string) => {
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
    if (!selectedRemote) return;

    emit('checkout_local_branch', { branch, selectedRemoteBranch: '', selectedRemote });
    setSelectedLocalBranch(branch);
  }, []);

  const selecteRemoteBranch = useCallback((branch: string) => {
    // 요청 보내서 checkout 진행해야하고 -vv 로 브랜치 정보 최신화 해줘야함
    setSelectedRemoteBranch(branch);
  }, []);


  useEffect(() => {
    on('checkout_local_branch_response', (data: { success: boolean; message: string }) => {

    })


    return () => {
      off('checkout_local_branch_response');
    }
  }, []);



  return {
    // 브랜치 설정
    fetchBranches,
    selecteLocalBranch,
    selecteRemoteBranch
  };
}
