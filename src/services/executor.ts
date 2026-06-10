import chalk from 'chalk';
import type { DeletionPlan, DeletionCandidate } from '../types/index.js';
import { GitService } from './gitService.js';
import { Formatter } from './formatter.js';
import { confirmPrompt, formatRelative, truncate } from '../utils/index.js';

export interface ExecutionResult {
  executed: string[];
  failed: { branch: string; error: string }[];
  dryRun: boolean;
}

export class BranchExecutor {
  private git: GitService;
  private dryRun: boolean;

  constructor(git: GitService, dryRun: boolean = false) {
    this.git = git;
    this.dryRun = dryRun;
  }

  validatePlanSafety(plan: DeletionPlan): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const candidate of plan.branchesToDelete) {
      if (this.isLikelyProtected(candidate.branchName)) {
        errors.push(`分支 ${candidate.branchName} 名称疑似受保护分支，已从删除计划移除`);
      }

      if (candidate.unmergedCommits > 50) {
        warnings.push(
          `分支 ${candidate.branchName} 有 ${candidate.unmergedCommits} 个未合并提交，建议仔细确认`
        );
      }

      if (candidate.daysSinceLastCommit < 7) {
        warnings.push(
          `分支 ${candidate.branchName} 最后提交在 ${candidate.daysSinceLastCommit} 天内，可能仍在活跃`
        );
      }
    }

    const toDeleteSet = new Set(plan.branchesToDelete.map(b => b.branchName));
    for (const skipped of plan.branchesSkipped) {
      if (toDeleteSet.has(skipped.branchName)) {
        errors.push(`分支 ${skipped.branchName} 同时出现在删除和跳过列表中`);
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  private isLikelyProtected(name: string): boolean {
    const dangerous = [
      /^main$/,
      /^master$/,
      /^develop$/,
      /^dev$/,
      /^release\/.*/,
      /^hotfix\/.*/,
      /^production$/,
      /^prod$/,
      /^staging$/,
      /^uat$/,
      /^v\d+\.\d+.*$/,
    ];
    return dangerous.some((p) => p.test(name.toLowerCase()));
  }

  sanitizePlan(plan: DeletionPlan): DeletionPlan {
    const removed: string[] = [];
    const filteredCandidates = plan.branchesToDelete.filter((c) => {
      if (this.isLikelyProtected(c.branchName)) {
        removed.push(c.branchName);
        return false;
      }
      return true;
    });

    const newSkipped = [
      ...plan.branchesSkipped,
      ...removed.map((name) => ({
        branchName: name,
        reason: '安全检查：疑似受保护分支，自动从删除列表移除',
      })),
    ];

    return {
      ...plan,
      branchesToDelete: filteredCandidates,
      branchesSkipped: newSkipped,
      summary: {
        ...plan.summary,
        toDelete: filteredCandidates.length,
        skipped: newSkipped.length,
      },
    };
  }

  async askUserConfirmation(plan: DeletionPlan, autoApprove: boolean = false): Promise<boolean> {
    if (autoApprove) {
      console.log(chalk.yellow('⚠️  --auto-approve 已启用，跳过人工确认'));
      return plan.branchesToDelete.length > 0;
    }

    if (plan.branchesToDelete.length === 0) {
      console.log(chalk.gray('删除计划为空，无分支需要处理'));
      return false;
    }

    console.log('\n' + chalk.bold.red('⚠️  ⚠️  ⚠️  重要安全提示  ⚠️  ⚠️  ⚠️'));
    console.log(chalk.red(
      '即将从远程仓库永久删除以下分支。此操作不可撤销！'
    ));
    console.log(chalk.red(
      `共 ${plan.branchesToDelete.length} 个分支将被删除。`
    ));

    if (plan.summary.totalUnmergedCommits > 0) {
      console.log(chalk.yellow(
        `⚠️  其中包含 ${plan.summary.totalUnmergedCommits} 个未合并到默认分支的提交！`
      ));
    }

    console.log();
    this.printHighRiskCandidates(plan.branchesToDelete);
    console.log();

    if (plan.branchesToDelete.length > 20) {
      console.log(chalk.yellow(
        `⚠️  删除数量较大 (${plan.branchesToDelete.length})，请仔细核查。`
      ));
    }

    const confirm1 = await confirmPrompt(
      chalk.bold(`您是否确认要删除以上 ${plan.branchesToDelete.length} 个分支？`)
    );
    if (!confirm1) {
      console.log(chalk.gray('已取消删除操作。'));
      return false;
    }

    const secondCheck = plan.branchesToDelete.length > 10 || plan.summary.totalUnmergedCommits > 0;
    if (secondCheck) {
      const sampleCount = Math.min(3, plan.branchesToDelete.length);
      const samples = plan.branchesToDelete
        .slice(0, sampleCount)
        .map((c) => c.branchName)
        .join('、');

      const confirm2 = await confirmPrompt(
        chalk.bold.red(
          `二次确认：真的要删除吗？例如: ${samples}... 等 ${plan.branchesToDelete.length} 个分支`
        )
      );
      if (!confirm2) {
        console.log(chalk.gray('二次确认失败，已取消。'));
        return false;
      }
    }

    return true;
  }

  private printHighRiskCandidates(candidates: DeletionCandidate[]): void {
    const highRisk = candidates.filter(
      (c) => c.unmergedCommits > 0 || c.daysSinceLastCommit < 30
    );
    if (highRisk.length === 0) return;

    console.log(chalk.yellow('以下分支需要特别注意：'));
    for (const c of highRisk.slice(0, 10)) {
      const flags: string[] = [];
      if (c.unmergedCommits > 0) flags.push(chalk.magenta(`${c.unmergedCommits}未合并提交`));
      if (c.daysSinceLastCommit < 30) flags.push(chalk.yellow(`${c.daysSinceLastCommit}天内活动`));
      console.log(
        `  • ${chalk.white(c.branchName)} [${flags.join(', ')}] - ${c.lastCommitter} (${formatRelative(c.lastCommitDate)})`
      );
      if (c.associatedPRs.length > 0) {
        for (const pr of c.associatedPRs.slice(0, 2)) {
          console.log(
            `    PR #${pr.number} [${pr.state.toUpperCase()}]: ${truncate(pr.title, 50)}`
          );
        }
      }
    }
  }

  async executeDeletion(plan: DeletionPlan): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      executed: [],
      failed: [],
      dryRun: this.dryRun,
    };

    if (plan.branchesToDelete.length === 0) {
      return result;
    }

    const safePlan = this.sanitizePlan(plan);

    if (safePlan.branchesToDelete.length !== plan.branchesToDelete.length) {
      console.log(chalk.yellow(
        `安全检查移除了 ${plan.branchesToDelete.length - safePlan.branchesToDelete.length} 个疑似受保护分支`
      ));
    }

    const total = safePlan.branchesToDelete.length;
    console.log();
    console.log(chalk.bold(
      `${this.dryRun ? '[DRY-RUN] 模拟' : '开始'}处理 ${total} 个分支...`
    ));

    for (let i = 0; i < total; i++) {
      const candidate = safePlan.branchesToDelete[i];
      const progress = `[${i + 1}/${total}]`;

      try {
        if (this.dryRun) {
          console.log(chalk.gray(`${progress} ${chalk.green('[SIMULATE]')} 删除分支 ${candidate.branchName}`));
          result.executed.push(candidate.branchName);
        } else {
          await this.git.deleteRemoteBranch(candidate.branchName);
          console.log(chalk.gray(`${progress} ${chalk.green('✓')} 已删除 ${candidate.branchName}`));
          result.executed.push(candidate.branchName);
        }
      } catch (err: any) {
        const errMsg = err.message || '未知错误';
        console.log(chalk.gray(`${progress} ${chalk.red('✗')} 删除失败 ${candidate.branchName}: ${errMsg}`));
        result.failed.push({
          branch: candidate.branchName,
          error: errMsg,
        });
      }
    }

    return result;
  }
}
