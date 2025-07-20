import { useState, useCallback } from 'react';
import type { File } from './useChanges';
export type Stash = { name: string; message: string; files: File[] };

export function useStash(initial: Stash[] = []) {
  const [stashes, setStashes] = useState<Stash[]>(initial);
  const [selectedStash, setSelectedStash] = useState<Stash | null>(null);
  const [stashFiles, setStashFiles] = useState<File[]>([]);
  const [selectedStashFile, setSelectedStashFile] = useState<File | null>(null);
  const [stashDiff, setStashDiff] = useState<string>('');

  const applyStash = useCallback((stash: Stash) => {
    setStashes(prev => prev.filter(s => s.name !== stash.name));
    setSelectedStash(null); setStashFiles([]); setSelectedStashFile(null); setStashDiff('');
  }, []);
  const dropStash = useCallback((stash: Stash) => {
    setStashes(prev => prev.filter(s => s.name !== stash.name));
    if (selectedStash?.name === stash.name) {
      setSelectedStash(null); setStashFiles([]); setSelectedStashFile(null); setStashDiff('');
    }
  }, [selectedStash]);
  const selectStash = useCallback((stash: Stash) => {
    setSelectedStash(stash); setStashFiles(stash.files); setSelectedStashFile(null); setStashDiff('');
  }, []);
  const selectStashFile = useCallback((file: File) => {
    setSelectedStashFile(file);
  }, []);

  return {
    stashes, selectedStash, stashFiles, selectedStashFile, stashDiff,
    applyStash, dropStash, selectStash, selectStashFile,
    setStashes
  };
}
