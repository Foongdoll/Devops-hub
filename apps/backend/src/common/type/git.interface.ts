

export interface fetch_commit_history {
  hash: string;
  message: string;
  author: string;
  date: string;
  ref: string;
  parents: string;
}

export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  parents: string;      // 공백 구분 부모 해시들
  refs: string;         // HEAD -> main, origin/main, 등등
  branches?: string[];  // 파싱된 브랜치명 리스트
}

export interface Branch { name: string; current?: boolean; fullname?: string };
export interface TrackingBranch { local: string; remote: string; ahead?: number; behind?: number };
export interface Stash { name: string; message: string; files: File[] };
export interface Remote { id: string; name: string; url: string; path: string };
export interface File { status: string; path: string; name: string; staged: boolean };