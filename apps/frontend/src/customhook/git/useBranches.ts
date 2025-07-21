import { useState, useCallback } from 'react';
import type { Remote } from './useRemote';
import { fetchBranchesImpl } from '../../services/GitManagerService';
import { useRemoteContext } from '../../context/RemoteContext';
export type Branch = { name: string; current?: boolean; fullname?: string };
export type TrackingBranch = { local: string; remote: string; ahead?: number; behind?: number };

export function useBranches() {
  const {setLocalBranches, setRemoteBranches, setTrackingBranches} = useRemoteContext();
  
  const fetchBranches = useCallback( async (remote: Remote) => {
    const result = await fetchBranchesImpl(remote) as { local: Branch[], remote: Branch[], tracking: TrackingBranch[] };
    if (!result) return false;
    
    setLocalBranches(result.local);
    setRemoteBranches(result.remote);
    setTrackingBranches(result.tracking);
    
    return true;
  }, []);
  return {
    // 브랜치 설정
    fetchBranches
  };
}
