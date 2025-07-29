import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCicdConfig, type CicdConfigProp, type RepoConfig } from "../../customhook/cicd/useCiCDConfig";
import { Server, Folder, GitBranch, PlayCircle, Plus, XCircle, Edit2, CheckCircle2 } from "lucide-react";

const getDefaultScript = (stack: string) => {
  if (stack.startsWith("java")) return { build: "javac *.java", deploy: "java -jar *.jar" };
  if (stack.startsWith("react")) return { build: "npm run build", deploy: "serve -s build" };
  if (stack.startsWith("node")) return { build: "npm run build", deploy: "npm start" };
  return { build: "", deploy: "" };
};


// 샘플 분야/스택 옵션
const STACK_OPTIONS = {
  Frontend: ["React", "Vue", "Angular"],
  Backend: ["Node.js", "Spring", "Django", "Flask", "Express"],
  DevOps: ["Docker", "Kubernetes", "Nginx", "Apache"],
  Database: ["MySQL", "PostgreSQL", "MongoDB", "Redis"]
};
const STACK_SCRIPT = {
  React: { build: "npm run build", deploy: "serve -s build" },
  "Node.js": { build: "npm run build", deploy: "npm start" },
  Spring: { build: "./gradlew build", deploy: "java -jar build/libs/*.jar" },
  Django: { build: "python manage.py collectstatic", deploy: "gunicorn mysite.wsgi" },
  // ...etc
};


