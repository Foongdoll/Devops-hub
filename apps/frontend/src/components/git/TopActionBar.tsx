import { ArrowUpFromLine, ArrowDownFromLine, RefreshCcw, Archive, TimerReset } from 'lucide-react';
import type React from 'react';
import { useRemoteContext } from '../../context/RemoteContext';
import type { Remote } from '../../customhook/git/useRemote';
import { useGlobalUI } from '../../context/GlobalUIContext';
import type { tabType } from '../../customhook/useGitManager';
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { delay } from '../../utils/comm';
import { useGitSocket } from '../../context/GitSocketContext';
import { showConfirm } from '../../utils/notifyStore';

export type TopActionBarProps = {
  onPush: (remote: Remote | null, remoteBranch: string) => void;
  onPull: (remote: Remote | null, remoteBranch: string) => void;
  onFetch: (remote: Remote | null) => void;
  onReset: (remote: Remote | null, option: string, commits: string[], remoteBranch: string) => void;
  setTab: Dispatch<SetStateAction<tabType>>;
};

const badgeStyle = `
  absolute -top-1 -right-1
  bg-gradient-to-tr from-[#ff96c3] to-[#a084ee]
  text-xs text-white rounded-full px-1.5 py-0.5 font-bold shadow-xl
  pointer-events-none z-10
  animate-pulse
`;



const TopActionBar: React.FC<TopActionBarProps> = ({
  onPush, onPull, onFetch, onReset, setTab
}) => {
  const { pushCount, pullCount, selectedRemoteBranch, selectedRemote, setSelectedRemote, selectedLocalBranch } = useRemoteContext();
  const { showToast } = useGlobalUI();
  const { emit, on, off } = useGitSocket();

  const handleReset = async () => {

    if (!selectedRemote) {
      showToast('선택된 리모트 정보가 없습니다.\n리모트 선택창으로 이동합니다.', 'info');
      setSelectedRemote(null);
      await delay(1000);
      setTab('remotes');
      return;
    }
    emit("git_unpushed_commits", { remote: selectedRemote, branch: selectedLocalBranch });

  };

  useEffect(() => {
    const unpushed_commits_response = async (data: { hash: string, message: string }[]) => {
      let selectedCommits: string[] = [];
      const result = await showConfirm("Commits", "되돌릴 커밋을 선택해주세요.", { select: true, data: ["전체", ...data.map(e => e.hash + ": " + e.message)] });
      if (!result[0]) return;

      if (result[1] === "전체") {
        selectedCommits = data.map(e => e.hash);
      } else {
        // result[1]은 "hash: message" 형식이므로, 앞부분만 사용
        const hash = result[1].split(":")[0];
        selectedCommits = [hash]; // 배열로 만들어야 함!
      }

      const [ok, option] = await showConfirm("Reset", "리셋 옵션을 선택해주세요.", { select: true, data: ["soft", "mixed", "hard"] });
      if (!ok || !option) return;
      else {
        // 각 옵션에 따라 경고 분기
        if (option === "soft") {
          const [confirmOk] = await showConfirm(
            "Soft Reset",
            "소프트 리셋은 커밋만 되돌리며, 워킹 디렉토리와 스테이징은 유지됩니다.\n진행할까요?"
          );
          if (!confirmOk) return;
        }

        if (option === "mixed") {
          const [confirmOk] = await showConfirm(
            "Mixed Reset",
            "믹스드 리셋은 커밋과 스테이징 영역을 초기화하며, 워킹 디렉토리는 유지됩니다.\n진행할까요?"
          );
          if (!confirmOk) return;
        }

        if (option === "hard") {
          const [confirmOk] = await showConfirm(
            "⚠ Hard Reset",
            "하드 리셋은 커밋, 스테이징, 워킹 디렉토리 모두 초기화됩니다.\n이 작업은 되돌릴 수 없습니다.\n정말 진행할까요?"
          );
          if (!confirmOk) return;
        }

        showToast("Reset을 진행합니다.", "info");
        onReset(selectedRemote, option, selectedCommits, selectedRemoteBranch);
      }

    }


    on("unpushed_commits_response", unpushed_commits_response);
    return () => {
      off("unpushed_commits_response", unpushed_commits_response);
    }
  })

  return (
    <div className="flex flex-wrap items-center gap-1 md:gap-2 min-w-0 max-w-full">
      <div className="relative">
        <button
          onClick={async () => {
            pushCount === 0 && showToast('푸시 할 변경 사항이 없습니다.', 'info');
            selectedRemote ? onPush(selectedRemote, selectedRemoteBranch)
              : (showToast('선택된 리모트 정보가 없습니다.\n리모트 선택창으로 이동합니다.', 'info'),
                setSelectedRemote(null), await delay(1000), setTab("remotes"));
          }}
          className="
            p-2 rounded-full
            bg-gradient-to-tr from-[#ede9fe] to-[#f3e8ff]
            shadow-sm
            hover:shadow-lg hover:bg-[#7e4cff22] hover:scale-110
            focus:outline-none active:scale-95
            transition-all duration-75
            relative group
          "
          title="Push"
        >
          <ArrowUpFromLine className="w-6 h-6 text-[#7e4cff] group-hover:text-[#4f3b98] transition" />
          {pushCount > 0 && (
            <span className={badgeStyle}>{pushCount}</span>
          )}
        </button>
      </div>
      <div className="relative">
        <button
          onClick={async () => {
            selectedRemote ? onPull(selectedRemote, selectedRemoteBranch)
              : (showToast('선택된 리모트 정보가 없습니다.\n리모트 선택창으로 이동합니다.', 'info'),
                setSelectedRemote(null), await delay(1000), setTab("remotes"));
          }}
          className="
            p-2 rounded-full
            bg-gradient-to-tr from-[#ede9fe] to-[#e8defa]
            shadow-sm
            hover:shadow-lg hover:bg-[#7e4cff22] hover:scale-110
            focus:outline-none active:scale-95
            transition-all duration-75
            relative group
          "
          title="Pull"
        >
          <ArrowDownFromLine className="w-6 h-6 text-[#7e4cff] group-hover:text-[#4f3b98] transition" />
          {pullCount > 0 && (
            <span className={badgeStyle}>{pullCount}</span>
          )}
        </button>
      </div>
      <button
        onClick={() => onFetch(selectedRemote)}
        className="
          p-2 rounded-full
          bg-gradient-to-tr from-[#ede9fe] to-[#e8defa]
          shadow-sm
          hover:shadow-lg hover:bg-[#7e4cff22] hover:scale-110
          focus:outline-none active:scale-95
          transition-all duration-75
          group
        "
        title="Fetch"
      >
        <RefreshCcw className="w-6 h-6 text-[#7e4cff] group-hover:text-[#4f3b98] transition" />
      </button>
      <button
        onClick={handleReset}
        className="
    p-2 rounded-full
    bg-gradient-to-tr from-[#ede9fe] to-[#e8defa]
    shadow-sm
    hover:shadow-lg hover:bg-[#7e4cff22] hover:scale-110
    focus:outline-none active:scale-95
    transition-all duration-75
    group
  "
        title="Reset"
      >
        <TimerReset className="w-6 h-6 text-[#ff5a5a] group-hover:text-[#c92c2c] transition" />
      </button>

    </div>
  );
};

export default TopActionBar;
