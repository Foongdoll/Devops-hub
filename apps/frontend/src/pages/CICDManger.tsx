import { Server } from "lucide-react";
import { CicdNav } from "../components/cicd/CicdNav";
import { useCICD } from "../customhook/cicd/useCICD";
import { CicdMain } from "../components/cicd/CicdMain";

export const CICDManager: React.FC = () => {
  const cicd = useCICD();

  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-r from-[#ede6ff] to-[#d9b8ff] p-6">
      {/* 상단 네비게이션 */}
      <CicdNav tab={cicd.tab} setTab={cicd.setTab} />

      {/* 콘텐츠 영역 */}
      <div className="mt-4 flex-1 w-full rounded-xl bg-white/80 shadow-md p-6 backdrop-blur-md overflow-y-auto">
        {cicd.tab === "main" && (
          <CicdMain />
        )}

        {cicd.tab === "manage" && (
          <div>
            <h2 className="text-xl font-bold text-purple-800 mb-4">⚙️ Manage Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">설정 패널 1</div>
              <div className="bg-white p-4 rounded-lg shadow">설정 패널 2</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
