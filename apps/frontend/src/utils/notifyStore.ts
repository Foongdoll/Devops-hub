type Notify = { message: string; type: 'success' | 'error' | 'info' | 'warn' };
let listeners: ((msg: Notify) => void)[] = [];

export function subscribe(fn: (msg: Notify) => void) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}
export function showToast(message: string, type: Notify['type']) {
  listeners.forEach(fn => fn({ message, type }));
}
