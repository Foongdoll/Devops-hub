import React, { createContext, useContext, useState, ReactNode } from 'react';

type NotifyType = 'info' | 'success' | 'error' | 'warn' | 'confirm';
type ToastData = { message: string; type: NotifyType; id?: number };

interface NotifyContextProps {
  showToast: (msg: string, type?: NotifyType) => void;
  showAlert: (msg: string, callback?: () => void) => void;
  showConfirm: (msg: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const NotifyContext = createContext<NotifyContextProps | null>(null);

export function useNotify() {
  return useContext(NotifyContext)!;
}

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [alert, setAlert] = useState<{ message: string; onClose?: () => void } | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void; onCancel?: () => void } | null>(null);

  // Toast
  const showToast = (msg: string, type: NotifyType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { message: msg, type, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  };

  // Alert
  const showAlert = (message: string, onClose?: () => void) => setAlert({ message, onClose });
  const closeAlert = () => {
    alert?.onClose?.();
    setAlert(null);
  };

  // Confirm
  const showConfirm = (message: string, onConfirm: () => void, onCancel?: () => void) => setConfirm({ message, onConfirm, onCancel });
  const confirmYes = () => { confirm?.onConfirm(); setConfirm(null); };
  const confirmNo = () => { confirm?.onCancel?.(); setConfirm(null); };

  return (
    <NotifyContext.Provider value={{ showToast, showAlert, showConfirm }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded px-4 py-2 shadow-lg transition-all ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              toast.type === 'warn' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
      {alert && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-80 text-center shadow-xl">
            <div className="mb-4 text-lg font-semibold">{alert.message}</div>
            <button className="px-6 py-2 rounded bg-blue-500 text-white" onClick={closeAlert}>확인</button>
          </div>
        </div>
      )}
      {confirm && (
        <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-80 text-center shadow-xl">
            <div className="mb-4 text-lg font-semibold">{confirm.message}</div>
            <button className="px-4 py-2 rounded bg-blue-500 text-white mr-2" onClick={confirmYes}>확인</button>
            <button className="px-4 py-2 rounded bg-gray-400 text-white" onClick={confirmNo}>취소</button>
          </div>
        </div>
      )}
    </NotifyContext.Provider>
  );
}