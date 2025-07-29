import { useCallback, useEffect } from 'react';
import type { Remote } from './useRemote';
import { useGitSocket } from '../../context/GitSocketContext';
import { hideLoading, showLoading, showToast } from '../../utils/notifyStore';
import { useRemoteContext } from '../../context/RemoteContext';

export function useTopActionBar() {
  const { emit, on, off } = useGitSocket();
  const { selectedRemote, remoteBranches } = useRemoteContext();

  const push = useCallback((remote: Remote | null, remoteBranch: string) => {
    showLoading({ message: 'Pushing changes...' });
    emit('git_push', { remote, remoteBranch });
  }, [selectedRemote]);

  const pull = useCallback((remote: Remote | null, remoteBranch: string) => {
    showLoading({ message: 'Pulling changes...' });
    emit('git_pull', { remote, remoteBranch });
  }, [selectedRemote]);

  const fetch = useCallback((remote: Remote | null) => {
    emit("git_fetch", { remote });
  }, []);
  const reset = useCallback((remote: Remote | null, option: string, commits: string[], remoteBranch: string) => {
    emit('git_reset', {
      remote: remote,
      option, // soft | mixed | hard
      commits,
      remoteBranch
    });
  }, []);

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
      hideLoading();
      emit('fetch_commit_count', { remote: response.remote, remoteBranch: response.remoteBranch });
      // emit && fetchCounts(emit, response.remote, response.remoteBranch);    
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
      hideLoading();
      emit('fetch_pull_request_count', { remote: response.remote, remoteBranch: response.remoteBranch });
    }

    const git_reset_response = (response: {
      success: boolean,
      message: string,
      remoteBranch: string,
    }) => {

      console.log(response);
      showToast(response.message, response.success ? "success" : "error");
      if (response.success) {
        emit("fetch_changed_files", { remote: selectedRemote });
        emit("fetch_change_count", { remote: selectedRemote });
        emit("fetch_commit_count", { remote: selectedRemote, remoteBranch: response.remoteBranch })
      }

    }

    on('git_reset_response', git_reset_response)
    on('git_push_response', git_push_response);
    on('git_pull_response', git_pull_response);
    on('fetch', fetch);
    on('stash', reset);

    return () => {
      off('git_push_response', push);
      off('git_pull_response', pull);
      off('fetch', fetch);
      off('stash', reset);
    };
  }, [selectedRemote]);


  return { push, pull, fetch, reset };
}