export const CicdConfig: React.FC<CicdConfigProp> = ({ selectedSession, onSave }) => {
  const { config, setClonePath, addRepo, updateRepo } = useCicdConfig({ sshId: selectedSession.id });
  const [step, setStep] = useState(1);
  const [repoForm, setRepoForm] = useState<Partial<RepoConfig> & { validatedRepoUrl?: boolean; repoUrlError?: string; editBuild?: boolean; editDeploy?: boolean }>({});
  const [repoIdxEdit, setRepoIdxEdit] = useState<number | null>(null);

  // 분야별 스택 추가 state
  const [stackField, setStackField] = useState<keyof typeof STACK_OPTIONS>("Frontend");
  const [stackOption, setStackOption] = useState("");
  // 포트 범위 체크
  const [portError, setPortError] = useState<string>("");
  const isValidGitUrl = (url: string) => /^https:\/\/.*\.git$/.test(url);

  // 깃 저장소 URL 검증 (async)
  const handleRepoValidate = async () => {
    if (!isValidGitUrl(repoForm.repoUrl || "")) {
      setRepoForm(f => ({ ...f, repoUrlError: "형식이 맞지 않습니다." }));
      return;
    }
    // 여기에 서버 fetch 검증 추가
    const ok = true; // 실제 검증은 API 연결 필요
    if (ok) setRepoForm(f => ({ ...f, validatedRepoUrl: true, repoUrlError: undefined }));
    else setRepoForm(f => ({ ...f, repoUrlError: "저장소에 접근할 수 없습니다." }));
  };

  // 스택 추가 (+)
  const handleAddStack = () => {
    if (!stackOption) return;
    setRepoForm(f => ({
      ...f,
      stacks: [...(f.stacks ?? []), stackOption]
    }));
    setStackOption("");
  };

  // 스택 자동 스크립트
  const autoScript =
    repoForm.stacks && repoForm.stacks.length
      ? STACK_SCRIPT[repoForm.stacks[0] as keyof typeof STACK_SCRIPT]
      : { build: "", deploy: "" };

  // 빌드/배포 스크립트 수정
  const [editBuild, setEditBuild] = useState(false);
  const [editDeploy, setEditDeploy] = useState(false);

  // 포트 입력 검증
  const handlePortChange = (v: string) => {
    const n = parseInt(v, 10);
    if (!n || n < 1025 || n > 65535) setPortError("1025~65535 숫자만 입력 가능");
    else setPortError("");
    setRepoForm(f => ({ ...f, port: v }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      {/* 단계 표시 */}
      <div className="flex gap-2 mb-8">
        {["서버", "클론폴더", "저장소/브랜치", "최종확인"].map((t, i) => (
          <div key={i} className="flex-1 flex items-center justify-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-white shadow-lg transition-all
              ${i < step ? "bg-green-500" : i === step ? "bg-violet-500 animate-bounce" : "bg-gray-300"}`}>{i + 1}</div>
            {i < 3 && <div className="flex-1 h-2 bg-gradient-to-r from-violet-200 to-green-300" />}
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="path" className="bg-white p-6 rounded-xl shadow-xl flex flex-col gap-4">
            <div className="font-bold flex gap-2 items-center mb-1"><Folder /> 클론 받을 폴더 경로 선택</div>
            {/* SFTP 폴더 트리 컴포넌트(예시) */}
            <div className="border rounded p-3 bg-gray-50 mb-2">
              {/* SFTP 폴더 트리 위치 */}
              <span className="font-mono">{config.clonePath || "경로를 선택해주세요"}</span>
              {/* 예시: <SftpFolderTree onSelect={setClonePath} selected={config.clonePath} /> */}
              <button className="ml-3 px-2 py-1 bg-violet-100 rounded" onClick={() => setClonePath("/home/ubuntu/app")}>[경로 선택 예시]</button>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="px-4 py-2 rounded text-gray-700 font-bold border" onClick={() => setStep(0)} type="button">이전</button>
              <button className="px-4 py-2 bg-indigo-500 text-white rounded shadow font-bold hover:bg-indigo-700"
                onClick={() => setStep(2)} disabled={!config.clonePath}>다음</button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="repo" className="bg-white p-6 rounded-xl shadow-xl flex flex-col gap-4">
            <div className="font-bold flex gap-2 items-center mb-1"><GitBranch /> 저장소/브랜치/스택</div>
            {/* 깃 저장소 URL + 검증 */}
            <div className="flex gap-2 items-center">
              <input className="p-2 border rounded flex-1 font-mono" placeholder="깃 저장소 URL"
                value={repoForm.repoUrl || ""}
                disabled={repoForm.validatedRepoUrl}
                onChange={e => setRepoForm(f => ({
                  ...f,
                  repoUrl: e.target.value,
                  validatedRepoUrl: false,
                  repoUrlError: undefined
                }))}
              />
              <button
                className={`px-3 py-1 rounded font-bold shadow ${repoForm.validatedRepoUrl ? "bg-green-400 text-white" : "bg-blue-400 text-white hover:bg-blue-600"}`}
                disabled={repoForm.validatedRepoUrl}
                onClick={handleRepoValidate}
              >
                {repoForm.validatedRepoUrl ? <CheckCircle2 size={18} /> : "검증"}
              </button>
            </div>
            {repoForm.repoUrlError && <div className="text-red-500 text-xs">{repoForm.repoUrlError}</div>}

            {/* 브랜치 입력 */}
            <input className="p-2 border rounded font-mono" placeholder="브랜치(쉼표로 구분)"
              value={repoForm.branches?.join(",") || ""}
              onChange={e => setRepoForm(r => ({ ...r, branches: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} />

            {/* 기술스택 분야별 select + 추가 */}
            <div className="flex gap-2 items-center">
              <select value={stackField} className="border p-2 rounded" onChange={e => setStackField(e.target.value as any)}>
                {Object.keys(STACK_OPTIONS).map(f => <option key={f}>{f}</option>)}
              </select>
              <select value={stackOption} className="border p-2 rounded" onChange={e => setStackOption(e.target.value)}>
                <option value="">스택 선택</option>
                {STACK_OPTIONS[stackField].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <button className="ml-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600" type="button" onClick={handleAddStack}>
                <Plus size={16} />
              </button>
            </div>
            {/* 선택된 스택들 */}
            {repoForm.stacks && (
              <div className="flex flex-wrap gap-2">
                {repoForm.stacks.map((s, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 bg-indigo-100 rounded text-indigo-700 font-mono text-xs">
                    {s}
                    <button className="ml-1 text-red-400" onClick={() => setRepoForm(f => ({ ...f, stacks: f.stacks?.filter((_, idx) => idx !== i) }))}>
                      <XCircle size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 빌드/배포 스크립트 */}
            <div className="flex gap-2 items-center">
              <input className="p-2 border rounded font-mono flex-1" placeholder="빌드 스크립트"
                value={repoForm.buildScript ?? autoScript.build}
                disabled={!editBuild}
                onChange={e => setRepoForm(r => ({ ...r, buildScript: e.target.value }))}
              />
              <button className="px-2 py-1 bg-gray-200 rounded" type="button" onClick={() => setEditBuild(v => !v)}>
                <Edit2 size={16} /> {editBuild ? "잠금" : "수정"}
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <input className="p-2 border rounded font-mono flex-1" placeholder="배포 스크립트"
                value={repoForm.deployScript ?? autoScript.deploy}
                disabled={!editDeploy}
                onChange={e => setRepoForm(r => ({ ...r, deployScript: e.target.value }))}
              />
              <button className="px-2 py-1 bg-gray-200 rounded" type="button" onClick={() => setEditDeploy(v => !v)}>
                <Edit2 size={16} /> {editDeploy ? "잠금" : "수정"}
              </button>
            </div>

            {/* 테스트 포트 */}
            <div className="flex gap-2 items-center">
              <input className="p-2 border rounded font-mono w-32" type="number" min={1025} max={65535}
                placeholder="테스트 포트"
                value={repoForm.port || ""}
                onChange={e => handlePortChange(e.target.value)}
              />
              {portError && <span className="text-red-500 text-xs">{portError}</span>}
            </div>

            <div className="flex gap-2 mt-2">
              <button className="px-4 py-2 rounded text-gray-700 font-bold border" onClick={() => setStep(1)} type="button">이전</button>
              <button className="px-3 py-1 rounded bg-green-500 text-white font-bold shadow hover:bg-green-700"
                onClick={() => {
                  if (repoIdxEdit === null) {
                    addRepo({
                      ...repoForm,
                      branches: repoForm.branches || [],
                      stacks: repoForm.stacks || [],
                      buildScript: repoForm.buildScript ?? autoScript.build,
                      deployScript: repoForm.deployScript ?? autoScript.deploy,
                    } as RepoConfig);
                  } else {
                    updateRepo(repoIdxEdit, repoForm);
                    setRepoIdxEdit(null);
                  }
                  setRepoForm({});
                }}
                disabled={
                  !repoForm.repoUrl ||
                  !repoForm.validatedRepoUrl ||
                  portError ||
                  !(repoForm.stacks && repoForm.stacks.length)
                }
              >{repoIdxEdit === null ? "추가" : "수정"}</button>
              <button className="px-3 py-1 rounded bg-gray-400 text-white font-bold shadow" onClick={() => setRepoForm({})} type="button">초기화</button>
              <button className="px-4 py-2 bg-purple-500 text-white rounded shadow font-bold hover:bg-purple-700"
                onClick={() => setStep(3)}
                disabled={!config.repos.length}
              >최종 확인</button>
            </div>
            {/* 저장된 레포 목록 */}
            <div className="mt-3">
              <div className="font-semibold mb-1">저장된 레포 목록</div>
              <ul className="space-y-2">
                {config.repos.map((r, i) => (
                  <motion.li key={i} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-violet-50 rounded border flex flex-col gap-1"
                  >
                    <div className="text-indigo-700 font-mono">{r.repoUrl}</div>
                    <div className="text-xs text-gray-500">{(r as any).branches?.join(", ")} | {(r as any).stacks?.join(", ")}</div>
                    <div className="flex gap-2 mt-1">
                      <button className="px-2 py-1 bg-violet-400 text-white rounded" onClick={() => {
                        setRepoForm(r);
                        setRepoIdxEdit(i);
                      }}>수정</button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* 최종 확인 */}
        {step === 3 && (
          <motion.div key="confirm" className="bg-white p-6 rounded-xl shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-green-800 font-bold mb-2"><PlayCircle /> 최종 확인</div>
            <div className="overflow-x-auto">
              <pre className="bg-gray-100 p-3 rounded text-xs font-mono min-w-[300px]">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="px-4 py-2 rounded text-gray-700 font-bold border" onClick={() => setStep(2)} type="button">이전</button>
              <button className="px-4 py-2 bg-green-500 text-white rounded shadow font-bold hover:bg-green-700"
                onClick={() => onSave(config)}
              >설정 저장</button>
              <button className="text-gray-500 underline ml-auto" onClick={() => setStep(1)} type="button">처음으로</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};