import { CicdNav } from "../components/cicd/CicdNav";
import { useCICD } from "../customhook/cicd/useCICD";
import { CicdMain } from "../components/cicd/CicdMain";
import { CicdConfig } from "../components/cicd/CicdConfig";

export const CICDManager: React.FC = () => {
  const cicd = useCICD();

  return (
    <div className="flex flex-col w-full h-full bg-gradient-to-r from-[#ede6ff] to-[#d9b8ff] p-6">
      {/* 상단 네비게이션 */}
      <CicdNav tab={cicd.tab} setTab={cicd.setTab} />

      {/* 콘텐츠 영역 */}
      <div className="mt-4 flex-1 w-full h-full rounded-xl bg-white/80 shadow-md p-6 backdrop-blur-md overflow-y-auto">
        {cicd.tab === "main" && (
          <CicdMain
            sessions={cicd.sessions}
            setSessions={cicd.setSessions}
            onInitSessions={cicd.onInitSessions}
            serverIconAnim={cicd.controls}
            onConfigTabMove={cicd.onConfigTabMove}
          />
        )}

        {cicd.tab === "manage" && cicd.selectedSession && (
          <>관리</>
        )}

        {cicd.tab === "config" && cicd.selectedSession && (
          <CicdConfig
            selectedSession={cicd.selectedSession}
            onSave={cicd.handleConfigSave}
          />
        )}


      </div>
    </div>
  );
};
