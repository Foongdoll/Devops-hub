import { useState, useEffect, useCallback, useRef } from 'react';
import * as TerminalService from '../services/TerminalService';
import type { Session } from '../services/TerminalService';
import { useGlobalUI } from '../context/GlobalUIContext';
import { Terminal as XTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useSocket } from '../context/SocketContext';

export function useTerminals() {
  const { setLoading, setError } = useGlobalUI();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');
  const [input, setInput] = useState<string>('');

  // Refs
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef<string>('');
  const lastOutputRef = useRef<string>('');

  const [cwd, setCwd] = useState<string>('/');        // ① cwd 상태 추가
  const { socket } = useSocket();                     // 소켓 컨텍스트

  useEffect(() => {
    if (!socket) return;
    const onPwd = (path: string) => setCwd(path);
    socket.on('sftp-pwd', onPwd);
    return () => { socket.off('sftp-pwd', onPwd); };
  }, [socket]);


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

    // 키 입력 이벤트
    xterm.onData(data => {
      send(data);
    });

    return () => {
      xterm.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      lastOutputRef.current = '';
      inputBufferRef.current = '';
    };
  }, [selectedId]);

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
      console.log('Session created:', res);
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
    cwd
  };
}
