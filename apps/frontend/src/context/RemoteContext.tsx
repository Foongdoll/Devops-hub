import React, { createContext, useContext, useState } from "react";
import type { Remote } from "../customhook/git/useRemote";
import type { Branch, TrackingBranch } from "../customhook/git/useBranches";


interface RemoteContextType {
  selectedRemote: Remote | null;
  setSelectedRemote: (r: Remote | null) => void;
  localBranches: Branch[];
  setLocalBranches: (branches: Branch[]) => void;
  remoteBranches: Branch[];
  setRemoteBranches: (branches: Branch[]) => void;
  trackingBranches: TrackingBranch[];
  setTrackingBranches: (branches: TrackingBranch[]) => void;
  commitBranches: string[];
  setCommitBranches: (branches: string[]) => void;
}

const RemoteContext = createContext<RemoteContextType | undefined>(undefined);

export const useRemoteContext = () => {
  const ctx = useContext(RemoteContext);
  if (!ctx) throw new Error("useRemoteContext must be used within a RemoteProvider");
  return ctx;
};

export const RemoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRemote, setSelectedRemote] = useState<Remote | null>(null);
  const [localBranches, setLocalBranches] = useState<Branch[]>([]);
  const [remoteBranches, setRemoteBranches] = useState<Branch[]>([]);
  const [trackingBranches, setTrackingBranches] = useState<TrackingBranch[]>([]);
  const [commitBranches, setCommitBranches] = useState<string[]>([]);

  return (
    <RemoteContext.Provider value={{
      selectedRemote,
      setSelectedRemote,
      localBranches,
      setLocalBranches,
      remoteBranches,
      setRemoteBranches,
      trackingBranches,
      setTrackingBranches,
      commitBranches,
      setCommitBranches
    }}>
      {children}
    </RemoteContext.Provider>
  );
};
