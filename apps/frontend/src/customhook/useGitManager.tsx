import { useRemotes, type Remote } from '../customhook/git/useRemote';
import { useChanges } from '../customhook/git/useChanges';
import { useBranches } from '../customhook/git/useBranches';
import { useStash } from '../customhook/git/useStash';
import { useTopActionBar } from '../customhook/git/useTopActionBar';
import { useState } from 'react';
import { useCommitHistory } from './git/useCommitHistory';

export const useGitManager = () => {
  const remotes = useRemotes();
  const changes = useChanges();
  const branches = useBranches();
  const stash = useStash();
  const actions = useTopActionBar();
  const commitHistory = useCommitHistory([
    { hash: "abcd1234", message: "feat: 최초 커밋", author: "신현우", date: "2025-07-20", branches: ["main"] },
  ]);
  



  const [tab, setTab] = useState<'history' | 'remotes' | 'changes' | 'branches' | 'stash'>('remotes');  

  return {
    tab, setTab,
    ...remotes,
    ...changes,
    ...branches,
    ...stash,
    ...actions,
    ...commitHistory,
  };
};
