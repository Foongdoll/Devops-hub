import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface GlobalUIContextProps {
  loading: boolean;
  setLoading: (val: boolean) => void;
  error: string | null;
  setError: (msg: string | null) => void;
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

  return (
    <GlobalUIContext.Provider value={{ loading, setLoading, error, setError }}>
      {children}
      {/* 글로벌 Loading Indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-xl shadow text-xl text-[#7e4cff]">로딩 중...</div>
        </div>
      )}
      {/* 글로벌 Error Toast/Alert */}
      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] bg-red-500 text-white px-6 py-2 rounded-xl shadow">
          {error}
          <button className="ml-3 underline" onClick={() => setError(null)}>닫기</button>
        </div>
      )}
      {children}
    </GlobalUIContext.Provider>
  );
}
