import type { NavigateFunction } from "react-router-dom";
import { useGlobalUI } from "../context/GlobalUIContext";
import * as AuthService from "../services/AuthService";
import { useState } from "react";

export function useLogin({ navigate }: { navigate: NavigateFunction }) {
  const { setLoading, setError } = useGlobalUI();
  const [userId, setUserId] = useState<string>("");
  const [userPw, setUserPw] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // setLoading(true);
    setError(null);
    try {
      const res = await AuthService.login(userId, userPw);      
      if (res && res.accessToken) {
        localStorage.setItem('accessToken', res.accessToken);
        setLoading(false);
        navigate("/"); // 로그인 성공 시 홈으로 이동        
      }
    } finally {
      // setLoading(false);
    }
  };

  return { handleLogin, userId, setUserId, userPw, setUserPw };
}
