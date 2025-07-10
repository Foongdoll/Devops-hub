import { useNotify } from '../context/GlobalNotifyContext';

// Hook에서 직접 사용 (예시)
export const showToast = (msg: string, type: 'success' | 'error' | 'info' | 'warn' = 'info') => {
  const notify = useNotify();
  notify.showToast(msg, type);
};
export const showAlert = (msg: string, cb?: () => void) => {
  const notify = useNotify();
  notify.showAlert(msg, cb);
};
export const showConfirm = (msg: string, ok: () => void, no?: () => void) => {
  const notify = useNotify();
  notify.showConfirm(msg, ok, no);
};