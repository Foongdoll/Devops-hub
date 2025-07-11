import { useState } from 'react';
import { Server, PlusCircle, Trash2, Link2, Terminal as TerminalIcon } from 'lucide-react';
import NewSessionModal from '../components/NewSessionModal';

type SessionType = 'SSH' | 'FTP' | 'SFTP';
interface Session {
  id: number;
  label: string;
  type: SessionType;
  host: string;
  port: number;
  username: string;
  status: 'connected' | 'idle';
}

export default function Terminals() {
  // 모킹 세션 데이터
  const [sessions, setSessions] = useState<Session[]>([
    { id: 1, label: 'Dev 서버 SSH',   type: 'SSH',  host: 'dev.example.com',    port: 22,   username: 'ubuntu', status: 'connected' },
    { id: 2, label: '파일서버 SFTP', type: 'SFTP', host: 'files.example.com',  port: 22,   username: 'root',   status: 'idle' },
    { id: 3, label: '외부 FTP',      type: 'FTP',  host: 'ftp.backup.co.kr',  port: 21,   username: 'ftpuser',status: 'idle' },
  ]);
  const [selectedId, setSelectedId] = useState<number>(sessions[0].id);
  const [isModalOpen, setModalOpen] = useState(false);

  const active = sessions.find(s => s.id === selectedId);

  const handleCreate = async (data: Omit<Session, 'id' | 'status'>) => {
    // TODO: service 호출해서 백엔드에 저장
    const newSession: Session = {
      id: Date.now(),
      ...data,
      status: 'idle'
    };
    setSessions(prev => [...prev, newSession]);
    setSelectedId(newSession.id);
  };

  const handleDelete = (id: number) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (id === selectedId && sessions.length > 1) {
      const next = sessions.find(s => s.id !== id)!;
      setSelectedId(next.id);
    }
  };

  return (
    <div className="flex h-full min-h-screen">
      {/* ───────────────────── 왼쪽: 세션 리스트 ───────────────────── */}
      <aside className="w-72 bg-[#322446] text-white flex flex-col py-6 px-4 border-r border-[#463064]">
        <div className="flex items-center mb-5 text-xl font-bold">
          <TerminalIcon className="w-6 h-6 mr-2 text-[#a084ee]" />
          내 세션
          <button
            className="ml-auto hover:scale-110 transition"
            onClick={() => setModalOpen(true)}
            aria-label="새 세션 추가"
          >
            <PlusCircle className="w-5 h-5 text-[#a084ee]" />
          </button>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto">
          {sessions.map(s => (
            <div
              key={s.id}
              className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition
                ${selectedId === s.id
                  ? 'bg-[#a084ee]/20 font-semibold'
                  : 'hover:bg-[#a084ee]/10'}
              `}
              onClick={() => setSelectedId(s.id)}
            >
              <Server className="w-5 h-5 mr-3 text-gray-300" />
              <div className="flex-1 text-sm">
                <div className="flex items-center">
                  <span>{s.label}</span>
                  <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded text-[#a084ee]">
                    {s.type}
                  </span>
                </div>
                <div className="text-gray-400">{s.username}@{s.host}:{s.port}</div>
              </div>
              <Trash2
                className="w-4 h-4 opacity-50 hover:opacity-100 transition"
                onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
              />
            </div>
          ))}
        </nav>
      </aside>

      {/* ───────────────────── 오른쪽: 터미널 화면 ───────────────────── */}
      <main className="flex-1 flex flex-col">
        <div className="p-6 border-b bg-white flex items-center shadow-sm">
          {active ? (
            <>
              <span className="text-lg font-bold text-[#7e4cff] mr-4">{active.label}</span>
              <span className="text-sm text-gray-500">
                {active.type} | {active.username}@{active.host}:{active.port}
              </span>
              <span className={`ml-4 px-2 py-0.5 rounded-full text-xs font-semibold
                ${active.status === 'connected'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'}
              `}>
                {active.status === 'connected' ? '접속됨' : '대기 중'}
              </span>
              <button
                className="ml-auto px-3 py-1 bg-[#7e4cff] text-white rounded transition hover:bg-[#6e70f2] flex items-center text-sm"
              >
                <Link2 className="w-4 h-4 mr-1" />
                다시 연결
              </button>
            </>
          ) : (
            <span className="text-gray-400">세션을 선택하세요.</span>
          )}
        </div>
        <div className="flex-1 bg-[#202035]/10 flex items-center justify-center">
          {active ? (
            <div className="w-full max-w-3xl h-full bg-[#181927] rounded-lg shadow-inner overflow-auto">
              {/* TODO: xterm.js 터미널이 여기 렌더됩니다 */}
              <div className="p-4 text-gray-400 text-sm">
                터미널 세션 준비 중...
              </div>
            </div>
          ) : (
            <div className="text-gray-400">왼쪽에서 세션을 선택해주세요.</div>
          )}
        </div>
      </main>

      {/* ───────────────────── 새 세션 모달 ───────────────────── */}
      <NewSessionModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
