// hooks/useCicdConfig.ts
import { useState } from "react";
import type { Session } from "./useCICD";

export interface RepoConfig {
    repoUrl: string;
    branches: string[];
    stack: string;
    buildScript: string;
    deployScript: string;
    port: string;        // 단일 스택 (기존)
    stacks?: string[];     // 여러 개 선택 (신규, option)
}

export interface CicdConfigState {
    sshId: string;
    clonePath: string;
    repos: RepoConfig[];  // 여러 개 선택 (신규, option)
}

// 서버 선택 드롭다운 옵션 타입 예시
export interface SshOption {
    id: string;
    label: string;
    host: string;
}

// CicdConfig 컴포넌트 prop 타입
export interface CicdConfigProp {
    selectedSession: Session;                 // 등록된 SSH 서버 리스트
    onSave: (config: CicdConfigState) => void; // 설정 저장 시 콜백
}

export function useCicdConfig(initial?: Partial<CicdConfigState>) {
    const [config, setConfig] = useState<CicdConfigState>({
        sshId: "",
        clonePath: "",
        repos: [],
        ...initial,
    });

    // 각 단계별 업데이트 함수 (예시)
    const setSSH = (sshId: string) => setConfig((c) => ({ ...c, sshId }));
    const setClonePath = (clonePath: string) => setConfig((c) => ({ ...c, clonePath }));
    const addRepo = (repo: RepoConfig) => setConfig((c) => ({ ...c, repos: [...c.repos, repo] }));
    const updateRepo = (idx: number, data: Partial<RepoConfig>) =>
        setConfig((c) => ({
            ...c,
            repos: c.repos.map((r, i) => (i === idx ? { ...r, ...data } : r)),
        }));

    return { config, setSSH, setClonePath, addRepo, updateRepo };
}
