

export interface fetch_commit_history {
  hash: string;
  message: string;
  author: string;
  date: string;
  ref: string;
  parents: string;
}

export interface Branch { name: string; current?: boolean; fullname?: string };
export interface TrackingBranch { local: string; remote: string; ahead?: number; behind?: number };
export interface Stash { name: string; message: string; files: File[] };
export interface Remote { id: string; name: string; url: string; path: string };
export interface File { status: string; path: string; name: string; staged: boolean };