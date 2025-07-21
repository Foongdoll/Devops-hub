import { useRemotes, type Remote } from '../customhook/git/useRemote';
import { useChanges } from '../customhook/git/useChanges';
import { useBranches } from '../customhook/git/useBranches';
import { useStash } from '../customhook/git/useStash';
import { useTopActionBar } from '../customhook/git/useTopActionBar';
import { useRef, useState } from 'react';
import { useCommitHistory } from './git/useCommitHistory';

export type tabType = 'history' | 'remotes' | 'changes' | 'branches' | 'stash';

export const useGitManager = () => {  
  const remotes = useRemotes();
  const changes = useChanges();
  const branches = useBranches();
  const stash = useStash();
  const actions = useTopActionBar();
  const commitHistory = useCommitHistory();

  const [tab, setTab] = useState<tabType>('remotes');  

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
