import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useCICDConfig, type CICDConfig } from "../../customhook/cicd/useCiCDConfig";
import { useCICDSocket } from "../../context/CICDSocketContext";

interface Props {
  config: CICDConfig;
  update: ReturnType<typeof useCICDConfig>["update"];
  addEnv: () => void;
  updateEnv: (idx: number, key: "key" | "value", value: string) => void;
  removeEnv: (idx: number) => void;
  onSave: () => void;
}

export const CICDConfigPanel: React.FC<Props> = ({
  config,
  update,
  addEnv,
  updateEnv,
  removeEnv,
  onSave,
}) => {
  const [sshKeyFileName, setSshKeyFileName] = useState<string>("");
  const [branches, setBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchError, setBranchError] = useState<string>("");
  const { on, off, emit } = useCICDSocket();
  const fetchBranches = async () => {
    if (!config.repoUrl) return;
    setLoadingBranches(true);
    setBranchError("");
    setBranches([]);
    emit("fetch_remote_branches", {giturl: config.repoUrl});    
  };

  useEffect(() => {    

    const fetchRemoteBranchesResponse = (data: { branches: string[] }) => {
      try {
        console.log(data);
        const branches = data.branches;
        setBranches(branches);
        if (branches.length > 0) {
          update("branch", branches[0]);
        }
      } catch (e) {
        setBranchError("브랜치 로드 실패");
      } finally {
        setLoadingBranches(false);
      }
    }
    on("fetch_remote_branches_response", fetchRemoteBranchesResponse)

    return () => {
      off("fetch_remote_branches_response", fetchRemoteBranchesResponse)
    }
  }, [])

  return (
    <motion.div
      className="w-full h-screen p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        initial={{ y: 32, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 32, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        className="
          max-w-3xl mx-auto
          bg-white/60 backdrop-blur-md
          rounded-2xl shadow-lg
          p-8 flex flex-col gap-8
        "
      >
        {/* 서버 & 저장소 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputBlock label="서버 이름">
            <input
              className="
                w-full px-4 py-2
                bg-white/50 text-purple-900
                border border-purple-200 rounded-lg
                placeholder-purple-500
                focus:outline-none focus:ring-2 focus:ring-purple-400
                transition
              "
              autoComplete="off"
              value={config.serverName}
              onChange={(e) => update("serverName", e.target.value)}
            />
          </InputBlock>
          <InputBlock label="서버 주소/IP">
            <input
              className="
                w-full px-4 py-2
                bg-white/50 text-purple-900
                border border-purple-200 rounded-lg
                placeholder-purple-500
                focus:outline-none focus:ring-2 focus:ring-purple-400
                transition
              "
              value={config.serverHost}
              onChange={(e) => update("serverHost", e.target.value)}
            />
          </InputBlock>
          <InputBlock label="SSH 유저">
            <input
              className="
                w-full px-4 py-2
                bg-white/50 text-purple-900
                border border-purple-200 rounded-lg
                placeholder-purple-500
                focus:outline-none focus:ring-2 focus:ring-purple-400
                transition
              "
              value={config.sshUser}
              onChange={(e) => update("sshUser", e.target.value)}
            />
          </InputBlock>
          <InputBlock label="SSH Private Key">
            <div className="flex items-center gap-4">
              <label className="
                cursor-pointer px-4 py-2
                bg-purple-200 hover:bg-purple-300
                text-purple-900 rounded-lg shadow
                transition
              ">
                키 파일 업로드
                <input
                  type="file"
                  accept=".pem,.key,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setSshKeyFileName(file.name);
                    const reader = new FileReader();
                    reader.onload = () => {
                      update("sshKey", reader.result as string);
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
              {sshKeyFileName && (
                <span className="text-purple-700 truncate max-w-xs">
                  {sshKeyFileName}
                </span>
              )}
            </div>
          </InputBlock>
          <InputBlock label="Git 저장소 URL" className="md:col-span-2">
            <div className="flex gap-2">
              <input
                className="
                  flex-1 px-4 py-2
                  bg-white/50 text-purple-900
                  border border-purple-200 rounded-lg
                  placeholder-purple-500
                  focus:outline-none focus:ring-2 focus:ring-purple-400
                  transition
                "
                value={config.repoUrl}
                onChange={(e) => {
                  update("repoUrl", e.target.value);
                  setBranches([]);
                  setBranchError("");
                }}
                placeholder="https://github.com/..."
              />
              <motion.button
                type="button"
                onClick={fetchBranches}
                disabled={!config.repoUrl || loadingBranches}
                whileTap={{ scale: 0.95 }}
                whileHover={config.repoUrl && !loadingBranches ? { scale: 1.05 } : {}}
                className={`
                  px-4 py-2 rounded-lg font-semibold
                  ${config.repoUrl && !loadingBranches
                    ? "bg-purple-200 hover:bg-purple-300 text-purple-900"
                    : "bg-purple-200/50 text-purple-400 cursor-not-allowed"}
                  transition
                `}
              >
                {loadingBranches ? "로딩…" : "검증 & 로드"}
              </motion.button>
            </div>
            {branchError && (
              <span className="text-rose-500 text-sm">{branchError}</span>
            )}
          </InputBlock>
          <InputBlock label="브랜치" className="md:col-span-2">
            <select
              disabled={branches.length === 0}
              value={config.branch}
              onChange={(e) => update("branch", e.target.value)}
              className="
                w-full px-4 py-2
                bg-white/50 text-purple-900
                border border-purple-200 rounded-lg
                placeholder-purple-500
                focus:outline-none focus:ring-2 focus:ring-purple-400
                transition
              "
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </InputBlock>
        </div>

        {/* 빌드/배포 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputBlock label="빌드 스크립트">
            <textarea
              rows={2}
              placeholder="ex: npm run build"
              className="
                w-full px-4 py-2
                bg-white/50 text-purple-900
                border border-purple-200 rounded-lg
                placeholder-purple-500
                focus:outline-none focus:ring-2 focus:ring-purple-400
                transition resize-none
              "
              value={config.buildScript}
              onChange={(e) => update("buildScript", e.target.value)}
            />
          </InputBlock>
          <InputBlock label="배포 스크립트">
            <textarea
              rows={2}
              placeholder="ex: ./deploy.sh"
              className="
                w-full px-4 py-2
                bg-white/50 text-purple-900
                border border-purple-200 rounded-lg
                placeholder-purple-500
                focus:outline-none focus:ring-2 focus:ring-purple-400
                transition resize-none
              "
              value={config.deployScript}
              onChange={(e) => update("deployScript", e.target.value)}
            />
          </InputBlock>
        </div>

        {/* 환경변수 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <span className="text-purple-700 font-semibold">환경변수</span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              className="
                ml-3 p-1 rounded-full
                bg-purple-200 hover:bg-purple-300
                text-purple-900 transition
              "
              onClick={addEnv}
            >
              <Plus size={18} />
            </motion.button>
          </div>
          <div className="flex flex-col gap-3">
            {config.env.length === 0 && (
              <span className="text-gray-700 text-sm">환경변수 없음</span>
            )}
            {config.env.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ x: 24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-wrap items-center gap-3"
              >
                <input
                  placeholder="KEY"
                  className="
                    flex-1 min-w-[96px] px-3 py-2
                    bg-white/50 text-purple-900
                    border border-purple-200 rounded-lg
                    placeholder-purple-500
                    focus:outline-none focus:ring-2 focus:ring-purple-400
                    transition
                  "
                  value={item.key}
                  onChange={(e) => updateEnv(idx, "key", e.target.value)}
                />
                <input
                  placeholder="VALUE"
                  className="
                    flex-1 min-w-[96px] px-3 py-2
                    bg-white/50 text-purple-900
                    border border-purple-200 rounded-lg
                    placeholder-purple-500
                    focus:outline-none focus:ring-2 focus:ring-purple-400
                    transition
                  "
                  value={item.value}
                  onChange={(e) => updateEnv(idx, "value", e.target.value)}
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  className="
                    p-1 rounded-full
                    bg-rose-200 hover:bg-rose-300
                    text-rose-900 transition
                  "
                  onClick={() => removeEnv(idx)}
                >
                  <Trash2 size={16} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 알림 이메일 */}
        <InputBlock label="배포 결과 알림(이메일)">
          <input
            placeholder="your@email.com"
            className="
              w-full px-4 py-2
              bg-white/50 text-purple-900
              border border-purple-200 rounded-lg
              placeholder-purple-500
              focus:outline-none focus:ring-2 focus:ring-purple-400
              transition
            "
            value={config.notifyEmail}
            onChange={(e) => update("notifyEmail", e.target.value)}
          />
        </InputBlock>

        {/* 저장 버튼 */}
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          className="
            w-full py-3 rounded-xl
            bg-purple-200 text-purple-900
            font-semibold text-lg
            shadow hover:shadow-md transition
          "
        >
          저장
        </motion.button>
      </motion.form>
    </motion.div>
  );
};

function InputBlock({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm font-semibold text-purple-700">{label}</span>
      {children}
    </label>
  );
}
