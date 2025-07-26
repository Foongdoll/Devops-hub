import { useState } from 'react';
import { Server, PlusCircle, Trash2, Link2, Terminal as TerminalIcon, Menu as MenuIcon, ShieldClose as ShieldCloseIcon, ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import NewSessionModal from '../components/NewSessionModal';
import { useTerminals } from '../customhook/useTerminals';
import 'xterm/css/xterm.css';
import { SftpFileManager } from '../components/SftpFileManager';
import { useSftp } from '../customhook/useSftp';
import { AnimatePresence, motion } from "framer-motion";

// 움직이는 배경
const AnimatedCircles = ({ count = 9 }) => {
  const circles = Array.from({ length: count }).map((_, i) => {
    const size = Math.random() * 150 + 120;
    const left = Math.random() * 90;
    const top = Math.random() * 85;
    const duration = Math.random() * 6 + 9;
    const delay = Math.random() * 8;
    const blur = Math.floor(Math.random() * 4) * 3;
    const colors = [
      ["#ede9fe", "#d1c4ff"],
      ["#d1e3ff", "#d1e5fc"],
      ["#fff7fa", "#c3aed6"],
      ["#c3aed6", "#f3e8ff"],
      ["#a1c4fd", "#f3e8ff"],
      ["#fcb7af", "#e8defa"]
    ];
    const grad = colors[i % colors.length];
    return (
      <div
        key={i}
        className="absolute rounded-full pointer-events-none will-change-transform"
        style={{
          width: size,
          height: size,
          left: `${left}%`,
          top: `${top}%`,
          filter: `blur(${blur}px)`,
          opacity: 0.18 + Math.random() * 0.15,
          background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
          animation: `float-term-${i} ${duration}s ease-in-out ${delay}s infinite alternate`,
          zIndex: 0,
        }}
      />
    );
  });

  if (typeof window !== "undefined" && !document.getElementById("term-bg-keyframes")) {
    let css = "";
    for (let i = 0; i < count; i++) {
      const x = Math.random() * 60 - 30;
      const y = Math.random() * 60 - 30;
      const scale = 1 + Math.random() * 0.25;
      css += `
        @keyframes float-term-${i} {
          0% { transform: translate(0,0) scale(1);}
          60% { transform: translate(${x / 2}px,${y / 2}px) scale(${(scale + 1) / 2});}
          100% { transform: translate(${x}px,${y}px) scale(${scale});}
        }
      `;
    }
    const style = document.createElement("style");
    style.id = "term-bg-keyframes";
    style.innerHTML = css;
    document.head.appendChild(style);
  }
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ zIndex: 0 }}>
      {circles}
    </div>
  );
};

const SessionSidebarToggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button
    className={`ml-3 w-10 h-6 flex items-center rounded-full p-1 transition 
      ${checked ? "bg-[#a084ee]/80" : "bg-gray-200"}
      border-2 border-[#ded4fc] shadow-sm
      focus:outline-none
    `}
    onClick={onChange}
    tabIndex={0}
    aria-label="사이드바 토글"
    type="button"
  >
    <span
      className={`block w-4 h-4 bg-white rounded-full shadow transform transition
        ${checked ? "translate-x-4" : ""}
      `}
      style={{ boxShadow: '0 2px 6px #7e4cff33' }}
    />
  </button>
);

// ⭐️ "Show Sidebar" 버튼
const SidebarShowButton = ({ onClick }) => (
  <motion.button
    onClick={onClick}
    initial={{ x: -40, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -40, opacity: 0 }}
    transition={{ type: "spring", stiffness: 180, damping: 18 }}
    className="fixed top-[60px] left-3 z-50 bg-[#7e4cff] hover:bg-[#6e70f2] text-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center transition"
    style={{ boxShadow: '0 2px 12px #a084ee44' }}
    aria-label="사이드바 열기"
  >
    <ArrowRightCircle className="w-7 h-7" />
  </motion.button>
);

