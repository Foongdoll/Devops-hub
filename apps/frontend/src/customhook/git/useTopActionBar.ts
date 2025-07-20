import { useCallback } from 'react';

export function useTopActionBar() {
  const push = useCallback(() => { /* push 로직 */ }, []);
  const pull = useCallback(() => { /* pull 로직 */ }, []);
  const fetch = useCallback(() => { /* fetch 로직 */ }, []);
  const stash = useCallback(() => { /* stash 생성 로직 */ }, []);
  return { push, pull, fetch, stash };
}
