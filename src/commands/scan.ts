import fs from 'fs';
import chalk from 'chalk';
import type {
  AnalyzedBranch,
  BranchInfo,
  ExportData,
  ScanParams,
  BranchProtectionRule,
  ResolvedRepoContext,
} from '../types/index.js';
import { GitService } from '../services/gitService.js';
import { GitHubService } from '../services/githubService.js';
import { Analyzer } from '../services/analyzer.js';
import { Formatter } from '../services/formatter.js';
import { groupByStatus, parseRepoUrl } from '../utils/index.js';

export interface ScanResult {
  analyzed: AnalyzedBranch[];
  exportData: ExportData;
  defaultBranch: string;
  git: GitService | null;
  github: GitHubService | null;
  analyzer: Analyzer;
  context: ResolvedRepoContext;
  protectionRules: BranchProtectionRule[];
}

function isLocalRepoPath(input: string): boolean {
  if (!input) return false;
  if (input.includes('://') || input.startsWith('git@')) return false;
  if (/^[^/\s]+\/[^/\s]+$/.test(input) && !input.startsWith('/') && !input.startsWith('.')) {
    if (fs.existsSync(input) && fs.statSync(input).isDirectory()) return true;
    return false;
  }
  return fs.existsSync(input) && fs.statSync(input).isDirectory();
}

export async function resolveRepoContext(
  repoInput: string,
  remoteName: string,
  explicitOwner?: string,
  explicitRepoName?: string
): Promise<ResolvedRepoContext> {
  const ctx: ResolvedRepoContext = {
    localRepoPath: null,
    githubOwner: null,
    githubRepo: null,
    remoteUrl: null,
    autoDetected: false,
  };

  if (isLocalRepoPath(repoInput)) {
    ctx.localRepoPath = repoInput;
    try {
      const git = new GitService(repoInput, remoteName);
      const remoteUrl = await git.getRepoUrl();
      if (remoteUrl) {
        ctx.remoteUrl = remoteUrl;
        const parsed = parseRepoUrl(remoteUrl);
        if (parsed.owner && parsed.name) {
          ctx.githubOwner = parsed.owner;
          ctx.githubRepo = parsed.name;
          ctx.autoDetected = true;
        }
      }
    } catch {}
  } else {
    const parsed = parseRepoUrl(repoInput);
    if (parsed.owner && parsed.name) {
      ctx.githubOwner = parsed.owner;
      ctx.githubRepo = parsed.name;
    }
  }

  if (explicitOwner && explicitRepoName) {
    ctx.githubOwner = explicitOwner;
    ctx.githubRepo = explicitRepoName;
    ctx.autoDetected = false;
  }

  return ctx;
}

async function obtainBranchesAndDefault(
  ctx: ResolvedRepoContext,
  git: GitService | null,
  github: GitHubService | null,
  explicitDefaultBranch?: string,
  remoteName: string = 'origin'
): Promise<{ branches: BranchInfo[]; defaultBranch: string }> {
  let branches: BranchInfo[] = [];
  let defaultBranch = explicitDefaultBranch || '';

  if (git && ctx.localRepoPath) {
    try {
      if (!defaultBranch) defaultBranch = await git.detectDefaultBranch();
      branches = await git.getBranchesInfo(defaultBranch, []);
      return { branches, defaultBranch };
    } catch (err: any) {
      if (github && github.isAvailable()) {
        console.warn(chalk.yellow(`本地 Git 读取失败(${err.message})，降级使用 GitHub API...`));
      } else {
        throw err;
      }
    }
  }

  if (github && github.isAvailable()) {
    const viaApi = await github.fetchBranchesViaApi();
    if (!defaultBranch && viaApi.defaultBranch) defaultBranch = viaApi.defaultBranch;
    if (!defaultBranch) defaultBranch = 'main';
    if (viaApi.branches.length > 0) branches = viaApi.branches;
  }

  if (branches.length === 0) {
    throw new Error(
      '无法获取分支信息：请提供有效的本地 Git 仓库路径，或配置 GITHUB_TOKEN 并使用 owner/repo 格式'
    );
  }

  return { branches, defaultBranch };
}

async function obtainProtectionRules(
  ctx: ResolvedRepoContext,
  git: GitService | null,
  github: GitHubService | null
): Promise<BranchProtectionRule[]> {
  const rules: BranchProtectionRule[] = [];

  if (github && github.isAvailable()) {
    const fromApi = await github.fetchBranchProtectionRules();
    rules.push(...fromApi);
  }

  if (git) {
    const localRules = git.buildLocalProtectionRules();
    for (const lr of localRules) {
      if (!rules.some((r) => r.pattern === lr.pattern)) {
        rules.push(lr);
      }
    }
  }

  return rules;
}

function applyProtectionToBranches(
  branches: BranchInfo[],
  rules: BranchProtectionRule[],
  defaultBranch: string,
  git: GitService | null
): BranchInfo[] {
  return branches.map((b) => {
    const matched = git ? git.matchProtectionRule(b.name, rules) : rules.find((r) => {
      const pattern = r.pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');
      return new RegExp(`^${pattern}$`, 'i').test(b.name);
    });
    const isProtected =
      b.name === defaultBranch || !!matched || !!b.isProtected;
    return {
      ...b,
      isProtected,
      protectionRule: matched || b.protectionRule,
    };
  });
}

