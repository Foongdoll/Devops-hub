// notifyStore.ts
import type { ConfirmOptions } from "../context/GlobalUIContext";

type Notify = {
  message: string;
  description?: string;
  options?: ConfirmOptions;
  type: 'success' | 'error' | 'info' | 'warn' | 'loading' | 'loading-hide' | 'confirm';
  resolve?: (value: [boolean, any?]) => void; // confirm에서만 사용
};

type Listener = (msg: Notify) => void;

let listeners: Listener[] = [];

export function subscribe(fn: Listener) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

export function showToast(message: string, type: Notify['type']) {
  listeners.forEach(fn => fn({ message, type }));
}

export function showLoading({ message = "로딩 중..." }: { message?: string } = {}) {
  listeners.forEach(fn => fn({ message, type: 'loading' }));
}
export function hideLoading() {
  listeners.forEach(fn => fn({ message: "", type: 'loading-hide' }));
}

export function showConfirm(message: string, description?: string, options?: ConfirmOptions) {
  return new Promise<[boolean, any?]>((resolve) => {
    listeners.forEach(fn =>
      fn({ message, description, options, type: 'confirm', resolve })
    );
  });
}
