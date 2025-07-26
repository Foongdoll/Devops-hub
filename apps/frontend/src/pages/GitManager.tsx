import TopActionBar from "../components/git/TopActionBar";
import TabNav from "../components/git/TabNav";
import RemotesPanel from "../components/git/RemotesPanel";
import ChangesPanel from "../components/git/ChangesPanel";
import StashPanel from "../components/git/StashPanel";
import { useGitManager } from "../customhook/useGitManager";
import { CommitHistoryPanel } from "../components/git/CommitHistoryPanel";
import { ConflictModal } from "../components/git/ConflictModal";
import { useRemoteContext } from "../context/RemoteContext";


const GitManager = () => {
  const git = useGitManager(); // 커스텀 훅에서 전부 가져오기
  const { conflictModalOpen, setConflictModalOpen, } = useRemoteContext();

  return (
    <div className="flex flex-col w-full h-full bg-gray-950 text-gray-100">
      <TabNav active={git.tab} onChange={git.setTab} selectedRemote={git.selectedRemote}>
        <TopActionBar
          onPush={git.push}
          onPull={git.pull}
          onFetch={git.fetch}
          onStash={git.stash}
          setTab={git.setTab}
        />
      </TabNav>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-y-auto">
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
        {/* {git.tab === "branches" && (
          <BranchesPanel
            local={git.localBranches}
            remotes={git.remoteBranches}
            tracking={git.trackingBranches}
            onCheckout={git.checkoutBranch}
            onDelete={git.deleteBranch}
          />
        )} */}
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