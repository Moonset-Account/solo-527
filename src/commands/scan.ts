import chalk from 'chalk';
import type { AnalyzedBranch, ExportData, ScanParams } from '../types/index.js';
import { GitService } from '../services/gitService.js';
import { GitHubService } from '../services/githubService.js';
import { Analyzer } from '../services/analyzer.js';
import { Formatter } from '../services/formatter.js';
import { groupByStatus } from '../utils/index.js';

export interface ScanResult {
  analyzed: AnalyzedBranch[];
  exportData: ExportData;
  defaultBranch: string;
  git: GitService;
  github: GitHubService;
  analyzer: Analyzer;
}

export async function runScan(params: ScanParams): Promise<ScanResult> {
  const { repo, days, json, dryRun, token, defaultBranch: defaultBranchArg, remote } = params;

  if (dryRun) {
    console.log(chalk.cyan('[DRY-RUN] 试运行模式：不会对远端做任何修改\n'));
  }

  const git = new GitService(repo, remote);
  const github = new GitHubService(repo, token);

  if (!json) {
    Formatter.printHeader('Git 分支清理扫描工具');
    console.log(chalk.gray(`仓库: ${repo}`));
    console.log(chalk.gray(`陈旧阈值: ${days} 天`));
    console.log();
  }

  const repoUrl = await git.getRepoUrl();
  if (repoUrl && !json) {
    console.log(chalk.gray(`远端地址: ${repoUrl}`));
  }

  const defaultBranch = defaultBranchArg || (await git.detectDefaultBranch());
  if (!json) {
    console.log(chalk.cyan(`检测到默认分支: ${defaultBranch}`));
  }

  if (!json) console.log(chalk.cyan('\n🔍 正在读取分支信息...'));
  const protectionRulesFromGH = github.isAvailable()
    ? await github.fetchBranchProtectionRules()
    : [];
  const localRules = git.buildLocalProtectionRules();
  const allProtectionRules = [...protectionRulesFromGH, ...localRules];

  const branchesInfo = await git.getBranchesInfo(defaultBranch, allProtectionRules);
  if (!json) console.log(chalk.green(`  ✓ 读取到 ${branchesInfo.length} 个远端分支`));

  let prMap: Map<string, any> = new Map();
  if (github.isAvailable()) {
    if (!json) console.log(chalk.cyan('🔍 正在获取关联 PR 信息...'));
    prMap = await github.fetchAllPullRequests();
    if (!json) console.log(chalk.green(`  ✓ 获取到 ${prMap.size} 个分支的 PR 数据`));
  } else if (!json) {
    console.log(chalk.yellow('  ⚠️  GitHub API 不可用（未配置 GITHUB_TOKEN），跳过 PR 关联'));
  }

  const analyzer = new Analyzer(defaultBranch, days, repo);
  if (!json) console.log(chalk.cyan('\n📊 正在分析分支状态...'));
  const analyzed = analyzer.analyzeBranches(branchesInfo, prMap);

  const exportData = analyzer.buildExportData(analyzed, params);

  if (json) {
    console.log(Formatter.toJson(exportData));
  } else {
    Formatter.printSummary(exportData);
    const groups = groupByStatus(analyzed);
    Formatter.printAbandonedBranches(groups.abandoned);
    Formatter.printUnmergedBranches(groups.unmerged);
    Formatter.printStaleBranches(groups.stale);
    if (groups.active.length <= 30) {
      Formatter.printActiveBranches(groups.active);
    } else {
      console.log(chalk.green(`  ✓ 活跃分支 ${groups.active.length} 个（数量较多，省略详细列表）`));
    }
    Formatter.printProtectedBranches(groups.protected);

    printAdvice(exportData);
  }

  return { analyzed, exportData, defaultBranch, git, github, analyzer };
}

function printAdvice(data: ExportData): void {
  console.log(chalk.bold('💡 建议归档动作'));
  console.log();

  if (data.summary.abandoned > 0) {
    console.log(chalk.red(
      `  1. 清理 ${data.summary.abandoned} 个疑似废弃分支：运行 ${chalk.bold('plan')} 命令生成删除计划`
    ));
  }

  if (data.summary.unmerged > 0) {
    console.log(chalk.yellow(
      `  2. 处理 ${data.summary.unmerged} 个有未合并提交的分支：通知提交人确认是否需要保留或合并`
    ));
  }

  if (data.summary.stale > 0) {
    console.log(chalk.blue(
      `  3. 归档 ${data.summary.stale} 个陈旧分支：标记归档并提醒相关人员`
    ));
  }

  if (data.summary.abandoned === 0 && data.summary.stale === 0 && data.summary.unmerged === 0) {
    console.log(chalk.green('  仓库分支状态良好，无需执行清理操作 🎉'));
  }

  console.log();
  console.log(chalk.gray('  下一步：'));
  console.log(chalk.cyan('    • 生成删除计划: npm run dev -- plan --repo <仓库路径> --days 30'));
  console.log(chalk.cyan('    • 导出报告: npm run dev -- export --repo <仓库路径> --output report.json'));
  console.log();
}
