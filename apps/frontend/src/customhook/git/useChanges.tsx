import { useState, useCallback } from 'react';
export type File = { path: string; name: string };

export function useChanges(initialUnstaged: File[] = [], initialStaged: File[] = []) {
  const [unstagedFiles, setUnstagedFiles] = useState<File[]>(initialUnstaged);
  const [stagedFiles, setStagedFiles] = useState<File[]>(initialStaged);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDiff, setFileDiff] = useState<string>('');
  const [commitMsg, setCommitMsg] = useState('');

  const stageFile = useCallback((file: File) => {
    setUnstagedFiles(prev => prev.filter(f => f.path !== file.path));
    setStagedFiles(prev => [...prev, file]);
    setSelectedFile(file);
  }, []);
  const unstageFile = useCallback((file: File) => {
    setStagedFiles(prev => prev.filter(f => f.path !== file.path));
    setUnstagedFiles(prev => [...prev, file]);
    setSelectedFile(file);
  }, []);
  const selectFile = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);
  const commit = useCallback(() => {
    if (stagedFiles.length && commitMsg.trim()) {
      setStagedFiles([]);
      setCommitMsg('');
    }
  }, [stagedFiles, commitMsg]);

  return {
    unstagedFiles, stagedFiles, selectedFile, fileDiff,
    stageFile, unstageFile, selectFile,
    commitMsg, setCommitMsg, commit,
    setUnstagedFiles, setStagedFiles,
  };
}
