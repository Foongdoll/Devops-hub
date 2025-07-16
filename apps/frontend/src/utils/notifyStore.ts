type Notify = { 
  message: string; 
  type: 'success' | 'error' | 'info' | 'warn' | 'loading' | 'loading-hide'; // 'loading', 'loading-hide' 추가
};

let listeners: ((msg: Notify) => void)[] = [];

export function subscribe(fn: (msg: Notify) => void) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

export function showToast(message: string, type: Notify['type']) {
  listeners.forEach(fn => fn({ message, type }));
}

export function showLoading() {
  listeners.forEach(fn => fn({ message: "로딩 중...", type: 'loading' }));
}
export function hideLoading() {
  listeners.forEach(fn => fn({ message: "", type: 'loading-hide' }));
}
