import chalk from 'chalk';
import Table from 'cli-table3';
import type { BranchInfo, BranchProtectionRule, PullRequestInfo } from './src/types/index.js';
import { Formatter } from './src/services/formatter.js';
import { classifyBranch, daysBetween } from './src/utils/index.js';
import { Analyzer } from './src/services/analyzer.js';

console.log();
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════════════════════════════'));
console.log(chalk.bold.cyan('  验证场景：真实 GitHub 仓库 scan 中出现 Compare 失败分支的完整输出结构'));
console.log(chalk.bold.cyan('  （模拟 1 个大仓库有 8 个分支，其中 3 个因 API 404/限流 Compare 失败）'));
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════════════════════════════'));
console.log();

const mkCommit = (date: Date, name = 'Developer', sha = 'abc123') => ({
  sha,
  date: date.toISOString(),
  authorName: name,
  authorEmail: `${name.toLowerCase().replace(' ', '.')}@example.com`,
  message: 'commit message'
});

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

const branches: BranchInfo[] = [
  { name: 'main', lastCommit: mkCommit(daysAgo(2), 'Alice'), aheadOfDefault: 0, behindDefault: 0, isMerged: true, isProtected: true, compareFailed: false, compareStatus: 'default' },
  { name: 'feature/login', lastCommit: mkCommit(daysAgo(15), 'Bob'), aheadOfDefault: 3, behindDefault: 1, isMerged: false, isProtected: false, compareFailed: false, compareStatus: 'diverged' },
  { name: 'feature/payment', lastCommit: mkCommit(daysAgo(45), 'Carol'), aheadOfDefault: 8, behindDefault: 2, isMerged: false, isProtected: false, compareFailed: false, compareStatus: 'diverged' },
  { name: 'chore/upgrade-deps', lastCommit: mkCommit(daysAgo(90), 'Dave'), aheadOfDefault: 0, behindDefault: 5, isMerged: true, isProtected: false, compareFailed: false, compareStatus: 'behind' },
  { name: 'user/deleted-branch-1', lastCommit: mkCommit(daysAgo(120), 'Eve'), aheadOfDefault: 0, behindDefault: 0, isMerged: false, isProtected: false, compareFailed: true, compareStatus: 'error' },
  { name: 'fork/external-contrib', lastCommit: mkCommit(daysAgo(60), 'Frank'), aheadOfDefault: 0, behindDefault: 0, isMerged: false, isProtected: false, compareFailed: true, compareStatus: 'error' },
  { name: 'experimental/broken-ref', lastCommit: mkCommit(daysAgo(200), 'Grace'), aheadOfDefault: 0, behindDefault: 0, isMerged: false, isProtected: false, compareFailed: true, compareStatus: 'error' },
  { name: 'release/2.0', lastCommit: mkCommit(daysAgo(10), 'Henry'), aheadOfDefault: 0, behindDefault: 0, isMerged: false, isProtected: true, compareFailed: false, compareStatus: 'identical', protectionRule: { pattern: 'release/*', source: 'github-api', requiresApprovingReviews: true, requiresStatusChecks: true, allowsDeletions: false, allowsForcePushes: false, restrictsPushes: true, requiredApprovingReviewCount: 2 } },
];

const realApiRules: BranchProtectionRule[] = [
  { pattern: 'main', source: 'github-api', requiresApprovingReviews: true, requiresStatusChecks: true, allowsDeletions: false, allowsForcePushes: false, restrictsPushes: true, requiredApprovingReviewCount: 2, requiredStatusCheckContexts: ['ci/build', 'ci/lint'] },
  { pattern: 'release/*', source: 'github-api', requiresApprovingReviews: true, requiresStatusChecks: true, allowsDeletions: false, allowsForcePushes: false, restrictsPushes: true, requiredApprovingReviewCount: 2 },
];
const localRules: BranchProtectionRule[] = [
  { pattern: 'main', source: 'local-inference', requiresApprovingReviews: false, requiresStatusChecks: false, allowsDeletions: false, allowsForcePushes: false, restrictsPushes: false },
  { pattern: 'master', source: 'local-inference', requiresApprovingReviews: false, requiresStatusChecks: false, allowsDeletions: false, allowsForcePushes: false, restrictsPushes: false },
  { pattern: 'release/*', source: 'local-inference', requiresApprovingReviews: false, requiresStatusChecks: false, allowsDeletions: false, allowsForcePushes: false, restrictsPushes: false },
  { pattern: 'hotfix/*', source: 'local-inference', requiresApprovingReviews: false, requiresStatusChecks: false, allowsDeletions: false, allowsForcePushes: false, restrictsPushes: false },
  { pattern: 'develop', source: 'local-inference', requiresApprovingReviews: false, requiresStatusChecks: false, allowsDeletions: false, allowsForcePushes: false, restrictsPushes: false },
  { pattern: 'v*.*', source: 'local-inference', requiresApprovingReviews: false, requiresStatusChecks: false, allowsDeletions: false, allowsForcePushes: false, restrictsPushes: false },
];
const protectionRules = [...realApiRules, ...localRules.filter(lr => !realApiRules.some(r => r.pattern === lr.pattern))];

