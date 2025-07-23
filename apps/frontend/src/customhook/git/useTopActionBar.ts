import { useCallback, useEffect } from 'react';
import type { Remote } from './useRemote';
import { useGitSocket } from '../../context/GitSocketContext';
import { showToast } from '../../utils/notifyStore';
import { useRemoteContext } from '../../context/RemoteContext';

export function useTopActionBar() {
  const { emit, on, off } = useGitSocket();
  const { selectedRemote } = useRemoteContext();

  const push = useCallback((remote: Remote | null, remoteBranch: string) => {
    emit('git_push', { remote, remoteBranch });
    emit('fetch_pull_request_count', { remote: remote, remoteBranch: remoteBranch });
    emit('fetch_commit_count', { remote: remote, remoteBranch: remoteBranch });
  }, [selectedRemote]);

  const pull = useCallback((remote: Remote | null, remoteBranch: string) => {
    emit('git_pull', { remote, remoteBranch });
  }, [selectedRemote]);

  const fetch = useCallback(() => { /* fetch 로직 */ }, []);
  const stash = useCallback(() => { /* stash 생성 로직 */ }, []);

  useEffect(() => {
    const git_push_response = (response: {
      success: boolean,
      message: string,
      remote: Remote,
      remoteBranch: string
    }) => {
      if (response.success) {
        showToast('Push successful', 'success');
      } else {
        showToast('Push failed: ' + response.message, 'error');
      }

      emit('fetch_pull_request_count', { remote: response.remote, remoteBranch: response.remoteBranch });
      emit('fetch_commit_count', { remote: response.remote, remoteBranch: response.remoteBranch });
    }

    const git_pull_response = (response: {
      success: boolean,
      message: string,
      remote: Remote,
      remoteBranch: string
    }) => {
      if (response.success) {
        showToast('Pull successful:', 'success');
      } else {
        showToast('Pull failed: ' + response.message, 'error');
      }
      emit('fetch_pull_request_count', { remote: response.remote, remoteBranch: response.remoteBranch });
      emit('fetch_commit_count', { remote: response.remote, remoteBranch: response.remoteBranch });
    }

    on('git_push_response', git_push_response);
    on('git_pull_response', git_pull_response);
    on('fetch', fetch);
    on('stash', stash);

    return () => {
      off('git_push_response', push);
      off('git_pull_response', pull);
      off('fetch', fetch);
      off('stash', stash);
    };
  }, [selectedRemote]);


  return { push, pull, fetch, stash };
}
