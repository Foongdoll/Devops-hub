

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