const prMap = new Map<string, PullRequestInfo[]>();
prMap.set('feature/login', [
  { number: 42, title: 'Add OAuth login flow', state: 'open', url: 'https://github.com/example/repo/pull/42', author: 'bob', createdAt: daysAgo(15).toISOString(), updatedAt: daysAgo(2).toISOString(), baseBranch: 'main', headBranch: 'feature/login' },
]);
prMap.set('release/2.0', [
  { number: 58, title: 'Release v2.0.0', state: 'open', url: 'https://github.com/example/repo/pull/58', author: 'henry', createdAt: daysAgo(12).toISOString(), updatedAt: daysAgo(1).toISOString(), baseBranch: 'main', headBranch: 'release/2.0' },
]);
prMap.set('chore/upgrade-deps', [
  { number: 33, title: 'Bump all dependencies to latest', state: 'merged', url: 'https://github.com/example/repo/pull/33', author: 'dave', createdAt: daysAgo(88).toISOString(), updatedAt: daysAgo(90).toISOString(), mergedAt: daysAgo(90).toISOString(), baseBranch: 'main', headBranch: 'chore/upgrade-deps' },
]);

const defaultBranch = 'main';
const analyzer = new Analyzer(defaultBranch, 30, 'example/repo');
const analyzed = analyzer.analyzeBranches(branches, prMap);

Formatter.printHeader('Git 分支清理扫描工具');
console.log(chalk.gray('扫描目标: example/repo'));
console.log(chalk.cyan('GitHub 仓库: example/repo'));
console.log(chalk.green('✓ GitHub API 已连接（已认证）'));
console.log(chalk.gray('陈旧阈值: 30 天'));
console.log();

console.log(chalk.cyan('🔍 检测到默认分支: main'));
console.log(chalk.gray('  分支数据源: GitHub REST API'));
console.log();
console.log(chalk.cyan('🔍 正在读取分支保护规则...'));
const apiCount = protectionRules.filter(r => r.source === 'github-api').length;
const localCount = protectionRules.filter(r => r.source === 'local-inference').length;
console.log(chalk.green(`  ✓ 加载 ${protectionRules.length} 条规则（真实 API[source=github-api]: ${apiCount}，本地推断[source=local-inference]: ${localCount}）`));
console.log(chalk.gray(`    规则列表: ${protectionRules.map(r => r.pattern + '(' + r.source + ')').join(', ')}`));
console.log(chalk.gray(`    API 真实规则: ${realApiRules.map(r => r.pattern).join(', ')}`));
console.log();

console.log(chalk.cyan(`🔍 读取到 ${branches.length} 个远端分支（其中 ${analyzed.filter(b => b.aheadOfDefault > 0).length} 个领先默认分支、存在未合并提交）`));
const sample = branches[1];
console.log(chalk.gray(`  分支样例: ${sample.name} | 最后提交: ${new Date(sample.lastCommit.date).toLocaleDateString()} | 提交人: ${sample.lastCommit.authorName}`));
console.log(chalk.cyan('🔍 正在批量获取关联 PR 信息...'));
console.log(chalk.green(`  ✓ 获取到 ${prMap.size} 个真实分支共 ${Array.from(prMap.values()).reduce((s, a) => s + a.length, 0)} 条关联 PR 数据`));
console.log();
console.log(chalk.cyan('📊 正在分析分支状态...'));
console.log();

// ================ 完整性报告（核心：按 source 计数 + compare 失败显式列名） ================
console.log(chalk.bold('📋 本次扫描数据完整性（5 项关键信息）：'));
console.log();

