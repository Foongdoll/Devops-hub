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
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warn' } | null>(null);

  // 여기서 구독해서 notifyStore의 showToast 호출을 실제로 "받아" 처리합니다.
  useEffect(() => {
    const unsubscribe = subscribe(({ message, type }) => {
      if (type === 'loading') setLoading(true);
      else if (type === 'loading-hide') setLoading(false);
      else {
        setToast({ message, type: type as any });
        setTimeout(() => setToast(null), 3000);
      }
    });
    return unsubscribe;
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warn') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 로딩 애니메이션 SVG
  function Spinner() {
    return (
      <svg className="animate-spin h-10 w-10 text-[#7e4cff]" viewBox="0 0 24 24">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="#7e4cff" strokeWidth="4" fill="none" />
        <path className="opacity-80" fill="#7e4cff" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4z" />
      </svg>
    );
  }

  return (
    <GlobalUIContext.Provider value={{ loading, setLoading, error, setError, showToast }}>
      {children}

      {/* Loading Overlay (가운데, 투명 배경, 모던) */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 bg-white/70 backdrop-blur p-8 rounded-2xl shadow-xl">
            <Spinner />
            <span className="font-semibold text-[#7e4cff] text-lg animate-pulse">로딩 중...</span>
          </div>
        </div>
      )}

      {/* Error & Toast: 오른쪽 아래, 동일 스타일 */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-2 z-50">
        {error && (
          <div className="max-w-xs w-full bg-red-50 border-l-4 border-red-400 shadow-lg rounded-lg px-5 py-3 text-sm text-red-800 font-semibold animate-fade-in-up">
            {error}
          </div>
        )}
        {toast && (
          <div className={
            `max-w-xs w-full bg-white shadow-lg rounded-lg px-5 py-3 text-sm flex items-center gap-2 font-semibold border-l-4 animate-fade-in-up ` +
            (toast.type === 'success' ? 'border-green-400 text-green-700'
              : toast.type === 'error' ? 'border-red-400 text-red-700'
                : toast.type === 'warn' ? 'border-yellow-400 text-yellow-700'
                  : 'border-blue-400 text-blue-700')
          }>
            <span className={
              (toast.type === 'success' ? 'text-green-500'
                : toast.type === 'error' ? 'text-red-500'
                  : toast.type === 'warn' ? 'text-yellow-500'
                    : 'text-blue-500') +
              " text-xl"
            }>•</span>
            <span className="flex-1">{toast.message}</span>
          </div>
        )}
      </div>

      {/* 애니메이션 */}
      <style>
        {`
        .animate-fade-in-up {
          animation: fadeInUp 0.25s cubic-bezier(0.39, 0.575, 0.565, 1) both;
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(16px);}
          100% { opacity: 1; transform: translateY(0);}
        }
        `}
      </style>
    </GlobalUIContext.Provider>
  );
}
