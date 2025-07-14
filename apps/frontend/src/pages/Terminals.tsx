import { useState } from 'react';
import { Server, PlusCircle, Trash2, Link2, Terminal as TerminalIcon, MenuIcon, ShieldCloseIcon } from 'lucide-react';
import NewSessionModal from '../components/NewSessionModal';
import { useTerminals } from '../customhook/useTerminals';
import 'xterm/css/xterm.css';
import { SftpFileTree } from '../components/SftpFileTree';


export default function Terminals() {
  const {
    sessions,
    selectedId,
    setSelectedId,
    send,
    handleDelete,
    handleCreate,
    terminalContainerRef,
    cwd
  } = useTerminals();

  const [sessionOpen, setSessionOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const active = sessions.find(s => s.id === selectedId);


  return (
    <div className="flex h-full min-h-screen">
      {/* 1) 모바일 오버레이: 사이드바 열림 시 */}
      {sessionOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSessionOpen(false)}
        />
      )}

      {/* 2) 왼쪽: 세션 리스트 사이드바 */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-72 bg-[#322446] text-white
          transform transition-transform duration-200
          ${sessionOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:block
        `}
      >
        {/* 모바일에서만 보이는 닫기 버튼 */}
        <div className="md:hidden flex justify-end p-2">
          <button onClick={() => setSessionOpen(false)}>
            <ShieldCloseIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* 세션 리스트 헤더 */}
        <div className="flex items-center px-4 py-5 text-xl font-bold border-b border-[#463064]">
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

        {/* 세션 리스트 네비게이션 */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => {
                setSelectedId(s.id);
                setSessionOpen(false);
              }}
              className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition
                ${selectedId === s.id
                  ? 'bg-[#a084ee]/20 font-semibold'
                  : 'hover:bg-[#a084ee]/10'}
              `}
            >
              <Server className="w-5 h-5 mr-3 text-gray-300" />
              <div className="flex-1 text-sm">
                <div className="flex items-center">
                  <span>{s.label}</span>
                  <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded text-[#a084ee]">
                    {s.type}
                  </span>
                </div>
                <div className="text-gray-400">
                  {s.username}@{s.host}:{s.port}
                </div>
              </div>
              <Trash2
                className="w-4 h-4 opacity-50 hover:opacity-100 transition"
                onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
              />
            </div>
          ))}
        </nav>
      </aside>

      {/* 3) 오른쪽: 터미널 화면 (페이지 본문) */}
      <main className="flex-1 flex flex-col">
        {/* 모바일에서만 보이는 햄버거 버튼 */}
        <div className="md:hidden flex items-center px-4 py-2 bg-white border-b">
          <button onClick={() => setSessionOpen(true)}>
            <MenuIcon className="w-6 h-6 text-gray-600" />
          </button>
          <span className="ml-4 font-semibold">내 세션</span>
        </div>

        {/* 터미널 헤더 */}
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
                  : 'bg-gray-200 text-gray-600'}`}
              >
                {active.status === 'connected' ? '접속됨' : '대기 중'}
              </span>
              <button
                onClick={() => active && send('\n')}
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

        {/* 터미널 본문 */}
        <div className="flex-1 bg-[#1a1a2e] p-4 flex">
          {selectedId ? (
            <>
              {/* 왼쪽: SFTP 디렉토리 트리 (고정폭) */}
              <div className="w-64 mr-4">
                <SftpFileTree basePath={cwd} />
              </div>

              {/* 오른쪽: xterm.js 터미널 */}
              <div
                ref={terminalContainerRef}
                className="flex-1 h-full min-h-[300px] bg-[#181927] rounded-lg overflow-hidden"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              왼쪽에서 세션을 선택해주세요.
            </div>
          )}
        </div>
      </main>

      {/* 4) 새 세션 모달 */}
      <NewSessionModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}