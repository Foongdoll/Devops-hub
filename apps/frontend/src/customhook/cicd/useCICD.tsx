import { useState } from "react";

// 데모용 CICD 데이터(실제론 fetch로 교체)
const INIT_CICDS = [
  {
    id: "c1",
    name: "프론트엔드 빌드/배포",
    status: "deploying",
    lastDeployed: "2025-07-28 13:22",
    stack: ["React", "Node.js"],
    server: "AWS EC2",
  },
  {
    id: "c2",
    name: "백엔드 배포",
    status: "success",
    lastDeployed: "2025-07-27 17:44",
    stack: ["Spring", "MySQL"],
    server: "IDC 서버",
  }
] as CicdItem[]

type CICDStatus = "deploying" | "success" | "error";
export interface CicdItem {
  id: string;
  name: string;
  status: CICDStatus;
  lastDeployed: string;
  stack: string[];
  server: string;
}

export type CicdTab = "dashboard" | "config";

export const useCICD = () => {
  const [tab, setTab] = useState<CicdTab>("dashboard");
  const [cicds, setCicds] = useState<CicdItem[]>(INIT_CICDS);

  // 배포 트리거
  const triggerDeploy = (id: string) => {
    setCicds(list =>
      list.map(item =>
        item.id === id
          ? { ...item, status: "deploying" }
          : item
      )
    );
    setTimeout(() => {
      setCicds(list =>
        list.map(item =>
          item.id === id
            ? { ...item, status: "success", lastDeployed: new Date().toLocaleString("ko-KR") }
            : item
        )
      );
    }, 1800);
  };

  // CICD 추가/수정/삭제도 여기서 관리 가능!
  // ex: addCicd, editCicd, removeCicd 등

  return {
    tab,
    setTab,
    cicds,
    setCicds,
    triggerDeploy,
    // 필요 시 config 상태 등도 추가
  };
};