export async function runScan(params: ScanParams): Promise<ScanResult> {
  const {
    repo,
    days,
    json,
    dryRun,
    token,
    defaultBranch: defaultBranchArg,
    remote,
    githubOwner,
    githubRepo,
  } = params;

  if (dryRun && !json) {
    console.log(chalk.cyan('[DRY-RUN] 试运行模式：不会对远端做任何修改\n'));
  }

  const ctx = await resolveRepoContext(repo, remote || 'origin', githubOwner, githubRepo);

  let git: GitService | null = null;
  if (ctx.localRepoPath) {
    git = new GitService(ctx.localRepoPath, remote);
  }

  let github: GitHubService | null = null;
  if (ctx.githubOwner && ctx.githubRepo) {
    github = GitHubService.fromOwnerName(ctx.githubOwner, ctx.githubRepo, token);
  } else if (!ctx.localRepoPath) {
    github = new GitHubService(repo, token);
  }

  if (!json) {
    Formatter.printHeader('Git 分支清理扫描工具');
    console.log(chalk.gray(`扫描目标: ${repo}`));
    if (ctx.localRepoPath) console.log(chalk.gray(`本地仓库: ${ctx.localRepoPath}`));
    if (ctx.remoteUrl) console.log(chalk.gray(`远端地址: ${ctx.remoteUrl}`));
    if (ctx.githubOwner && ctx.githubRepo) {
      const flag = ctx.autoDetected ? ' (从 remote 自动解析)' : '';
      console.log(chalk.cyan(`GitHub 仓库: ${ctx.githubOwner}/${ctx.githubRepo}${flag}`));
    }
    if (github?.isAvailable()) {
      console.log(chalk.green('✓ GitHub API 已连接（可获取 PR / 真实保护规则）'));
    } else if (ctx.githubOwner && ctx.githubRepo) {
      console.log(chalk.yellow('⚠️  未配置 GITHUB_TOKEN，无法获取 PR 和真实保护规则'));
    } else if (!ctx.localRepoPath) {
      console.log(chalk.yellow('⚠️  无法解析 GitHub 仓库信息，将只能使用本地推断规则'));
    }
    console.log(chalk.gray(`陈旧阈值: ${days} 天`));
    console.log();
  }

  const { branches: rawBranches, defaultBranch } = await obtainBranchesAndDefault(
    ctx,
    git,
    github,
    defaultBranchArg,
    remote
  );

  if (!json) console.log(chalk.cyan(`🔍 检测到默认分支: ${defaultBranch}`));

  if (!json) console.log(chalk.cyan('\n🔍 正在读取分支保护规则...'));
  const protectionRules = await obtainProtectionRules(ctx, git, github);
  const protectedBranchNames = protectionRules.map((r) => r.pattern);
  if (!json) {
    console.log(
      chalk.green(
        `  ✓ 加载 ${protectionRules.length} 条规则${protectedBranchNames.length > 0 ? ': ' + protectedBranchNames.slice(0, 5).join(', ') + (protectedBranchNames.length > 5 ? ` 等${protectedBranchNames.length}条` : '') : ''}`
      )
    );
  }

  const branches = applyProtectionToBranches(rawBranches, protectionRules, defaultBranch, git);

  if (!json) console.log(chalk.cyan(`\n🔍 读取到 ${branches.length} 个远端分支`));

  let prMap: Map<string, any> = new Map();
  if (github && github.isAvailable()) {
    if (!json) console.log(chalk.cyan('🔍 正在批量获取关联 PR 信息...'));
    prMap = await github.fetchAllPullRequests();
    const prCount = Array.from(prMap.values()).reduce((sum, arr) => sum + arr.length, 0);
    if (!json) {
      console.log(
        chalk.green(
          `  ✓ 获取到 ${prMap.size} 个分支共 ${prCount} 条关联 PR 数据`
        )
      );
    }
  } else if (!json) {
    console.log(
      chalk.yellow(
        '  ⚠️  跳过 PR 关联（需 GITHUB_TOKEN + 可解析的 GitHub 仓库）'
      )
    );
  }

  const analyzer = new Analyzer(defaultBranch, days, repo);
  if (!json) console.log(chalk.cyan('\n📊 正在分析分支状态...'));
  const analyzed = analyzer.analyzeBranches(branches, prMap);

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

  return { analyzed, exportData, defaultBranch, git, github, analyzer, context: ctx, protectionRules };
}

function printAdvice(data: ExportData): void {
  console.log(chalk.bold('💡 建议归档动作'));
  console.log();

  if (data.summary.abandoned > 0) {
    console.log(
      chalk.red(
        `  1. 清理 ${data.summary.abandoned} 个疑似废弃分支：运行 ${chalk.bold('plan --confirm')} 命令生成并执行删除计划`
      )
    );
  }

  if (data.summary.unmerged > 0) {
    console.log(
      chalk.yellow(
        `  2. 处理 ${data.summary.unmerged} 个有未合并提交的分支：通知提交人确认是否需要保留或合并`
      )
    );
  }

  if (data.summary.stale > 0) {
    console.log(
      chalk.blue(
        `  3. 归档 ${data.summary.stale} 个陈旧分支：标记归档并提醒相关人员`
      )
    );
  }

  if (
    data.summary.abandoned === 0 &&
    data.summary.stale === 0 &&
    data.summary.unmerged === 0
  ) {
    console.log(chalk.green('  仓库分支状态良好，无需执行清理操作 🎉'));
  }

  console.log();
  console.log(chalk.gray('  下一步：'));
  console.log(
    chalk.cyan(
      '    • 生成并审查删除计划: npm run dev -- plan --repo <目标> --days 30 --dry-run'
    )
  );
  console.log(
    chalk.cyan(
      '    • 确认后执行删除:    npm run dev -- plan --repo <目标> --days 30 --confirm'
    )
  );
  console.log(
    chalk.cyan(
      '    • 导出月度报告:      npm run dev -- export --repo <目标> --output report.md --format md --include-plan'
    )
  );
  console.log();
}
