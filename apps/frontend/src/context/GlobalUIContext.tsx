// src/context/GlobalUIContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { subscribe } from "../utils/notifyStore"; 

interface GlobalUIContextProps {
  loading: boolean;
  setLoading: (val: boolean) => void;
  error: string | null;
  setError: (msg: string | null) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warn') => void;
}

const GlobalUIContext = createContext<GlobalUIContextProps | undefined>(undefined);

export function useGlobalUI() {
  const ctx = useContext(GlobalUIContext);
  if (!ctx) throw new Error("useGlobalUI must be used within a GlobalUIProvider");
  return ctx;
}

export function GlobalUIProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [toast,   setToast]   = useState<{ message: string; type: 'success'|'error'|'info'|'warn' }|null>(null);

  // 여기서 구독해서 notifyStore의 showToast 호출을 실제로 "받아" 처리합니다.
  useEffect(() => {
    const unsubscribe = subscribe(({ message, type }) => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    });
    return unsubscribe;
  }, []);

   const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <GlobalUIContext.Provider value={{ loading, setLoading, error, setError, showToast }}>
      {children}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white p-6 rounded-xl shadow-lg text-xl text-[#7e4cff]">로딩 중...</div>
        </div>
      )}

      {/* Global Error */}
      {error && (
        <div className="fixed inset-0 flex items-start justify-center pt-10 z-50 pointer-events-none">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-4 pointer-events-auto">
            <span>{error}</span>
            <button className="underline" onClick={() => setError(null)}>닫기</button>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toast && (
        <div className="fixed inset-0 flex items-start justify-center pt-10 z-50 pointer-events-none">
          <div className={`max-w-md w-full bg-white bg-opacity-90 backdrop-blur-md shadow-lg rounded-lg flex items-center px-6 py-3 space-x-3 pointer-events-auto transition-transform transform` +
            `${toast.type === 'success' ? ' border-l-4 border-green-500' : toast.type === 'error' ? ' border-l-4 border-red-500' : toast.type === 'warn' ? ' border-l-4 border-yellow-500' : ' border-l-4 border-blue-500'}`}>
            {/* Icon */}
            <span className={`text-xl ${toast.type === 'success' ? 'text-green-500' : toast.type === 'error' ? 'text-red-500' : toast.type === 'warn' ? 'text-yellow-500' : 'text-blue-500'}`}>•</span>
            <span className="flex-1 text-sm text-gray-800">{toast.message}</span>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => setToast(null)}>✕</button>
          </div>
        </div>
      )}
    </GlobalUIContext.Provider>
  );
}
