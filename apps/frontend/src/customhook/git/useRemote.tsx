import { useState, useCallback, useEffect } from 'react';
import { addRemoteImpl, deleteRemoteImpl, editRemoteImpl, fetchRemotesImpl } from '../../services/GitManagerService';
import { showToast } from '../../utils/notifyStore';
import { useRemoteContext } from '../../context/RemoteContext';

export type Remote = { id: string; name: string; url: string, path: string };

export function useRemotes(initial: Remote[] = []) {
  const [remotes, setRemotes] = useState<Remote[]>(initial);
  const { selectedRemote, setSelectedRemote } = useRemoteContext();
  // 초기 로드 시 remotes가 비어있을 경우 기본값 설정
  useEffect(() => {
    const fetchRemotes = async () => {
      const remotes = await fetchRemotesImpl();
      setRemotes(remotes);
    }
    fetchRemotes();
  }, []);

  const addRemote = useCallback(async (remote: Remote) => {
    try {
      if (remotes.some(r => r.name === remote.name || r.url === remote.url)) {
        alert('이미 존재하는 원격 저장소입니다.');
        return;
      }
      const result = await addRemoteImpl(remote);
      if (result) {
        setRemotes(prev => [...prev, remote]);
      }
    } catch (error) {
      showToast('원격 저장소 추가에 실패했습니다.', 'error');
    }
  }, []);
  const editRemote = useCallback(async (remote: Remote) => {
    try {
      const result = await editRemoteImpl(remote);
      if (result) {
        setRemotes(prev => prev.map(r => r.id === remote.id ? remote : r));
      }
    } catch (error) {
      showToast('원격 저장소 수정에 실패했습니다.', 'error');
    }
  }, []);
  const removeRemote = useCallback(async (remote: Remote) => {
    try {
      await deleteRemoteImpl(remote);
      setRemotes(prev => prev.filter(r => r.id !== remote.id));
    } catch (error) {
      showToast('원격 저장소 삭제에 실패했습니다.', 'error');
    }
  }, []);

  const selectRemote = useCallback(async (remote: Remote): Promise<boolean> => {
    setSelectedRemote(remote);    
    return true;
  }, []);


  return { remotes, addRemote, editRemote, removeRemote, setRemotes, selectedRemote, setSelectedRemote, selectRemote };
}
