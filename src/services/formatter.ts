import Table from 'cli-table3';
import chalk from 'chalk';
import type {
  AnalyzedBranch,
  DeletionPlan,
  DeletionCandidate,
  ExportData,
  PullRequestInfo,
} from '../types/index.js';
import {
  formatDate,
  formatRelative,
  statusColor,
  actionColor,
  riskColor,
  truncate,
} from '../utils/index.js';

export class Formatter {
  static printHeader(title: string): void {
    const line = '═'.repeat(80);
    console.log(chalk.cyan(line));
    console.log(chalk.cyan.bold(`  ${title}`));
    console.log(chalk.cyan(line));
    console.log();
  }

  static printSummary(data: ExportData): void {
    console.log(chalk.bold('📊 扫描概览'));
    const table = new Table({
      head: [
        chalk.cyan('指标'),
        chalk.cyan('数量'),
        chalk.cyan('占比'),
      ],
      colWidths: [30, 15, 15],
    });

    const total = Math.max(data.summary.total, 1);
    const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;

    table.push(
      ['分支总数', data.summary.total, '100%'],
      [chalk.red('疑似废弃'), data.summary.abandoned, chalk.red(pct(data.summary.abandoned))],
      [chalk.yellow('有未合并提交'), data.summary.unmerged, chalk.yellow(pct(data.summary.unmerged))],
      [chalk.blue('陈旧分支'), data.summary.stale, chalk.blue(pct(data.summary.stale))],
      [chalk.green('活跃分支'), data.summary.active, chalk.green(pct(data.summary.active))],
      [chalk.magenta('受保护分支'), data.summary.protected, chalk.magenta(pct(data.summary.protected))],
    );

    console.log(table.toString());
    console.log(chalk.gray(`  默认分支: ${data.summary.defaultBranch}`));
    console.log();
  }

  static printBranchTable(title: string, branches: AnalyzedBranch[]): void {
    if (branches.length === 0) return;

    console.log(chalk.bold(title));
    const table = new Table({
      head: [
        chalk.cyan('分支名'),
        chalk.cyan('状态'),
        chalk.cyan('操作建议'),
        chalk.cyan('风险'),
        chalk.cyan('最后提交'),
        chalk.cyan('提交人'),
        chalk.cyan('领先'),
        chalk.cyan('PR'),
      ],
      colWidths: [30, 12, 12, 10, 20, 15, 8, 8],
      wordWrap: true,
    });

    for (const b of branches) {
      const prCount = b.associatedPRs.length;
      const prStr = prCount > 0
        ? (b.associatedPRs.some(p => p.state === 'open') ? chalk.yellow(`${prCount}`) : chalk.cyan(`${prCount}`))
        : chalk.gray('-');

      table.push([
        chalk.white(truncate(b.name, 28)),
        statusColor(b.status),
        actionColor(b.action),
        riskColor(b.riskLevel),
        `${formatDate(b.lastCommit.date)}\n${chalk.gray(formatRelative(b.lastCommit.date))}`,
        truncate(b.lastCommit.authorName, 13),
        b.aheadOfDefault > 0 ? chalk.yellow(`+${b.aheadOfDefault}`) : chalk.green('0'),
        prStr,
      ]);
    }

    console.log(table.toString());
    console.log();
  }

  static printAbandonedBranches(branches: AnalyzedBranch[]): void {
    this.printBranchTable(chalk.red.bold('⚠️  疑似废弃分支 (Abandoned)'), branches);
    if (branches.length > 0) {
      console.log(chalk.red.italic('  💡 建议：这些分支长期未活动且代码已合并，可考虑清理'));
      console.log();
    }
  }

  static printUnmergedBranches(branches: AnalyzedBranch[]): void {
    this.printBranchTable(chalk.yellow.bold('🔀 有未合并提交的分支 (Unmerged)'), branches);
    if (branches.length > 0) {
      console.log(chalk.yellow.italic('  💡 建议：这些分支领先默认分支，需人工确认是否要保留或合并'));
      console.log();
    }
  }

  static printStaleBranches(branches: AnalyzedBranch[]): void {
    this.printBranchTable(chalk.blue.bold('⏳ 陈旧分支 (Stale)'), branches);
    if (branches.length > 0) {
      console.log(chalk.blue.italic('  💡 建议：长期未活动，建议归档或通知提交人处理'));
      console.log();
    }
  }

  static printActiveBranches(branches: AnalyzedBranch[]): void {
    this.printBranchTable(chalk.green.bold('✅ 活跃分支 (Active)'), branches);
  }

  static printProtectedBranches(branches: AnalyzedBranch[]): void {
    this.printBranchTable(chalk.magenta.bold('🛡️  受保护分支 (Protected)'), branches);
  }

