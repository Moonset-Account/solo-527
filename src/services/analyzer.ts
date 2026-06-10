import type {
  AnalyzedBranch,
  BranchInfo,
  PullRequestInfo,
  BranchProtectionRule,
  DeletionPlan,
  DeletionCandidate,
  SkippedBranch,
  ExportData,
  ExportSummary,
  ScanParams,
} from '../types/index.js';
import {
  daysBetween,
  classifyBranch,
  groupByStatus,
} from '../utils/index.js';

export class Analyzer {
  private defaultBranch: string;
  private thresholdDays: number;
  private repo: string;

  constructor(defaultBranch: string, thresholdDays: number, repo: string) {
    this.defaultBranch = defaultBranch;
    this.thresholdDays = thresholdDays;
    this.repo = repo;
  }

  analyzeBranches(
    branches: BranchInfo[],
    prMap: Map<string, PullRequestInfo[]>
  ): AnalyzedBranch[] {
    const analyzed: AnalyzedBranch[] = [];

    for (const branch of branches) {
      const daysSince = daysBetween(branch.lastCommit.date);
      const isDefault = branch.name === this.defaultBranch;

      const { status, action, risk, reasons } = classifyBranch(
        daysSince,
        branch.isMerged,
        branch.isProtected,
        isDefault,
        this.thresholdDays,
        branch.aheadOfDefault
      );

      const associatedPRs = prMap.get(branch.name) || [];

      if (associatedPRs.length > 0) {
        const openPRs = associatedPRs.filter((p) => p.state === 'open').length;
        const mergedPRs = associatedPRs.filter((p) => p.state === 'merged').length;
        const draftPRs = associatedPRs.filter((p) => p.state === 'draft').length;

        if (openPRs > 0) {
          reasons.push(`关联 ${openPRs} 个开放 PR`);
        }
        if (draftPRs > 0) {
          reasons.push(`关联 ${draftPRs} 个草稿 PR`);
        }
        if (mergedPRs > 0 && !branch.isMerged) {
          reasons.push(`有 ${mergedPRs} 个 PR 已合并但分支仍存在`);
        }
      }

      analyzed.push({
        ...branch,
        daysSinceLastCommit: daysSince,
        status,
        associatedPRs,
        action,
        riskLevel: risk,
        reasons,
      });
    }

    return analyzed.sort((a, b) => b.daysSinceLastCommit - a.daysSinceLastCommit);
  }

  buildDeletionPlan(
    analyzed: AnalyzedBranch[],
    dryRun: boolean
  ): DeletionPlan {
    const toDelete: DeletionCandidate[] = [];
    const skipped: SkippedBranch[] = [];
    let totalUnmergedCommits = 0;

    for (const branch of analyzed) {
      if (branch.status === 'protected' || branch.status === 'default') {
        skipped.push({
          branchName: branch.name,
          reason: branch.protectionRule
            ? `受保护规则匹配: ${branch.protectionRule.pattern}`
            : branch.name === this.defaultBranch
            ? '默认分支'
            : '分支名称匹配保护模式',
        });
        continue;
      }

      if (branch.action === 'delete' || branch.action === 'archive') {
        const hasOpenPRs = branch.associatedPRs.some((p) => p.state === 'open' || p.state === 'draft');
        if (hasOpenPRs) {
          skipped.push({
            branchName: branch.name,
            reason: `存在开放或草稿 PR，需要人工确认`,
          });
          continue;
        }

        totalUnmergedCommits += branch.aheadOfDefault;

        toDelete.push({
          branchName: branch.name,
          lastCommitter: branch.lastCommit.authorName,
          lastCommitDate: branch.lastCommit.date,
          daysSinceLastCommit: branch.daysSinceLastCommit,
          reason: branch.reasons.join('; '),
          associatedPRs: branch.associatedPRs.map((p) => ({
            number: p.number,
            title: p.title,
            state: p.state,
            url: p.htmlUrl,
          })),
          unmergedCommits: branch.aheadOfDefault,
        });
      } else if (branch.action === 'review') {
        skipped.push({
          branchName: branch.name,
          reason: `需要人工复核: ${branch.reasons.join('; ')}`,
        });
      } else {
        skipped.push({
          branchName: branch.name,
          reason: `活跃分支，暂不处理`,
        });
      }
    }

    return {
      createdAt: new Date().toISOString(),
      repo: this.repo,
      defaultBranch: this.defaultBranch,
      branchesToDelete: toDelete,
      branchesSkipped: skipped,
      summary: {
        totalBranches: analyzed.length,
        toDelete: toDelete.length,
        skipped: skipped.length,
        totalUnmergedCommits,
        estimatedReclaimableBranches: toDelete.length,
      },
      confirmed: false,
      executed: false,
    };
  }

  buildExportData(
    analyzed: AnalyzedBranch[],
    params: ScanParams,
    deletionPlan?: DeletionPlan
  ): ExportData {
    const groups = groupByStatus(analyzed);

    const summary: ExportSummary = {
      total: analyzed.length,
      abandoned: groups.abandoned.length,
      unmerged: groups.unmerged.length,
      stale: groups.stale.length,
      active: groups.active.length,
      protected: groups.protected.length,
      defaultBranch: this.defaultBranch,
    };

    return {
      generatedAt: new Date().toISOString(),
      repo: this.repo,
      params,
      summary,
      abandoned: groups.abandoned,
      unmerged: groups.unmerged,
      stale: groups.stale,
      active: groups.active,
      protected: groups.protected,
      deletionPlan,
    };
  }
}
