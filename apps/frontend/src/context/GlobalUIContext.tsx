// src/context/GlobalUIContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { subscribe } from "../utils/notifyStore";

export interface ConfirmOptions {
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  select?: boolean;
  data?: any;
  checkbox?: { label: string; value?: boolean }; // 추가
}

interface GlobalUIContextProps {
  loading: boolean;
  setLoading: (val: boolean) => void;
  error: string | null;
  setError: (msg: string | null) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warn') => void;
  showConfirm: (message: string, description?: string, options?: ConfirmOptions) => Promise<[boolean, any?]>;
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
  // ✅ Confirm 상태
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
    description?: string;
    options?: ConfirmOptions;
    resolve?: (value: [boolean, any]) => void;
  }>({ open: false, message: "" });
  const [data, setData] = useState<any>(null);
  const [checkbox, setCheckbox] = useState<boolean>(
    confirmState.options?.checkbox?.value ?? false
  );

  // 여기서 구독해서 notifyStore의 showToast 호출을 실제로 "받아" 처리합니다.
  useEffect(() => {
    const unsubscribe = subscribe(({ message, type }) => {
      if (type === 'loading') setLoading(true);
      else if (type === 'loading-hide') setLoading(false);
      else if (type === 'confirm') {
        showConfirm(message, confirmState.description || "", confirmState.options || {})
      }
      else {
        setToast({ message, type: type as any });
        setTimeout(() => setToast(null), 3000);
      }
    });
    setData(null);
    setCheckbox(confirmState.options?.checkbox?.value ?? false);
    return unsubscribe;
  }, []);

  const showConfirm = (message: string, description?: string, options?: ConfirmOptions) => {
    return new Promise<[boolean, any]>(resolve => {
      setConfirmState({
        open: true, message, description, options,
        resolve
      });
    });
  };

  const handleConfirm = (result: boolean) => {
    // data, checkbox 결과 같이 반환
    confirmState.resolve?.([result, confirmState.options?.select ? data : confirmState.options?.checkbox ? checkbox : null]);
    setConfirmState({ open: false, message: "" });
    setData(null);
    setCheckbox(false);
  };

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
    <GlobalUIContext.Provider value={{ loading, setLoading, error, setError, showToast, showConfirm }}>
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
          <div className="fixed inset-0 z-[1000] flex items-end justify-center pointer-events-none mb-24">
            <div
              className={
                `max-w-xs w-full bg-white shadow-lg rounded-lg px-5 py-3 text-sm flex items-center gap-2 font-semibold border-l-4 animate-toast-in-out ` +
                (toast.type === 'success' ? 'border-green-400 text-green-700'
                  : toast.type === 'error' ? 'border-red-400 text-red-700'
                    : toast.type === 'warn' ? 'border-yellow-400 text-yellow-700'
                      : 'border-blue-400 text-blue-700')
              }
              style={{
                pointerEvents: 'auto',
                minWidth: '280px'
              }}
            >
              <span className={
                (toast.type === 'success' ? 'text-green-500'
                  : toast.type === 'error' ? 'text-red-500'
                    : toast.type === 'warn' ? 'text-yellow-500'
                      : 'text-blue-500') +
                " text-xl"
              }>•</span>
              <span className="flex-1">{toast.message}</span>
            </div>
            {/* 애니메이션 스타일 */}
            <style>
              {`
        .animate-toast-in-out {
          animation: toastFadeIn 0.35s cubic-bezier(0.39, 0.575, 0.565, 1) both, 
                     toastFadeOut 0.35s cubic-bezier(0.39, 0.575, 0.565, 1) 2.65s forwards;
        }
        @keyframes toastFadeIn {
          from { opacity: 0; transform: translateY(24px) scale(0.98);}
          to   { opacity: 1; transform: translateY(0) scale(1);}
        }
        @keyframes toastFadeOut {
          from { opacity: 1; transform: translateY(0) scale(1);}
          to   { opacity: 0; transform: translateY(-10px) scale(0.98);}
        }
      `}
            </style>
          </div>
        )}

        {confirmState.open && (
          <div className="fixed inset-0 z-[1000] bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 min-w-[320px] max-w-xs shadow-xl border border-[#e0e0f0] flex flex-col gap-4 animate-fade-in-up">
              <div className="font-bold text-lg text-[#4b2ea7]">{confirmState.message}</div>
              {confirmState.description && (
                <div className="text-gray-500 text-sm">{confirmState.description}</div>
              )}
              {confirmState.options?.select && (
                <select
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  onChange={(e) => setData(e.target.value)}
                >
                  <option value="">선택하세요</option>
                  {confirmState.options.data?.map((item: any, index: number) => (
                    <option key={index} value={item}>{item}</option>
                  ))}
                </select>
              )}

              {confirmState.options?.checkbox && (
                <label className="flex items-center gap-2 mt-2 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkbox}
                    onChange={e => setCheckbox(e.target.checked)}
                    className="w-4 h-4 accent-[#7e4cff]"
                  />
                  <span className="text-sm text-gray-700">{confirmState.options.checkbox.label}</span>
                </label>
              )}

              <div className="flex gap-2 mt-2 justify-end">
                <button
                  className="px-4 py-1.5 rounded-lg font-semibold border bg-gray-100 hover:bg-gray-200 text-gray-700"
                  onClick={() => handleConfirm(false)}
                >
                  {confirmState.options?.cancelText || "취소"}
                </button>
                <button
                  className={`px-4 py-1.5 rounded-lg font-semibold text-white ${confirmState.options?.danger
                    ? "bg-red-500 hover:bg-red-700"
                    : "bg-[#7e4cff] hover:bg-[#5630b4]"
                    }`}
                  onClick={() => handleConfirm(true)}
                >
                  {confirmState.options?.confirmText || "확인"}
                </button>
              </div>
            </div>
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