export default function Terminals() {
  const sftp = useSftp();
  const { handleRefresh } = sftp;
  const {
    sessions,
    selectedId,
    setSelectedId,
    send,
    handleDelete,
    handleCreate,
    terminalContainerRef,
    isActiveStatus
  } = useTerminals({ handleRefresh });

  const [sessionOpen, setSessionOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const active = sessions.find(s => s.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-40px)] min-h-0 relative bg-gradient-to-br from-[#ede9fe] via-[#f3e8ff] to-[#fff7fa]">
      <AnimatedCircles count={11} />

      {/* 사이드바 (데스크탑 토글) & 모바일 오버레이 */}
      <AnimatePresence>
        {(showSidebar || sessionOpen) && (
          <motion.aside
            key="sidebar"
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -70, opacity: 0, transition: { duration: 0.26 } }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
            className={`
              fixed left-0 z-40 w-72 bg-white/90 border-r border-[#e6e2f5] backdrop-blur
              shadow-xl ring-1 ring-[#d1c4ff55] rounded-tr-3xl rounded-br-3xl
              transition-transform duration-200
              ${sessionOpen ? 'translate-x-0' : '-translate-x-full'}
              md:translate-x-0 md:static md:block
            `}
            style={{
              top: 0,
              height: 'calc(100vh - 40px)',
            }}
          >
            {/* 모바일 닫기 */}
            <div className="md:hidden flex justify-end p-2">
              <motion.button
                whileHover={{ scale: 1.22, backgroundColor: "#f3e8ff" }}
                whileTap={{ scale: 0.89 }}
                onClick={() => setSessionOpen(false)}
              >
                <ShieldCloseIcon className="w-6 h-6 text-[#7e4cff]" />
              </motion.button>
            </div>
            {/* 세션 리스트 헤더 */}
            <div className="flex items-center px-4 py-5 text-xl font-bold border-b border-[#e6e2f5]">
              <TerminalIcon className="w-6 h-6 mr-2 text-[#a084ee]" />
              내 세션
              {/* 데스크탑 토글 스위치 (사이드바 내부 오른쪽) */}
              <span className="hidden md:inline-block">
                <SessionSidebarToggle checked={showSidebar} onChange={() => setShowSidebar(s => !s)} />
              </span>
              <motion.button
                whileHover={{ scale: 1.22, backgroundColor: "#e8e5fd" }}
                whileTap={{ scale: 0.87 }}
                className="ml-auto"
                onClick={() => setModalOpen(true)}
                aria-label="새 세션 추가"
              >
                <PlusCircle className="w-5 h-5 text-[#a084ee]" />
              </motion.button>
            </div>
            {/* 세션 리스트 */}
            <nav className="flex-1 px-2 py-4 space-y-2 min-h-0 overflow-y-auto">
              {sessions.map(s => (
                <motion.div
                  key={s.id}
                  whileHover={{
                    scale: 1.03,
                    backgroundColor: "#e8defa99"
                  }}
                  transition={{
                    scale: { type: "tween", duration: 0.14 },
                    backgroundColor: { type: "tween", duration: 0.36 }
                  }}
                  onClick={() => {
                    setSelectedId(s.id);
                    setSessionOpen(false);
                  }}
                  className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all
                    ${selectedId === s.id
                      ? 'bg-[#a084ee]/25 font-semibold ring-2 ring-[#a084ee] shadow-md'
                      : 'hover:bg-[#e8e5fd]'}
                  `}
                  style={{ zIndex: 2 }}
                >
                  <Server className="w-5 h-5 mr-3 text-[#bba7ee]" />
                  <div className="flex-1 text-sm min-w-0">
                    <div className="flex items-center">
                      <span className="truncate">{s.label}</span>
                      <span className="ml-2 text-xs bg-[#e8e5fd] px-2 py-0.5 rounded text-[#7e4cff] border border-[#d1c4ff]/60">
                        {s.type}
                      </span>
                    </div>
                    <div className="text-gray-400 truncate">
                      {s.username}@{s.host}:{s.port}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.13 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
                    className="ml-2 p-1 rounded hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </motion.button>
                </motion.div>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* "Show Sidebar" 버튼 (데스크탑에서만, 꺼져 있을 때만!) */}
      <AnimatePresence>
        {(!showSidebar && !sessionOpen) && (
          <SidebarShowButton onClick={() => setShowSidebar(true)} />
        )}
      </AnimatePresence>

      {/* 모바일 햄버거/오버레이 */}
      {sessionOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setSessionOpen(false)}
        />
      )}

      {/* 오른쪽: 메인(탑바+본문) */}
      <main className="flex-1 flex flex-col z-10 relative min-h-0 h-full">
        {/* 모바일 햄버거 */}
        <div className="md:hidden flex items-center px-4 py-2 bg-white/80 border-b shadow h-14">
          <button onClick={() => setSessionOpen(true)}>
            <MenuIcon className="w-6 h-6 text-[#7e4cff]" />
          </button>
          <span className="ml-4 font-semibold text-[#7e4cff]">내 세션</span>
        </div>
        {/* 탑바/헤더 */}
        <div className="h-14 flex items-center px-6 border-b bg-white/80 shadow-sm z-10">
          {active ? (
            <>
              <span className="text-lg font-bold text-[#7e4cff] mr-4">{active.label}</span>
              <span className="text-sm text-[#7e4cff]">
                {active.type} | {active.username}@{active.host}:{active.port}
              </span>
              <span className={`ml-4 px-2 py-0.5 rounded-full text-xs font-semibold
                ${isActiveStatus.includes(active.id)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'}`}
              >
                {isActiveStatus.includes(active.id) ? '접속됨' : '대기 중'}
              </span>
              <motion.button
                whileHover={{ scale: 1.07, backgroundColor: "#ede9fe" }}
                whileTap={{ scale: 0.94 }}
                onClick={() => active && send('\n')}
                className="ml-auto px-3 py-1 bg-gradient-to-r from-[#7e4cff] to-[#6e70f2] text-white rounded transition-all flex items-center text-sm shadow font-semibold"
              >
                <Link2 className="w-4 h-4 mr-1" />
                다시 연결
              </motion.button>
            </>
          ) : (
            <span className="text-gray-400">세션을 선택하세요.</span>
          )}
        </div>
        {/* 본문 */}
        <div
          className="flex-1 flex h-0 min-h-0"
          style={{
            height: "calc(100vh - 40px - 56px)",
            overflowY: "auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          {selectedId ? (
            <>
              <motion.div
                initial={{ x: -18, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className="w-64 mr-4"
                style={{
                  background: "linear-gradient(135deg, #e8defa 60%, #b3c1f7 100%)",
                  borderRadius: "18px",
                  boxShadow: "0 2px 16px #bba7ee28"
                }}
              >
                <SftpFileManager sftp={sftp} />
              </motion.div>
              <div
                ref={terminalContainerRef}
                className="flex-1 h-full min-h-0 bg-[#181927] rounded-lg overflow-hidden shadow-2xl"
                style={{
                  border: "2px solid #ede9fe66",
                  boxShadow: "0 8px 40px #bba7ee22"
                }}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full w-full text-[#a084ee] font-semibold text-lg z-20">
              왼쪽에서 세션을 선택해주세요.
            </div>
          )}
        </div>
      </main>
      <NewSessionModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}