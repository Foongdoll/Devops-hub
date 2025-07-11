import { Link } from "react-router-dom";
import { FolderOpen, GitBranch, Cloud, Lock } from "lucide-react"; // 아이콘 라이브러리
import { useEffect } from "react";

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
    <div className="p-10 space-y-8 bg-gray-50 min-h-screen">
      {/* SSH/FTP/SFTP 서버 패널 */}
      <div>
        <div className="text-xl font-bold mb-3 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-[#6f52e4]" />
          서버 접속 관리
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sshServers.map((srv) => (
            <div key={srv.id}
              className="flex items-center bg-white rounded-xl p-5 shadow hover:shadow-md transition group"
            >
              <Cloud className="w-8 h-8 mr-4 text-blue-400" />
              <div className="flex-1">
                <div className="font-bold text-lg">{srv.name} <span className="text-xs text-gray-400 ml-2">{srv.type}</span></div>
                <div className="text-gray-600">{srv.user}@{srv.host}</div>
                <div className={`text-xs font-semibold mt-1 ${srv.status === 'online' ? 'text-green-500' : 'text-red-400'}`}>
                  {srv.status === 'online' ? "접속 가능" : "접속 불가"}
                </div>
              </div>
              <Link to={`/connect/${srv.id}`}
                className="ml-6 px-4 py-1 rounded-xl bg-gradient-to-r from-[#7e4cff] to-[#6e70f2] text-white font-bold shadow group-hover:scale-105 transition"
              >
                접속
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 깃 저장소/브랜치 패널 */}
      <div>
        <div className="text-xl font-bold mb-3 flex items-center">
          <GitBranch className="w-5 h-5 mr-2 text-green-600" />
          Git 저장소 관리
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {gitRepos.map((repo) => (
            <div key={repo.id}
              className="flex items-center bg-white rounded-xl p-5 shadow hover:shadow-md transition group"
            >
              <FolderOpen className="w-8 h-8 mr-4 text-orange-400" />
              <div className="flex-1">
                <div className="font-bold text-lg">{repo.name}</div>
                <div className="text-gray-600 text-sm flex items-center">
                  브랜치 <span className="ml-2 mr-1 px-2 py-0.5 bg-gray-200 rounded">{repo.branch}</span>
                  <span className="mx-2">|</span>
                  커밋 <span className="ml-1 font-bold">{repo.commits}</span>
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  Remote: {repo.remote}
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-[#6f52e4] underline"
                  >
                    깃허브 바로가기
                  </a>
                </div>
              </div>
              <Link
                to={`/git/${repo.id}`}
                className="ml-6 px-4 py-1 rounded-xl bg-gradient-to-r from-green-400 to-[#6e70f2] text-white font-bold shadow group-hover:scale-105 transition"
              >
                브랜치 보기
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;