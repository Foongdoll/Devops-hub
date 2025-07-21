import TopActionBar from "../components/git/TopActionBar";
import TabNav from "../components/git/TabNav";
import RemotesPanel from "../components/git/RemotesPanel";
import ChangesPanel from "../components/git/ChangesPanel";
import BranchesPanel from "../components/git/BranchsPanel";
import StashPanel from "../components/git/StashPanel";
import { useGitManager } from "../customhook/useGitManager";
import { CommitHistoryPanel } from "../components/git/CommitHistoryPanel";

const GitManager = () => {
  const git = useGitManager(); // 커스텀 훅에서 전부 가져오기

  return (
    <div className="flex flex-col w-full h-full bg-gray-950 text-gray-100">
      <TabNav active={git.tab} onChange={git.setTab} selectedRemote={git.selectedRemote}>
        <TopActionBar
          onPush={git.push}
          onPull={git.pull}
          onFetch={git.fetch}
          onStash={git.stash}
        />
      </TabNav>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-y-auto">
        {git.tab === "history" && (
          <CommitHistoryPanel
            commits={git.commits}            
            commitsWithBranches={git.commitsWithBranches}
            onContextMenu={git.openContextMenu}
            selectedHash={git.selectedHash}
            selectCommit={git.selectCommit}
            closeContextMenu={git.closeContextMenu}
            handleMenuAction={git.handleMenuAction}            
            commitBranches={git.commitBranches}            
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
            stagedFiles={git.stagedFiles}
            onStage={git.stageFile}
            onUnstage={git.unstageFile}
            onSelectFile={git.selectFile}
            selectedFile={git.selectedFile}
            diff={git.fileDiff}
            commitMsg={git.commitMsg}
            setCommitMsg={git.setCommitMsg}
            onCommit={git.commit}
          />
        )}
        {git.tab === "branches" && (
          <BranchesPanel
            local={git.localBranches}
            remotes={git.remoteBranches}
            tracking={git.trackingBranches}
            onCheckout={git.checkoutBranch}
            onDelete={git.deleteBranch}
          />
        )}
        {git.tab === "stash" && (
          <StashPanel
            stashes={git.stashes}
            onApply={git.applyStash}
            onDrop={git.dropStash}
            onSelect={git.selectStash}
            selectedStash={git.selectedStash}
            files={git.stashFiles}
            onFileSelect={git.selectStashFile}
            selectedFile={git.selectedStashFile}
            diff={git.stashDiff}
          />
        )}
      </main>
    </div>
  );
};

export default GitManager;