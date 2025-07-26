import { Link } from "react-router-dom";
import { FolderOpen, GitBranch, Cloud, Lock } from "lucide-react";
import { useEffect } from "react";
import { motion } from "framer-motion";

// 샘플 데이터
const sshServers = [
  { id: 1, name: "Dev 서버", host: "dev.mycompany.com", user: "ubuntu", type: "SSH", status: "online" },
  { id: 2, name: "File Server", host: "files.local", user: "root", type: "SFTP", status: "offline" },
];

const gitRepos = [
  { id: 1, name: "회사 메인 저장소", branch: "main", commits: 105, remote: "origin", url: "https://github.com/myorg/main" },
  { id: 2, name: "개인 실험 저장소", branch: "feature/devops-ui", commits: 13, remote: "origin", url: "https://github.com/myorg/experiment" },
];

const Dashboard = () => {
  useEffect(() => {
    console.log("대시보드 렌더링");
  }, []);

  return (
    <div className="p-8 sm:p-10 space-y-12 bg-gradient-to-br from-[#ede9fe] via-[#f3e8ff] to-[#fff7fa] min-h-screen transition-colors duration-300">
      {/* 서버 접속 관리 */}
      <section>
        <motion.div
          className="text-xl font-bold mb-4 flex items-center text-[#5a289c] drop-shadow"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 110, damping: 14 }}
        >
          <Lock className="w-5 h-5 mr-2 text-[#7e4cff]" />
          서버 접속 관리
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sshServers.map((srv, idx) => (
            <motion.div
              key={srv.id}
              initial={{ scale: 0.98, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              // transition={{ delay: 0.04 + idx * 0.07, type: "spring", stiffness: 120, damping: 16 }}
              whileHover={{
                scale: 1.045,
                boxShadow: "0 8px 28px #cbb3ff38"
              }}
              transition={{
                scale: { type: "tween", duration: 0.14, ease: "easeOut" },      // hover 즉시
                boxShadow: { type: "tween", duration: 0.32, ease: "easeOut" }   // glow는 부드럽게
              }}
              className="flex items-center bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow group border border-[#e4e1f6] hover:border-[#bba7ee] transition-all cursor-pointer"
              style={{ minHeight: 112 }}
            >
              <Cloud className="w-9 h-9 mr-4 text-blue-400 drop-shadow" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg text-[#271869] flex items-center">
                  {srv.name}
                  <span className="text-xs text-[#bba7ee] ml-2">{srv.type}</span>
                </div>
                <div className="text-gray-600 text-sm truncate">{srv.user}@{srv.host}</div>
                <div className={`text-xs font-semibold mt-1 ${srv.status === 'online' ? 'text-green-500' : 'text-red-400'}`}>
                  {srv.status === 'online' ? "접속 가능" : "접속 불가"}
                </div>
              </div>
              <motion.div
                whileHover={{
                  scale: srv.status === "online" ? 1.09 : 1,
                  boxShadow: srv.status === "online" ? "0 2px 18px #b3c1f788" : undefined
                }}
                transition={{
                  scale: { type: "tween", duration: 0.14 },
                  boxShadow: { type: "tween", duration: 0.24 }
                }}
                className="ml-6"
              >
                <Link
                  to={`/connect/${srv.id}`}
                  className={`
                    px-5 py-2 rounded-xl bg-gradient-to-r 
                    from-[#7e4cff] to-[#6e70f2] text-white font-bold shadow
                    transition-all duration-150 focus:scale-105
                    ${srv.status === 'online'
                      ? 'hover:from-[#906aff] hover:to-[#6e70f2]'
                      : 'opacity-50 pointer-events-none'}
                  `}
                  tabIndex={srv.status === 'online' ? 0 : -1}
                >
                  접속
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Git 저장소 관리 */}
      <section>
        <motion.div
          className="text-xl font-bold mb-4 flex items-center text-[#5a289c] drop-shadow"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 110, damping: 14, delay: 0.1 }}
        >
          <GitBranch className="w-5 h-5 mr-2 text-green-600" />
          Git 저장소 관리
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gitRepos.map((repo, idx) => (
            <motion.div
              key={repo.id}
              initial={{ scale: 0.98, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              // transition={{ delay: 0.09 + idx * 0.09, type: "spring", stiffness: 120, damping: 16 }}
              whileHover={{
                scale: 1.045,
                boxShadow: "0 8px 28px #cbb3ff38"
              }}
              transition={{
                scale: { type: "tween", duration: 0.14, ease: "easeOut" },      // hover 즉시
                boxShadow: { type: "tween", duration: 0.32, ease: "easeOut" }   // glow는 부드럽게
              }}
              className="flex items-center bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow group border border-[#e4e1f6] hover:border-[#bba7ee] transition-all cursor-pointer"
              style={{ minHeight: 112 }}
            >
              <FolderOpen className="w-9 h-9 mr-4 text-orange-400 drop-shadow" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg text-[#271869] truncate">{repo.name}</div>
                <div className="text-gray-600 text-sm flex items-center">
                  브랜치 <span className="ml-2 mr-1 px-2 py-0.5 bg-gray-200 text-[#6e70f2] rounded">{repo.branch}</span>
                  <span className="mx-2">|</span>
                  커밋 <span className="ml-1 font-bold">{repo.commits}</span>
                </div>
                <div className="text-gray-400 text-xs mt-1 truncate">
                  Remote: {repo.remote}
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-[#7e4cff] underline hover:text-[#4f378b] hover:underline"
                  >
                    깃허브 바로가기
                  </a>
                </div>
              </div>
              <motion.div
                whileHover={{
                  scale: 1.09,
                  boxShadow: "0 2px 18px #7e4cff55"
                }}
                transition={{
                  scale: { type: "tween", duration: 0.13 },
                  boxShadow: { type: "tween", duration: 0.22 }
                }}
                className="ml-6"
              >
                <Link
                  to={`/git/${repo.id}`}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-400 to-[#6e70f2] text-white font-bold shadow transition-all duration-150 focus:scale-105 hover:from-[#8cf9c6] hover:to-[#6e70f2]"
                >
                  브랜치 보기
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
