import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import chalk from 'chalk';
import type {
  AnalyzedBranch,
  BranchStatus,
  RecommendedAction,
  RiskLevel,
} from '../types/index.js';

dayjs.extend(relativeTime);

export function daysBetween(dateStr: string): number {
  const date = dayjs(dateStr);
  return Math.floor(dayjs().diff(date, 'day', true));
}

export function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
}

export function formatRelative(dateStr: string): string {
  return dayjs(dateStr).fromNow();
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export function statusColor(status: BranchStatus): string {
  const colors: Record<BranchStatus, (s: string) => string> = {
    active: chalk.green,
    stale: chalk.yellow,
    abandoned: chalk.red,
    merged: chalk.cyan,
    protected: chalk.magenta,
    default: chalk.blue.bold,
  };
  return colors[status](status.toUpperCase());
}

export function actionColor(action: RecommendedAction): string {
  const colors: Record<RecommendedAction, (s: string) => string> = {
    keep: chalk.green,
    review: chalk.yellow,
    archive: chalk.blue,
    delete: chalk.red,
    skip: chalk.gray,
  };
  return colors[action](action.toUpperCase());
}

export function riskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, (s: string) => string> = {
    low: chalk.green,
    medium: chalk.yellow,
    high: chalk.red,
  };
  return colors[level](level.toUpperCase());
}

export function parseRepoUrl(repo: string): { owner: string; name: string; localPath: string | null } {
  let owner = '';
  let name = '';
  let localPath: string | null = null;

  if (repo.startsWith('http://') || repo.startsWith('https://')) {
    const match = repo.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      owner = match[1];
      name = match[2].replace(/\.git$/, '');
    }
  } else if (repo.startsWith('git@')) {
    const match = repo.match(/github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      owner = match[1];
      name = match[2].replace(/\.git$/, '');
    }
  } else if (repo.includes('/') && !repo.startsWith('/')) {
    const parts = repo.split('/');
    if (parts.length === 2) {
      owner = parts[0];
      name = parts[1].replace(/\.git$/, '');
    }
  }

  if (!owner || !name) {
    localPath = repo;
  }

  return { owner, name, localPath };
}

export function isProbablyDefaultBranch(name: string): boolean {
  const defaults = ['main', 'master', 'develop', 'dev', 'release'];
  return defaults.includes(name.toLowerCase());
}

export function isProbablyProtectedByName(name: string): boolean {
  const patterns = [
    /^main$/,
    /^master$/,
    /^develop$/,
    /^release\/.*/,
    /^hotfix\/.*/,
    /^production$/,
    /^prod$/,
    /^staging$/,
    /^uat$/,
    /^v\d+\..*/,
  ];
  return patterns.some((p) => p.test(name.toLowerCase()));
}

export function classifyBranch(
  daysSinceLastCommit: number,
  isMerged: boolean,
  isProtected: boolean,
  isDefault: boolean,
  thresholdDays: number,
  aheadOfDefault: number
): { status: BranchStatus; action: RecommendedAction; risk: RiskLevel; reasons: string[] } {
  const reasons: string[] = [];

  if (isDefault) {
    return {
      status: 'default',
      action: 'skip',
      risk: 'high',
      reasons: ['默认分支，受保护'],
    };
  }

  if (isProtected) {
    return {
      status: 'protected',
      action: 'skip',
      risk: 'high',
      reasons: ['分支受保护规则保护'],
    };
  }

  if (isMerged) {
    reasons.push('代码已合并到默认分支');
    if (daysSinceLastCommit > thresholdDays) {
      reasons.push(`最后提交距今 ${daysSinceLastCommit} 天，超过阈值 ${thresholdDays} 天`);
      return {
        status: 'abandoned',
        action: 'delete',
        risk: 'low',
        reasons,
      };
    }
    return {
      status: 'merged',
      action: 'archive',
      risk: 'low',
      reasons,
    };
  }

  if (aheadOfDefault > 0) {
    reasons.push(`领先默认分支 ${aheadOfDefault} 个未合并提交`);
  }

  if (daysSinceLastCommit > thresholdDays * 3) {
    reasons.push(`最后提交距今 ${daysSinceLastCommit} 天，严重过期`);
    if (aheadOfDefault > 0) {
      return {
        status: 'abandoned',
        action: 'review',
        risk: 'high',
        reasons,
      };
    }
    return {
      status: 'abandoned',
      action: 'delete',
      risk: 'low',
      reasons,
    };
  }

  if (daysSinceLastCommit > thresholdDays) {
    reasons.push(`最后提交距今 ${daysSinceLastCommit} 天，超过阈值 ${thresholdDays} 天`);
    if (aheadOfDefault > 0) {
      return {
        status: 'stale',
        action: 'review',
        risk: 'medium',
        reasons,
      };
    }
    return {
      status: 'stale',
      action: 'archive',
      risk: 'low',
      reasons,
    };
  }

  reasons.push(`最后提交在 ${daysSinceLastCommit} 天内`);
  return {
    status: 'active',
    action: 'keep',
    risk: aheadOfDefault > 10 ? 'medium' : 'low',
    reasons,
  };
}

export async function confirmPrompt(message: string): Promise<boolean> {
  process.stdout.write(`${message} (y/N): `);
  return new Promise((resolve) => {
    const onData = (data: Buffer) => {
      const input = data.toString().trim().toLowerCase();
      process.stdin.removeListener('data', onData);
      process.stdin.pause();
      resolve(input === 'y' || input === 'yes');
    };
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', onData);
  });
}

export function groupByStatus(branches: AnalyzedBranch[]) {
  return {
    abandoned: branches.filter((b) => b.status === 'abandoned'),
    unmerged: branches.filter((b) => b.status !== 'merged' && b.aheadOfDefault > 0),
    stale: branches.filter((b) => b.status === 'stale'),
    active: branches.filter((b) => b.status === 'active'),
    protected: branches.filter((b) => b.status === 'protected' || b.status === 'default'),
  };
}
