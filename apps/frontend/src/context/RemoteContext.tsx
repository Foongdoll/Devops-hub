import React, { createContext, useContext, useState } from "react";
import type { Remote } from "../customhook/git/useRemote";
import type { Branch } from "../customhook/git/useBranches";


interface RemoteContextType {
  selectedRemote: Remote | null;
  setSelectedRemote: (r: Remote | null) => void;
  localBranches: Branch[];
  setLocalBranches: (branches: Branch[]) => void;
  remoteBranches: Branch[];
  setRemoteBranches: (branches: Branch[]) => void;
  commitBranches: string[];
  setCommitBranches: (branches: string[]) => void;
  selectedLocalBranch: string;
  setSelectedLocalBranch: (branch: string) => void;
  selectedRemoteBranch: string;
  setSelectedRemoteBranch: (branch: string) => void;
  pushCount: number;
  pullCount: number;
}

const RemoteContext = createContext<RemoteContextType | undefined>(undefined);

export const useRemoteContext = () => {
  const ctx = useContext(RemoteContext);
  if (!ctx) throw new Error("useRemoteContext must be used within a RemoteProvider");
  return ctx;
};

export const RemoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 선택된 리모트
  const [selectedRemote, setSelectedRemote] = useState<Remote | null>(null);
  // 로컬 브랜치 목록
  const [localBranches, setLocalBranches] = useState<Branch[]>([]);
  // 리모트 브랜치 목록
  const [remoteBranches, setRemoteBranches] = useState<Branch[]>([]);
  // 커밋 브랜치 목록
  const [commitBranches, setCommitBranches] = useState<string[]>([]);
  // 선택된 로컬 브랜치
  const [selectedLocalBranch, setSelectedLocalBranch] = useState<string>("");
  // 선택된 리모트 브랜치
  const [selectedRemoteBranch, setSelectedRemoteBranch] = useState<string>("");

  const [pushCount, setPushCount] = useState(0);
  const [pullCount, setPullCount] = useState(0);

  const fetchPushCount = (count: number) => {
    setPushCount(count);
  }

  const fetchPullCount = (count: number) => {
    setPullCount(count);
  }

  const fetchAllCounts = (push: number, pull: number) => {
    setPushCount(push);   
    setPullCount(pull);
  }


  return (
    <RemoteContext.Provider value={{
      selectedRemote,
      setSelectedRemote,
      localBranches,
      setLocalBranches,
      remoteBranches,
      setRemoteBranches,
      commitBranches,
      setCommitBranches,
      selectedLocalBranch,
      setSelectedLocalBranch,
      selectedRemoteBranch,
      setSelectedRemoteBranch,

      pushCount,
      pullCount,
    }}>
      {children}
    </RemoteContext.Provider>
  );
};
