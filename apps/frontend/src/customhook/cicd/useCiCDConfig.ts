import { useState } from "react";
import { apiRequest } from "../../axios/axiosInstance";

export type CICDConfig = {
  serverName: string;
  serverHost: string;
  sshUser: string;
  sshKey: string;
  repoUrl: string;
  branch: string;
  buildScript: string;
  deployScript: string;
  env: { key: string; value: string }[];
  notifyEmail: string;
};

export function useCICDConfig(initial?: Partial<CICDConfig>) {
  const [config, setConfig] = useState<CICDConfig>({
    serverName: "",
    serverHost: "",
    sshUser: "",
    sshKey: "",
    repoUrl: "",
    branch: "",
    buildScript: "",
    deployScript: "",
    env: [],
    notifyEmail: "",
    ...initial,
  });

  // 단일 필드 업데이트
  const update = (key: keyof CICDConfig, value: any) => {
    setConfig((c) => ({ ...c, [key]: value }));
  };

  // 환경변수 동적 추가/삭제/변경
  const addEnv = () => setConfig((c) => ({ ...c, env: [...c.env, { key: "", value: "" }] }));
  const updateEnv = (idx: number, key: "key" | "value", value: string) => {
    setConfig((c) => ({
      ...c,
      env: c.env.map((item, i) => i === idx ? { ...item, [key]: value } : item),
    }));
  };
  const removeEnv = (idx: number) => {
    setConfig((c) => ({ ...c, env: c.env.filter((_, i) => i !== idx) }));
  };

  const onSave = async () => {
    const result = await apiRequest({
      url: "cicd/",
      method: "POST",
      data: config
    })

    console.log(result);


  }

  return { config, update, addEnv, updateEnv, removeEnv, setConfig, onSave };
}