  static printPRDetails(prs: PullRequestInfo[], indent: string = '  '): void {
    if (prs.length === 0) return;
    for (const pr of prs) {
      const stateColor = pr.state === 'open' ? chalk.green
        : pr.state === 'merged' ? chalk.magenta
        : pr.state === 'draft' ? chalk.gray
        : chalk.red;
      console.log(`${indent}${stateColor(`#${pr.number} [${pr.state.toUpperCase()}]`)} ${chalk.white(truncate(pr.title, 50))}`);
      console.log(`${indent}  ${chalk.gray(`Author: ${pr.author} | Updated: ${formatRelative(pr.updatedAt)}`)}`);
      console.log(`${indent}  ${chalk.cyan(pr.htmlUrl)}`);
    }
  }

  static printBranchDetails(branch: AnalyzedBranch): void {
    console.log(chalk.bold(`\n📂 分支: ${branch.name}`));
    console.log(`  状态: ${statusColor(branch.status)} | 建议: ${actionColor(branch.action)} | 风险: ${riskColor(branch.riskLevel)}`);
    console.log(`  最后提交: ${formatDate(branch.lastCommit.date)} (${formatRelative(branch.lastCommit.date)})`);
    console.log(`  提交人: ${branch.lastCommit.authorName} <${branch.lastCommit.authorEmail}>`);
    console.log(`  提交信息: ${truncate(branch.lastCommit.message, 80)}`);
    console.log(`  领先默认分支: ${branch.aheadOfDefault} 提交 | 落后: ${branch.behindDefault} 提交`);
    if (branch.isMerged) console.log(`  ${chalk.green('✓ 代码已合并到默认分支')}`);
    if (branch.isProtected) {
      console.log(`  ${chalk.magenta('🛡️  分支受保护')}`);
      if (branch.protectionRule) {
        console.log(`    规则: ${branch.protectionRule.pattern}`);
        if (branch.protectionRule.requiresApprovingReviews) {
          console.log(`    需要 ${branch.protectionRule.requiredApprovingReviewCount || '?'} 个审批`);
        }
      }
    }
    console.log(`  原因:`);
    for (const r of branch.reasons) {
      console.log(`    • ${r}`);
    }
    if (branch.associatedPRs.length > 0) {
      console.log(`  关联 PRs:`);
      this.printPRDetails(branch.associatedPRs, '    ');
    }
  }

  static printDeletionPlan(plan: DeletionPlan): void {
    console.log(chalk.bold.red('\n📋 删除计划 (Deletion Plan)'));
    console.log(chalk.gray(`  生成时间: ${formatDate(plan.createdAt)}`));
    console.log(chalk.gray(`  仓库: ${plan.repo} | 默认分支: ${plan.defaultBranch}`));
    console.log();

    const summary = new Table({
      head: [chalk.cyan('项目'), chalk.cyan('数值')],
    });
    summary.push(
      ['扫描分支总数', plan.summary.totalBranches],
      [chalk.red('计划删除'), chalk.red(plan.summary.toDelete)],
      [chalk.yellow('跳过(需人工)'), chalk.yellow(plan.summary.skipped)],
      [chalk.magenta('涉及未合并提交总数'), chalk.magenta(plan.summary.totalUnmergedCommits)],
    );
    console.log(summary.toString());
    console.log();

    if (plan.branchesToDelete.length > 0) {
      console.log(chalk.red.bold(`将删除以下 ${plan.branchesToDelete.length} 个分支:`));
      this.printCandidatesTable(plan.branchesToDelete);
    }

    if (plan.branchesSkipped.length > 0) {
      console.log(chalk.yellow.bold(`\n跳过以下 ${plan.branchesSkipped.length} 个分支(需人工确认):`));
      const skipTable = new Table({
        head: [chalk.cyan('分支名'), chalk.cyan('跳过原因')],
        colWidths: [35, 60],
        wordWrap: true,
      });
      for (const s of plan.branchesSkipped) {
        skipTable.push([chalk.white(truncate(s.branchName, 32)), s.reason]);
      }
      console.log(skipTable.toString());
    }
  }

  static printCandidatesTable(candidates: DeletionCandidate[]): void {
    const table = new Table({
      head: [
        chalk.cyan('#'),
        chalk.cyan('分支名'),
        chalk.cyan('最近提交人'),
        chalk.cyan('最后提交'),
        chalk.cyan('距今'),
        chalk.cyan('未合并提交'),
        chalk.cyan('关联PR'),
        chalk.cyan('原因'),
      ],
      colWidths: [4, 30, 15, 18, 10, 12, 12, 35],
      wordWrap: true,
    });

    candidates.forEach((c, i) => {
      const prList = c.associatedPRs
        .map(p => `#${p.number}[${p.state}]`)
        .join(',') || '-';
      table.push([
        chalk.gray(String(i + 1)),
        chalk.red(truncate(c.branchName, 28)),
        c.lastCommitter,
        formatDate(c.lastCommitDate),
        `${c.daysSinceLastCommit}天`,
        c.unmergedCommits > 0 ? chalk.yellow(`+${c.unmergedCommits}`) : '0',
        prList,
        truncate(c.reason, 32),
      ]);
    });

    console.log(table.toString());
  }

  static toJson(data: unknown, pretty: boolean = true): string {
    return JSON.stringify(data, null, pretty ? 2 : 0);
  }

  static toCSV(data: ExportData): string {
    const headers = [
      '分支名',
      '状态',
      '建议动作',
      '风险等级',
      '最后提交日期',
      '最后提交人',
      '最后提交邮箱',
      '领先默认分支(提交数)',
      '落后默认分支(提交数)',
      '是否已合并',
      '是否受保护',
      '距今天数',
      '关联PR数量',
      '开放PR数量',
      '原因',
    ];
    const lines = [headers.join(',')];

    const all = [
      ...data.abandoned,
      ...data.unmerged,
      ...data.stale,
      ...data.active,
      ...data.protected,
    ];

    for (const b of all) {
      const openPRs = b.associatedPRs.filter(p => p.state === 'open').length;
      const row = [
        b.name,
        b.status,
        b.action,
        b.riskLevel,
        b.lastCommit.date,
        `"${b.lastCommit.authorName}"`,
        b.lastCommit.authorEmail,
        b.aheadOfDefault,
        b.behindDefault,
        b.isMerged,
        b.isProtected,
        b.daysSinceLastCommit,
        b.associatedPRs.length,
        openPRs,
        `"${b.reasons.join('; ').replace(/"/g, '""')}"`,
      ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  static toMarkdown(data: ExportData, includePlan: boolean = false): string {
    const lines: string[] = [];
    lines.push(`# Git 分支清理报告`);
    lines.push('');
    lines.push(`> 生成时间: ${formatDate(data.generatedAt)}`);
    lines.push(`> 仓库: ${data.repo}`);
    lines.push(`> 参数: --days=${data.params.days}`);
    lines.push('');
    lines.push('## 概览');
    lines.push('');
    lines.push('| 指标 | 数量 |');
    lines.push('|------|------|');
    lines.push(`| 分支总数 | ${data.summary.total} |`);
    lines.push(`| 疑似废弃 | ${data.summary.abandoned} |`);
    lines.push(`| 有未合并提交 | ${data.summary.unmerged} |`);
    lines.push(`| 陈旧分支 | ${data.summary.stale} |`);
    lines.push(`| 活跃分支 | ${data.summary.active} |`);
    lines.push(`| 受保护分支 | ${data.summary.protected} |`);
    lines.push('');

    const addSection = (title: string, branches: AnalyzedBranch[]) => {
      if (branches.length === 0) return;
      lines.push(`## ${title}`);
      lines.push('');
      lines.push('| 分支名 | 状态 | 建议 | 风险 | 最后提交 | 提交人 | 领先 | PR |');
      lines.push('|--------|------|------|------|----------|--------|------|----|');
      for (const b of branches) {
        const prLinks = b.associatedPRs.slice(0, 3)
          .map(p => `[#${p.number}](${p.htmlUrl})`)
          .join(', ');
        lines.push(
          `| ${b.name} | ${b.status} | ${b.action} | ${b.riskLevel} | ${formatDate(b.lastCommit.date)} | ${b.lastCommit.authorName} | +${b.aheadOfDefault} | ${prLinks || '-'} |`
        );
      }
      lines.push('');
    };

    addSection('⚠️ 疑似废弃分支', data.abandoned);
    addSection('🔀 有未合并提交的分支', data.unmerged);
    addSection('⏳ 陈旧分支', data.stale);
    addSection('✅ 活跃分支', data.active);
    addSection('🛡️ 受保护分支', data.protected);

    if (includePlan && data.deletionPlan) {
      lines.push('## 📋 删除计划');
      lines.push('');
      lines.push(`| 项目 | 数值 |`);
      lines.push(`|------|------|`);
      lines.push(`| 计划删除 | ${data.deletionPlan.summary.toDelete} |`);
      lines.push(`| 跳过 | ${data.deletionPlan.summary.skipped} |`);
      lines.push(`| 涉及未合并提交 | ${data.deletionPlan.summary.totalUnmergedCommits} |`);
      lines.push('');
    }

    return lines.join('\n');
  }

  static printExecutionResult(
    executed: string[],
    failed: { branch: string; error: string }[],
    dryRun: boolean
  ): void {
    const action = dryRun ? '模拟执行' : '执行';
    console.log(chalk.bold(`\n🎯 ${action}结果`));
    console.log(chalk.green(`  成功: ${executed.length} 个`));
    if (executed.length > 0) {
      for (const b of executed) {
        console.log(`    ${dryRun ? '[DRY-RUN] ' : '✓ '}${chalk.green(b)}`);
      }
    }
    if (failed.length > 0) {
      console.log(chalk.red(`  失败: ${failed.length} 个`));
      for (const f of failed) {
        console.log(`    ✗ ${chalk.red(f.branch)}: ${f.error}`);
      }
    }
  }
}
