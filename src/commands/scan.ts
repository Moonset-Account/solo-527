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
): Promise<{ branches: BranchInfo[]; defaultBranch: string; source: 'git' | 'github-api' }> {
  let branches: BranchInfo[] = [];
  let defaultBranch = explicitDefaultBranch || '';
  let source: 'git' | 'github-api' = 'git';

  if (git && ctx.localRepoPath) {
    try {
      if (!defaultBranch) defaultBranch = await git.detectDefaultBranch();
      branches = await git.getBranchesInfo(defaultBranch, []);
      source = 'git';
      return { branches, defaultBranch, source };
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
    if (viaApi.branches.length > 0) {
      branches = viaApi.branches;
      source = 'github-api';
    }
  }

  if (branches.length === 0) {
    throw new Error(
      '无法获取分支信息：请提供有效的本地 Git 仓库路径，或配置 GITHUB_TOKEN 并使用 owner/repo 格式'
    );
  }

  return { branches, defaultBranch, source };
}

async function ensureAheadBehindFilled(
  branches: BranchInfo[],
  defaultBranch: string,
  github: GitHubService | null
): Promise<BranchInfo[]> {
  if (!github || !github.isAvailable()) return branches;
  const missing = branches.filter(
    (b) => b.name !== defaultBranch && b.compareFailed === undefined && b.aheadOfDefault === 0 && b.behindDefault === 0
  );
  const alreadyFailed = branches.filter((b) => b.compareFailed === true && b.name !== defaultBranch);

  if (missing.length === 0 && alreadyFailed.length === 0) return branches;

  if (missing.length > 0) {
    console.warn(
      chalk.cyan(
        `🔍 补算 ${missing.length} 个分支的 ahead/behind（GitHub Compare API）...`
      )
    );
  }

  await Promise.allSettled(
    missing.map(async (b) => {
      const compare = await github.compareCommits(defaultBranch, b.name);
      b.aheadOfDefault = compare.ahead;
      b.behindDefault = compare.behind;
      b.compareStatus = compare.status;
      b.compareFailed = compare.failed;

      if (compare.failed) {
        b.isMerged = false;
      } else if (compare.status === 'identical' || compare.status === 'behind') {
        b.isMerged = true;
      } else if (compare.ahead === 0 && compare.behind > 0) {
        b.isMerged = true;
      } else if (compare.ahead === 0 && compare.behind === 0) {
        b.isMerged = true;
      } else {
        b.isMerged = false;
      }
    })
  );

  return branches;
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
      const auth = (github as any).isAuthenticated && (github as any).isAuthenticated()
        ? '已认证'
        : '匿名访问（速率限制 60 次/小时，建议配置 GITHUB_TOKEN）';
      console.log(chalk.green(`✓ GitHub API 已连接（${auth}）`));
    } else if (ctx.githubOwner && ctx.githubRepo) {
      console.log(chalk.yellow('⚠️  无法初始化 GitHub API，请检查仓库标识是否正确'));
    } else if (!ctx.localRepoPath) {
      console.log(chalk.yellow('⚠️  无法解析 GitHub 仓库信息，将只能使用本地推断规则'));
    }
    console.log(chalk.gray(`陈旧阈值: ${days} 天`));
    console.log();
  }

  const { branches: rawBranches, defaultBranch, source } = await obtainBranchesAndDefault(
    ctx,
    git,
    github,
    defaultBranchArg,
    remote
  );

  if (!json) {
    const sourceLabel = source === 'git' ? '本地 Git 命令' : 'GitHub REST API';
    console.log(chalk.cyan(`🔍 检测到默认分支: ${defaultBranch}`));
    console.log(chalk.gray(`  分支数据源: ${sourceLabel}`));
  }

  if (!json) console.log(chalk.cyan('\n🔍 正在读取分支保护规则...'));
  const protectionRules = await obtainProtectionRules(ctx, git, github);
  const protectedBranchNames = protectionRules.map((r) => r.pattern);
  const realProtectionFromApi = protectionRules.filter((r) => r.source === 'github-api');
  const localInferenceRules = protectionRules.filter((r) => r.source === 'local-inference');
  if (!json) {
    const realCount = realProtectionFromApi.length;
    const localCount = localInferenceRules.length;
    console.log(
      chalk.green(
        `  ✓ 加载 ${protectionRules.length} 条规则（真实 API[source=github-api]: ${realCount}，本地推断[source=local-inference]: ${localCount}）`
      )
    );
    if (protectedBranchNames.length > 0) {
      console.log(chalk.gray(`    规则列表: ${protectedBranchNames.slice(0, 8).join(', ')}${protectedBranchNames.length > 8 ? ` 等${protectedBranchNames.length}条` : ''}`));
    }
    if (realCount > 0) {
      console.log(chalk.gray(`    API 真实规则: ${realProtectionFromApi.map((r) => r.pattern).join(', ')}`));
    }
  }

  const branches = applyProtectionToBranches(rawBranches, protectionRules, defaultBranch, git);

  if (source === 'github-api' || branches.some(b => b.name !== defaultBranch && b.aheadOfDefault === 0 && b.behindDefault === 0)) {
    await ensureAheadBehindFilled(branches, defaultBranch, github);
  }

  if (!json) {
    const unmergedCount = branches.filter((b) => b.aheadOfDefault > 0).length;
    console.log(
      chalk.cyan(
        `\n🔍 读取到 ${branches.length} 个远端分支（其中 ${unmergedCount} 个领先默认分支、存在未合并提交）`
      )
    );
    if (branches.length > 0) {
      const sample = branches[0];
      const hasDate = branches.every((b) => b.lastCommit.date !== '');
      console.log(
        chalk.gray(
          `  分支样例: ${sample.name} | 最后提交: ${sample.lastCommit.date ? new Date(sample.lastCommit.date).toLocaleDateString() : 'N/A'}${sample.lastCommit.authorName ? ' | 提交人: ' + sample.lastCommit.authorName : ''}`
        )
      );
      if (!hasDate) {
        console.warn(chalk.yellow('  ⚠️  部分分支缺少提交时间信息'));
      }
    }
  }

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
    const integrity = printDataIntegrityReport({
      analyzed,
      protectionRules,
      realProtectionFromApi,
      prMap,
      branches,
      defaultBranch,
      github,
    });

    Formatter.printSummary(exportData);

    if (!integrity.allComplete) {
      console.log(chalk.bold.yellow('\n⚠️  数据完整性提示：'));
      for (const w of integrity.warnings) {
        console.log(chalk.yellow(`  • ${w}`));
      }
      console.log();
    }

    const groups = groupByStatus(analyzed);
    Formatter.printAbandonedBranches(groups.abandoned);
    if (groups.unmerged.length > 0) {
      Formatter.printUnmergedBranches(groups.unmerged);
    } else {
      console.log(chalk.bold(chalk.yellow('🔀 有未合并提交的分支 (Unmerged)')));
      console.log(chalk.green('  ✓ 无未合并提交，所有分支代码均已合入默认分支'));
      console.log();
    }
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

