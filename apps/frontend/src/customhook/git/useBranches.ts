import { useState, useCallback } from 'react';
export type Branch = { name: string; current?: boolean; fullname?: string };
export type TrackingBranch = { local: string; remote: string; ahead?: number; behind?: number };

export function useBranches(initialLocal: Branch[] = [], initialRemote: Branch[] = [], initialTracking: TrackingBranch[] = []) {
  const [localBranches, setLocalBranches] = useState<Branch[]>(initialLocal);
  const [remoteBranches, setRemoteBranches] = useState<Branch[]>(initialRemote);
  const [trackingBranches, setTrackingBranches] = useState<TrackingBranch[]>(initialTracking);

  const checkoutBranch = useCallback((branch: Branch) => {
    setLocalBranches(prev => prev.map(b => ({ ...b, current: b.name === branch.name })));
  }, []);
  const deleteBranch = useCallback((branch: Branch) => {
    setLocalBranches(prev => prev.filter(b => b.name !== branch.name));
  }, []);

  return {
    localBranches, remoteBranches, trackingBranches,
    checkoutBranch, deleteBranch,
    setLocalBranches, setRemoteBranches, setTrackingBranches,
  };
}
