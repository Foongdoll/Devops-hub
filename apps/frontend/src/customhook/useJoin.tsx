import { useState } from "react";
import * as AuthService from "../services/AuthService";
import type { NavigateFunction } from "react-router-dom";
import { useGlobalUI } from "../context/GlobalUIContext";
import { useNotify } from "../context/GlobalNotifyContext";

export const useJoin = ({ navigate }: { navigate: NavigateFunction }) => {
  const { setLoading, setError } = useGlobalUI();
  const { showToast } = useNotify();
  const [userId, setUserId] = useState("");
  const [userPw, setUserPw] = useState("");
  const [userName, setUserName] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !userPw || !userName) {
      showToast("모든 필드를 입력해주세요.", "error");
      return;
    }
    setLoading(true);        
    
    const success = await AuthService.join(userId, userPw, userName);
    if (success) {
      showToast("회원가입이 완료되었습니다.", "success");
      navigate("/login");
    } else {
      setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      showToast("회원가입에 실패했습니다.", "error");
    }
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return {
    userId, setUserId,
    userPw, setUserPw,
    userName, setUserName,
    handleJoin
  };
};