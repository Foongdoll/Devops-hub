import { useEffect, useState } from "react";
import { useCICDSocket } from "../../context/CICDSocketContext";
import { useJumpSpinBounce } from "./useJumpSpinBounce";
import { showConfirm, showToast } from "../../utils/notifyStore";

export type CicdTab = "main" | "manage" | "config";

export type CicdSocketResponse = { success: true, message: string, data: any };

export
  interface Session {
  id: string;
  label: string;
  type: string;
  platform: string;
  host: string;
}

export const useCICD = () => {
  const [tab, setTab] = useState<CicdTab>("main");
  const { emit, on, off } = useCICDSocket();
  const controls = useJumpSpinBounce();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session>();


  const handleConfigSave = () => {

  }

  const onInitSessions = () => {
    emit("onInitSessions", {});
  }

  const onConfigTabMove = async (s: Session) => {
    const result = await showConfirm("CI/CD", "해당 세션의 정보로 CI/CD 설정을 진행하시겠습니까?")
    if(!result) return;
    setSelectedSession(s);
    setTab("config")
  }


  useEffect(() => {

  }, [])


  return {
    tab, setTab,

    // 회원이 등록한 SSH 서버 목록 전달
    onInitSessions,
    sessions, setSessions,
    selectedSession,


    // 모션 커스텀 훅
    controls,
    onConfigTabMove

    ,
    handleConfigSave
  };
};
