// CICDManager.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Server,
    Settings,
    Rocket,
    CheckCircle2,
    RefreshCcw,
    Zap,
    ListChecks,
    Layers,
    ChevronRight
} from "lucide-react";
import { useCICD, type CicdTab } from "../customhook/cicd/useCICD";
import { useCICDConfig } from "../customhook/cicd/useCiCDConfig";
import { CICDConfigPanel } from "../components/cicd/CICDConfigPanel";


const statusIcon = {
    deploying: <RefreshCcw className="animate-spin text-white" size={19} />,
    success: <CheckCircle2 className="text-green-200" size={19} />,
    error: <Zap className="text-rose-200" size={19} />,
};

// 탭 정의
const TABS = [
    { key: "dashboard", label: "현황", icon: <Rocket size={18} /> },
    { key: "config", label: "설정", icon: <Settings size={18} /> },
]

export const CICDManager: React.FC = () => {
    const { tab, setTab, cicds, triggerDeploy } = useCICD();
    const { config, update, addEnv, updateEnv, removeEnv, onSave } = useCICDConfig();


    return (
        <div
            className="
        w-full h-full
        bg-gradient-to-br from-[#ede9fe] via-[#f3e8ff] to-[#fff7fa]
        flex flex-col items-center px-1 py-4
        relative overflow-y-auto
      "
        >
            {/* 상단 탭 네비게이션 */}
            <nav
                className="
    w-full max-w-4xl mx-auto
    flex rounded-2xl
    bg-white/50 backdrop-blur-md
    border border-purple-200 shadow-lg mb-10
  "
            >
                {TABS.map((t) => (
                    <motion.button
                        key={t.key}
                        onClick={() => setTab(t.key as CicdTab)}
                        whileTap={{ scale: 0.96 }}
                        whileHover={{ scale: 1.04, backgroundColor: 'rgba(221, 182, 254, 0.5)' }}
                        className={`
        flex-1 flex items-center justify-center gap-2
        py-3 font-bold text-base transition h-[54px] border-b-2
        ${tab === t.key
                                ? 'bg-purple-200 text-purple-900 border-purple-300 shadow-md'
                                : 'bg-transparent text-purple-500 border-transparent'
                            }
      `}
                        style={{ minWidth: 120, letterSpacing: 0.3 }}
                    >
                        {t.icon}
                        <span className="tracking-wide">{t.label}</span>
                    </motion.button>
                ))}
            </nav>



            <AnimatePresence mode="wait">
                {/* 대시보드 뷰 */}
                {tab === "dashboard" && (
                    <motion.div
                        key="dashboard"
                        className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.97 }}
                        transition={{ duration: 0.28, type: "spring" }}
                    >
                        {cicds.map((cicd) => (
                            <motion.div
                                key={cicd.id}
                                whileHover={{ scale: 1.04, boxShadow: "0 8px 24px rgba(131, 90, 241, 0.3)" }}
                                whileTap={{ scale: 0.98 }}
                                className="
          flex flex-col
          bg-white/60                     /* 연한 반투명 화이트 */
          border border-purple-200        /* 연한 퍼플 테두리 */
          rounded-2xl p-6
          shadow-lg                       /* 살짝 은은한 그림자 */
          relative overflow-hidden
        "
                                style={{ minHeight: 200 }}
                            >
                                {/* 상태 배지 */}
                                <motion.div
                                    className={`
            absolute top-4 right-6
            flex items-center gap-2
            rounded-full px-4 py-1.5 text-xs font-semibold
            text-purple-900               /* 진한 퍼플 텍스트 */
            bg-purple-100                 /* 연한 퍼플 배경 */
            shadow-md
          `}
                                    animate={{ scale: [1, 1.15, 1], opacity: [0.9, 1, 0.9] }}
                                    transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                                >
                                    {statusIcon[cicd.status]}
                                    {cicd.status === "deploying"
                                        ? "배포중"
                                        : cicd.status === "success"
                                            ? "성공"
                                            : "실패"}
                                </motion.div>

                                {/* 제목 */}
                                <div className="flex items-center gap-2 mb-4 text-purple-700 text-lg font-semibold">
                                    <Layers className="mr-1" size={19} />
                                    {cicd.name}
                                </div>

                                {/* 내용 */}
                                <div className="flex-1 text-gray-700 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Server size={16} className="opacity-80 text-purple-500" />
                                        <span>서버:</span>
                                        <span className="font-medium">{cicd.server}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ListChecks size={16} className="opacity-80 text-purple-500" />
                                        <span>스택:</span>
                                        <span>{cicd.stack.join(", ")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ChevronRight size={15} className="opacity-60 text-purple-500" />
                                        <span className="opacity-70">
                                            마지막 배포: <b>{cicd.lastDeployed}</b>
                                        </span>
                                    </div>
                                </div>

                                {/* 재배포 버튼 */}
                                <motion.button
                                    onClick={() => triggerDeploy(cicd.id)}
                                    whileHover={{ scale: 1.05, backgroundColor: "#ddb6fe" }}
                                    whileTap={{ scale: 0.95 }}
                                    className="
            mt-6 px-6 py-2.5
            rounded-xl font-semibold text-purple-900
            bg-purple-200 shadow transition
          "
                                >
                                    {cicd.status === "deploying" ? "배포중..." : "재배포"}
                                </motion.button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}


                {/* 설정 뷰 */}
                {tab === "config" && (
                    <motion.div
                        key="config"
                        className="
              w-full max-w-4xl mx-auto
              bg-white/30 backdrop-blur-md border border-gray-300
              rounded-2xl p-8 flex flex-col gap-6 shadow-2xl
            "
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.99 }}
                        transition={{ duration: 0.26, type: "spring" }}
                    >
                        <div className="flex items-center gap-2 text-lg font-bold text-indigo-500">
                            <Settings className="mr-1" size={18} />
                            CICD 설정
                        </div>
                        <CICDConfigPanel
                            config={config}
                            update={update}
                            addEnv={addEnv}
                            updateEnv={updateEnv}
                            removeEnv={removeEnv}
                            onSave={onSave}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
