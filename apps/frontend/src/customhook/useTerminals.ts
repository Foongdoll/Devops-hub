import { useState, useEffect, useCallback } from 'react';
import * as TerminalService from '../services/TerminalService';
import type { Session } from '../services/TerminalService';
import { useGlobalUI } from '../context/GlobalUIContext';

export function useTerminals() {
  const { setLoading, setError } = useGlobalUI();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');  

  // 1. 서버에서 세션 목록 불러오기
  const loadSessions = useCallback(async () => {
    try {
      const res = await TerminalService.fetchSessions() as any;
      if (res) {
        setSessions(res || []);
        if (!selectedId && res.data?.length) {
          setSelectedId(res.data[0].id);
        }
      }
    } catch (e: any) {
      setError(e.message || '세션 목록 로딩 실패');
    }
  }, [selectedId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // 2. 세션 생성
  const create = async (data: Omit<Session, 'id' | 'status'>) => {
    try {
      setLoading(true);
      // setError(null);
      const res = await TerminalService.createSession(data) as any;
      console.log('Session created:', res);
      if (res) {
        setSessions(prev => [...prev, res]);
        setSelectedId(res.data.id);
      }
    } catch (e: any) {      
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // 3. 세션 삭제
  const remove = async (id: string) => {
    try {
      await TerminalService.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selectedId === id) {
        const next = sessions.find(s => s.id !== id);
        setSelectedId(next?.id || null);
      }
    } catch (e: any) {
      setError(e.message || '세션 삭제 실패');
    }
  };

  // 4. 터미널 연결 / 입출력
  useEffect(() => {
    if (!selectedId) return;
    setOutput('');
    setError(null);

    const onOutput = (chunk: string) => {
      setOutput(prev => prev + chunk);
    };
    const onError = (msg: string) => {
      setError(msg);
    };

    TerminalService.connectSession(selectedId, onOutput, onError);

    return () => {
      TerminalService.disconnectSession();
    };
  }, [selectedId]);

  const send = (data: string) => {
    TerminalService.sendInput(data);
  };

  return {
    sessions,
    selectedId,
    setSelectedId,
    output,    
    create,
    remove,
    send,
    setSessions
  };
}
