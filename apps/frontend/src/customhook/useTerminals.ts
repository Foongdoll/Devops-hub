import { useState, useEffect, useCallback, useRef } from 'react';
import * as TerminalService from '../services/TerminalService';
import type { Session } from '../services/TerminalService';
import { useGlobalUI } from '../context/GlobalUIContext';
import { Terminal as XTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

export function useTerminals({ handleRefresh }: { handleRefresh?: () => void } = {}) {
  const { setLoading, setError } = useGlobalUI();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [isActiveStatus, setIsActiveStatus] = useState<string[]>([]);

  // Refs
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef<string>('');
  const lastOutputRef = useRef<string>('');

  // 2. Xterm.js 인스턴스 생성 및 해제
  useEffect(() => {
    if (!selectedId || !terminalContainerRef.current) return;

    // 기존 터미널 정리
    xtermRef.current?.dispose();
    fitAddonRef.current = null;

    // 새 인스턴스 생성
    const xterm = new XTerminal({ convertEol: true, cursorBlink: true });
    const fit = new FitAddon();
    xterm.loadAddon(fit);

    xterm.open(terminalContainerRef.current);
    xtermRef.current = xterm;
    fitAddonRef.current = fit;

    // 중요: 터미널이 DOM에 마운트된 후 fit() 호출
    // requestAnimationFrame을 사용하여 DOM 업데이트 후 실행되도록 보장
    requestAnimationFrame(() => {
      fit.fit();
    });

    // 윈도우 크기 변경 시 터미널 크기 조정
    const handleResize = () => {
      fit.fit();
    };
    window.addEventListener('resize', handleResize);

    // 키 입력 이벤트
    xterm.onData(data => {
      // SSH에 1글자씩 전송
      send(data);
      if(data === '\r') {
        handleRefresh?.();
      }     
    });

    return () => {
      xterm.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      lastOutputRef.current = '';
      inputBufferRef.current = '';
      window.removeEventListener('resize', handleResize); // 이벤트 리스너 정리
    };
  }, [selectedId, terminalContainerRef]);

  // 4. 세션 생성 핸들러
  const handleCreate = async (data: Omit<Session, 'id' | 'status'>) => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      ...data,
      status: 'idle',
    };
    await create(newSession);
    setSessions(prev => [...prev, newSession]);
    setSelectedId(newSession.id);
  };

  // 5. 세션 삭제 핸들러
  const handleDelete = (id: string) => {
    remove(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (id === selectedId && sessions.length > 1) {
      const next = sessions.find(s => s.id !== id)!;
      setSelectedId(next.id);
    }
  };



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
      if (res) {
        setSessions(prev => [...prev, res]);
        setSelectedId(res.id);
      }
    } catch (e: any) {
      setError(e.message || '세션 생성 실패');
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
    setError(null);

    const onOutput = (chunk: string) => {
      const term = xtermRef.current;
      if (term) {
        setIsActiveStatus(prev => [...prev, selectedId]);
        term.write(chunk.replace(/\n/g, '\r\n'));
      }
    };
    const onError = (msg: string) => setError(msg);

    TerminalService.connectSession(selectedId, onOutput, onError);
    return () => {
      TerminalService.disconnectSession();
    };
  }, [selectedId]);

  const send = (inputStr: string) => {
    TerminalService.sendInput(inputStr);

    const trimmed = inputStr.trim();
    if (trimmed === "exit" || trimmed === "quit") {
      setSelectedId(null);
      TerminalService.disconnectSession();
    }
  };

  return {
    sessions,
    selectedId,
    setSelectedId,
    output,
    create,
    remove,
    send,
    setSessions,
    setInput,
    input,
    handleDelete,
    handleCreate,
    terminalContainerRef,
    isActiveStatus
  };
}