function printDataIntegrityReport(ctx: {
  analyzed: AnalyzedBranch[];
  protectionRules: BranchProtectionRule[];
  realProtectionFromApi: BranchProtectionRule[];
  prMap: Map<string, any[]>;
  branches: BranchInfo[];
  defaultBranch: string;
  github: GitHubService | null;
}): { allComplete: boolean; warnings: string[] } {
  const warnings: string[] = [];

  console.log();
  console.log(chalk.bold('📋 本次扫描数据完整性（5 项关键信息）：'));
  console.log();

  const total = ctx.branches.length;
  const hasCommitDate = ctx.branches.filter((b) => b.lastCommit.date !== '').length;
  const hasCommitAuthor = ctx.branches.filter((b) => b.lastCommit.authorName !== '').length;
  const compareFailed = ctx.branches.filter(
    (b) => b.name !== ctx.defaultBranch && b.compareFailed === true
  );
  const compareUnattempted = ctx.branches.filter(
    (b) => b.name !== ctx.defaultBranch && b.compareFailed === undefined && b.aheadOfDefault === 0 && b.behindDefault === 0 && !b.isMerged
  );
  const hasAheadCalc = ctx.branches.filter(
    (b) => b.name === ctx.defaultBranch
      || (b.compareFailed === false && (b.aheadOfDefault !== 0 || b.behindDefault !== 0 || b.isMerged === true))
  ).length;
  const unmergedBranches = ctx.analyzed.filter((b) => b.aheadOfDefault > 0);
  const prBranches = ctx.prMap.size;
  const prTotal = Array.from(ctx.prMap.values()).reduce((s, a) => s + a.length, 0);
  const realApiRules = ctx.realProtectionFromApi.length;
  const localInference = ctx.protectionRules.filter((r) => r.source === 'local-inference').length;
  const allRules = ctx.protectionRules.length;

  let allComplete = true;

  const item = (label: string, detail: string, ok: boolean, warnMsg?: string) => {
    const mark = ok ? chalk.green('✓') : chalk.yellow('△');
    console.log(`  ${mark} ${chalk.bold(label)}: ${detail}`);
    if (!ok) {
      allComplete = false;
      if (warnMsg) warnings.push(warnMsg);
    }
  };

  item(
    '① 远端分支清单',
    `${total} 个分支`,
    total > 0,
    total === 0 ? '未能读取到任何远端分支' : undefined
  );

  item(
    '② 最后提交时间',
    `${hasCommitDate}/${total} 个分支有提交时间${hasCommitAuthor ? `，${hasCommitAuthor}/${total} 有提交人` : ''}`,
    hasCommitDate === total,
    `${total - hasCommitDate} 个分支缺少最后提交时间`
  );

  item(
    '③ 关联 PR 数据',
    ctx.github?.isAvailable()
      ? `${prTotal} 条 PR 记录关联到 ${prBranches} 个分支`
      : '未配置 GITHUB_TOKEN，跳过 PR 关联',
    !ctx.github?.isAvailable() || (ctx.github.isAvailable() && prTotal >= 0),
    ctx.github?.isAvailable() && prTotal === 0
      ? '未获取到任何 PR 数据（仓库可能没有 PR）'
      : undefined
  );

  item(
    '④ 真实保护规则',
    `${allRules} 条（[source=github-api]: ${realApiRules} 条，[source=local-inference]: ${localInference} 条）`,
    realApiRules > 0 || !ctx.github?.isAvailable(),
    ctx.github?.isAvailable() && realApiRules === 0
      ? '未读取到 GitHub 真实保护规则（可能仓库未配置任何保护规则，或 Token 权限不足）'
      : undefined
  );

  const item5Ok = compareFailed.length === 0 && (hasAheadCalc === total || total === 0);
  let item5Detail = `${hasAheadCalc}/${total} 个分支 Compare 成功；共 ${unmergedBranches.length} 个分支存在未合并提交`;
  if (compareFailed.length > 0) {
    item5Detail += chalk.red(`；${compareFailed.length} 个分支 Compare 失败${compareFailed.length <= 5 ? ': ' + compareFailed.map(b => b.name).join(', ') : `: ${compareFailed.slice(0, 5).join(', ')} 等${compareFailed.length}个`}`);
  }
  if (compareUnattempted.length > 0) {
    item5Detail += chalk.yellow(`；${compareUnattempted.length} 个分支未计算（请配置 Token 或检查网络）`);
  }
  const item5Warns: string[] = [];
  if (compareFailed.length > 0) {
    item5Warns.push(`${compareFailed.length} 个分支 Compare 失败，已显式标记 isMerged=false，不会静默当作已合并。失败分支: ${compareFailed.slice(0, 10).map(b => b.name).join(', ')}${compareFailed.length > 10 ? '...' : ''}`);
  }
  if (compareUnattempted.length > 0) {
    item5Warns.push(`${compareUnattempted.length} 个分支未做 Compare，建议配置 GITHUB_TOKEN 以获取准确 ahead/behind`);
  }
  if (total > 0 && hasAheadCalc !== total && compareFailed.length === 0 && compareUnattempted.length === 0) {
    item5Warns.push(`${total - hasAheadCalc} 个分支未能计算 ahead/behind`);
  }

  item(
    '⑤ 未合并提交计算',
    item5Detail,
    item5Ok,
    item5Warns.length > 0 ? item5Warns.join('；') : undefined
  );

  console.log();
  if (allComplete) {
    console.log(chalk.green('  ✓ 以上 5 项关键信息在本次 scan 中全部齐备 ✓'));
  }
  console.log();

  if (compareFailed.length > 0) {
    console.log(chalk.bold.red('⚠️  Compare 失败分支详细清单（已按未合并处理，不会静默当作已合并）：'));
    for (const b of compareFailed.slice(0, 20)) {
      console.log(chalk.red(`  • ${b.name} [status: ${b.compareStatus || 'unknown'}]`));
    }
    if (compareFailed.length > 20) {
      console.log(chalk.gray(`  ... 等 ${compareFailed.length} 个分支，请检查速率限制或网络连接`));
    }
    console.log();
  }

  return { allComplete, warnings };
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
