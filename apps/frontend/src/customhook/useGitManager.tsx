import { useRemotes, type Remote } from '../customhook/git/useRemote';
import { useChanges } from '../customhook/git/useChanges';
import { useBranches } from '../customhook/git/useBranches';
import { useStash } from '../customhook/git/useStash';
import { useTopActionBar } from '../customhook/git/useTopActionBar';
import { useEffect, useState } from 'react';
import { useCommitHistory } from './git/useCommitHistory';
import { useGitSocket } from '../context/GitSocketContext';
import { useRemoteContext } from '../context/RemoteContext';
import { showToast } from '../utils/notifyStore';

export type tabType = 'history' | 'remotes' | 'changes' | 'branches' | 'stash';
export const fetchCounts = (remote: Remote | null, remoteBranch: string) => {
  const { emit } = useGitSocket();
  emit('fetch_pull_request_count', { remote: remote, remoteBranch: remoteBranch });
  emit('fetch_commit_count', { remote: remote, remoteBranch: remoteBranch });
}


export const useGitManager = () => {
  const remotes = useRemotes();
  const changes = useChanges();
  const branches = useBranches();
  const stash = useStash();
  const actions = useTopActionBar();
  const commitHistory = useCommitHistory();

  const [tab, setTab] = useState<tabType>('remotes');
  const { on, off } = useGitSocket();
  const { setPushCount, setPullCount, selectedRemote} = useRemoteContext();
  const { emit } = useGitSocket();
  useEffect(() => {
        
    const connect_git_response = (data: { success: boolean, message: string}) => {
      if (data.success) {
        showToast(data.message, 'success');
      } else {
        showToast(data.message, 'error');
      }
    }

    const git_notify = (data: { message: string, type: string, remote: Remote }) => {
      showToast(data.message, 'info');
      
      switch (data.type) {
        case 'pull':
          
          break;        
        case 'push':
          emit('fetch_pull_request_count', { remote: data.remote, remoteBranch: '' });
          break;
        case 'commit':
          emit('fetch_commit_count', { remote: data.remote, remoteBranch: '' });
          break;
      }
      
    }
    
    on('connect_git_response', connect_git_response);
    on('git_notify', git_notify)
    return () => {
      off('fetch_commit_count_response');
      off('fetch_pull_request_count_response');
      off('connect_git_response');
    }
  }, [selectedRemote])

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
