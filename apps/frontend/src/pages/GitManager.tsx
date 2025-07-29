import TopActionBar from "../components/git/TopActionBar";
import TabNav from "../components/git/TabNav";
import RemotesPanel from "../components/git/RemotesPanel";
import ChangesPanel from "../components/git/ChangesPanel";
import StashPanel from "../components/git/StashPanel";
import { useGitManager } from "../customhook/useGitManager";
import { CommitHistoryPanel } from "../components/git/CommitHistoryPanel";
import { ConflictModal } from "../components/git/ConflictModal";
import { useRemoteContext } from "../context/RemoteContext";
import CommitViewPanel from "../components/git/CommitViewPanel";
import BranchesPanel from "../components/git/BranchsPanel";
import { useEffect } from "react";
import { useGitSocket } from "../context/GitSocketContext";


const GitManager = () => {
  const git = useGitManager(); // 커스텀 훅에서 전부 가져오기
  const { conflictModalOpen, setConflictModalOpen, } = useRemoteContext();
  const { emit, on, off } = useGitSocket();
  const { selectedRemote } = useRemoteContext();
  useEffect(() => {
    // 리모트 폴터 내 파일 변경 리스너 
    // Changeds에 변경 파일 개수 동기화
    const fileChanged = (data: { filePath: string, type: string }) => {
      console.log(selectedRemote);
      if (data && selectedRemote) {
        emit("fetch_change_count", { remote: selectedRemote })
        emit("fetch_changed_files", { remote: selectedRemote })
      }
    }

    on('file_changed', fileChanged)
    return () => {
      off("file_changed", fileChanged)
    }
  }, [])
  

  return (
    <div
      className="
        flex flex-col w-full h-full
        bg-gradient-to-br from-[#211843] via-[#2e2466] to-[#6657a8]
        text-[#ebeaf9]
        rounded-2xl
        shadow-[0_6px_32px_0_rgba(126,76,255,0.14)]
        border border-[#4f389a]/30
        transition-all     
        overflow-y-hidden 
        overflow-x-auto
      "
    >
      <TabNav active={git.tab}
        onChange={git.setTab}
        selectedRemote={git.selectedRemote}
        selectedCommit={git.selectedCommit}
        setSelectedCommit={git.setselectedCommit}>
        <TopActionBar
          onPush={git.push}
          onPull={git.pull}
          onFetch={git.fetch}
          onReset={git.reset}
          setTab={git.setTab}
        />
      </TabNav>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 min-h-[600px] h-fit overflow-y-auto">
        {git.tab === "history" && (
          <CommitHistoryPanel
            commits={git.commits}
            setCommits={git.setCommits}
            onContextMenu={git.openContextMenu}
            selectedHash={git.selectedHash}
            selectCommit={git.selectCommit}
            closeContextMenu={git.closeContextMenu}
            handleMenuAction={git.handleMenuAction}
            onSelectBranch={git.selectRemoteBranch}
            fetchCommitHistory={git.fetchCommitHistory}
            onSelectLocalBranch={git.selecteLocalBranch}
            onSelectRemoteBranch={git.selectRemoteBranch}
            fetchHeadBranchTip={git.fetchHeadBranchTip}
            setCurrentBranchTipHash={git.setCurrentBranchTipHash}
            currentBranchTipHash={git.currentBranchTipHash}
            commitFiles={git.commitFiles}
            setCommitFiles={git.setCommitFiles}
            onCommitFiles={git.onCommitFiles}
            onCommitFileDiff={git.onCommitFileDiff}
            setTab={git.setTab}
          />
        )}
        {git.tab === "commitview" && (
          <CommitViewPanel
            selectedCommit={git.selectedCommit}
            commitFiles={git.commitFiles}
            onCommitFileDiff={git.onCommitFileDiff}
            setCommitFiles={git.setCommitFiles}
          />
        )}

        {git.tab === "remotes" && (
          <RemotesPanel
            remotes={git.remotes}
            onAdd={git.addRemote}
            onEdit={git.editRemote}
            onRemove={git.removeRemote}
            onChange={git.setTab}
            onSelect={git.selectRemote}
            onBranchSelect={git.fetchBranches}
          />
        )}
        {git.tab === "changes" && (
          <ChangesPanel
            unstagedFiles={git.unstagedFiles}
            setUnstagedFiles={git.setUnstagedFiles}
            stagedFiles={git.stagedFiles}
            setStagedFiles={git.setStagedFiles}
            onStage={git.stageFile}
            onUnstage={git.unstageFile}
            onSelectFile={git.selectFile}
            selectedFile={git.selectedFile}
            diff={git.fileDiff}
            commitMsg={git.commitMsg}
            setCommitMsg={git.setCommitMsg}
            onCommit={git.commit}
            fetchChanges={git.fetchChanges}
            onSelectLocalBranch={git.selecteLocalBranch}
            onSelectRemoteBranch={git.selectRemoteBranch}
            onDiscard={git.onDiscard}
            onSelectedLines={git.setSelectedLines}
            selectedLines={git.selectedLines}
            handleToggleLine={git.handleToggleLine}
          />
        )}
        {git.tab === "branches" && (
          <BranchesPanel
            onCheckoutLocal={git.selecteLocalBranch}
            onCheckoutRemote={git.selectRemoteBranch}
            onDelete={git.deleteBranch}
          />
        )}
        {git.tab === "stash" && (
          <StashPanel
            stashes={git.stashes}
            onCreate={git.createStash}
            onApply={git.applyStash}
            onDrop={git.dropStash}
            onSelect={git.selectStash}
            selectedStash={git.selectedStash}
            stashFiles={git.stashFiles}
            onStashFileSelect={git.onStashFileSelect}
            selectedStashFile={git.selectedStashFile}
            diff={git.stashDiff}
            onFetchStashChangeFiles={git.fetchStashChangeFiles}
            stashChangedFiles={git.stashChangedFiles}
            setStashChangedFiles={git.setStashChangedFiles}
            selectedChangedFiles={git.selectedChangedFiles}
            setSelectedChangedFiles={git.setSelectedChangedFiles}
            setStashMessage={git.setStashMessage}
            stashMessage={git.stashMessage}
            onFetchStashs={git.fetchStashs}
          />
        )}
        <ConflictModal
          open={conflictModalOpen}
          onClose={() => setConflictModalOpen(false)}
          conflictFiles={git.conflictFiles}
          onSelectConflictFile={git.selectConflictFile}
          selectedFile={git.selectedFile}
          setSelectedFile={git.setSelectedFile}
          branch={git.conflictBranch}
          left={git.left}
          right={git.right}
          onCheckoutConflictFilesCommit={git.onCheckoutRemoteBranch}
          onCheckoutConflictFilesStash={git.onCheckoutConflictFilesStash}
          onCheckoutConflictFilesDiscard={git.onCheckoutConflictFilesDiscard}
          socketResponse={git.socketResponse}
          setSocketResponse={git.setSocketResponse}
        />
      </main>
    </div>
  );
};

export default GitManager;