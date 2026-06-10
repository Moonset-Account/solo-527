export interface CommitInfo {
  sha: string;
  authorName: string;
  authorEmail: string;
  date: string;
  message: string;
}

export interface BranchInfo {
  name: string;
  remoteName: string;
  lastCommit: CommitInfo;
  aheadOfDefault: number;
  behindDefault: number;
  isMerged: boolean;
  isProtected: boolean;
  protectionRule?: BranchProtectionRule;
}

export interface BranchProtectionRule {
  pattern: string;
  requiresApprovingReviews: boolean;
  requiredApprovingReviewCount?: number;
  requiresStatusChecks: boolean;
  requiredStatusCheckContexts?: string[];
  allowsDeletions: boolean;
  allowsForcePushes: boolean;
  restrictsPushes: boolean;
}

export interface PullRequestInfo {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged' | 'draft';
  htmlUrl: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  closedAt?: string;
  baseBranch: string;
  headBranch: string;
}

export interface AnalyzedBranch extends BranchInfo {
  daysSinceLastCommit: number;
  status: BranchStatus;
  associatedPRs: PullRequestInfo[];
  action: RecommendedAction;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
}

export type BranchStatus =
  | 'active'
  | 'stale'
  | 'abandoned'
  | 'merged'
  | 'protected'
  | 'default';

export type RiskLevel = 'low' | 'medium' | 'high';

export type RecommendedAction =
  | 'keep'
  | 'review'
  | 'archive'
  | 'delete'
  | 'skip';

export interface DeletionPlan {
  createdAt: string;
  repo: string;
  defaultBranch: string;
  branchesToDelete: DeletionCandidate[];
  branchesSkipped: SkippedBranch[];
  summary: PlanSummary;
  confirmed: boolean;
  executed: boolean;
}

export interface DeletionCandidate {
  branchName: string;
  lastCommitter: string;
  lastCommitDate: string;
  daysSinceLastCommit: number;
  reason: string;
  associatedPRs: { number: number; title: string; state: string; url: string }[];
  unmergedCommits: number;
}

export interface SkippedBranch {
  branchName: string;
  reason: string;
}

export interface PlanSummary {
  totalBranches: number;
  toDelete: number;
  skipped: number;
  totalUnmergedCommits: number;
  estimatedReclaimableBranches: number;
}

export interface ExportData {
  generatedAt: string;
  repo: string;
  params: ScanParams;
  summary: ExportSummary;
  abandoned: AnalyzedBranch[];
  unmerged: AnalyzedBranch[];
  stale: AnalyzedBranch[];
  active: AnalyzedBranch[];
  protected: AnalyzedBranch[];
  deletionPlan?: DeletionPlan;
}

export interface ExportSummary {
  total: number;
  abandoned: number;
  unmerged: number;
  stale: number;
  active: number;
  protected: number;
  defaultBranch: string;
}

export interface ScanParams {
  repo: string;
  days: number;
  json: boolean;
  dryRun: boolean;
  token?: string;
  defaultBranch?: string;
  remote?: string;
}

export interface PlanParams extends ScanParams {
  confirm?: boolean;
  autoApprove?: boolean;
  outputFile?: string;
}

export interface ExportParams extends ScanParams {
  output: string;
  format: 'json' | 'csv' | 'md';
  includePlan?: boolean;
}

export type CommandName = 'scan' | 'plan' | 'export';