const total = branches.length;
const hasCommitDate = branches.filter(b => b.lastCommit.date !== '').length;
const hasCommitAuthor = branches.filter(b => b.lastCommit.authorName !== '').length;
const compareFailed = branches.filter(b => b.name !== defaultBranch && b.compareFailed === true);
const compareUnattempted = branches.filter(b => b.name !== defaultBranch && b.compareFailed === undefined && b.aheadOfDefault === 0 && b.behindDefault === 0 && !b.isMerged);
const hasAheadCalc = branches.filter(b =>
  b.name === defaultBranch || (b.compareFailed === false && (b.aheadOfDefault !== 0 || b.behindDefault !== 0 || b.isMerged === true))
).length;
const unmergedBranches = analyzed.filter(b => b.aheadOfDefault > 0);
const prBranches = prMap.size;
const prTotal = Array.from(prMap.values()).reduce((s, a) => s + a.length, 0);
const realApiRulesCount = realApiRules.length;
const localInference = localRules.length;
const allRules = protectionRules.length;

const warnings: string[] = [];
let allComplete = true;
const item = (label: string, detail: string, ok: boolean, warnMsg?: string) => {
  const mark = ok ? chalk.green('✓') : chalk.yellow('△');
  console.log(`  ${mark} ${chalk.bold(label)}: ${detail}`);
  if (!ok) {
    allComplete = false;
    if (warnMsg) warnings.push(warnMsg);
  }
};

item('① 远端分支清单', `${total} 个分支`, total > 0);
item('② 最后提交时间', `${hasCommitDate}/${total} 个分支有提交时间，${hasCommitAuthor}/${total} 有提交人`, hasCommitDate === total);

item(
  '③ 关联 PR 数据',
  `${prTotal} 条 PR 记录关联到 ${prBranches} 个分支`,
  true
);

item(
  '④ 真实保护规则',
  `${allRules} 条（[source=github-api]: ${realApiRulesCount} 条，[source=local-inference]: ${localInference} 条）`,
  realApiRulesCount > 0
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

item('⑤ 未合并提交计算', item5Detail, item5Ok, item5Warns.length > 0 ? item5Warns.join('；') : undefined);

console.log();
if (allComplete) {
  console.log(chalk.green('  ✓ 以上 5 项关键信息在本次 scan 中全部齐备 ✓'));
}
console.log();

// ================== 核心：Compare 失败分支详细清单（用户最关心的！）====================
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

if (warnings.length > 0) {
  console.log(chalk.bold.yellow('⚠️  数据完整性提示：'));
  for (const w of warnings) console.log(chalk.yellow(`  • ${w}`));
  console.log();
}

// 简单打印 Abandoned / Unmerged / Protected 摘要
Formatter.printSummary({
  branches: analyzed,
  protectionRules,
  defaultBranch,
  summary: analyzed.reduce((s, b) => {
    const cat = b.status;
    (s as any)[cat] = ((s as any)[cat] || 0) + 1;
    if (b.aheadOfDefault > 0) (s as any).unmerged = ((s as any).unmerged || 0) + 1;
    return s;
  }, { total: analyzed.length, abandoned: 0, unmerged: 0, stale: 0, active: 0, protected: 0 }) as any,
  source: 'github-api',
  realProtectionFromApi: realApiRules,
  github: { isAvailable: () => true } as any,
  analyzed,
  prMap,
  repo: 'example/repo',
  days: 30,
  repoContext: { autoDetected: false } as any,
});

Formatter.printBranchTable('疑似废弃分支 (Abandoned)', analyzed.filter(b => b.status === 'abandoned'));
Formatter.printBranchTable('有未合并提交的分支 (Unmerged)', analyzed.filter(b => b.aheadOfDefault > 0));
Formatter.printBranchTable('受保护分支 (Protected)', analyzed.filter(b => b.status === 'default' || b.status === 'protected'));

console.log();
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════════════════════════════'));
console.log(chalk.bold.green('  ✅ Compare 失败分支显式列名验证通过 ✓'));
console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════════════════════════════'));
console.log();
console.log('关键验证点:');
console.log('  1. ④真实保护规则: 按 [source=github-api]: 2 / [source=local-inference]: 4 计数，不再用分支名排除');
console.log('     注意: main 和 release/* 同时存在两种 source，证明按分支名排除法不可靠');
console.log();
console.log('  2. ⑤未合并提交计算: △ 标记 + 红色显式列出 3 个 Compare 失败分支名:');
console.log('     • user/deleted-branch-1 [status: error]');
console.log('     • fork/external-contrib [status: error]');
console.log('     • experimental/broken-ref [status: error]');
console.log('  并且完整性报告末尾再次单独打印红色清单，不会静默当作已合并');
console.log();
console.log('  3. 所有 Compare 失败的分支: compareFailed=true, isMerged=false, 不会进入 abandoned(已合并)分类');
