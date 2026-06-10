import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import type { BranchInfo, CommitInfo, BranchProtectionRule } from '../types/index.js';
import { isProbablyProtectedByName } from '../utils/index.js';

const execAsync = promisify(execFile);

export interface GitResult {
  stdout: string;
  stderr: string;
}

export class GitService {
  private repoPath: string;
  private remoteName: string;

  constructor(repoPath: string, remoteName: string = 'origin') {
    this.repoPath = this.resolveRepoPath(repoPath);
    this.remoteName = remoteName;
  }

  private resolveRepoPath(inputPath: string): string {
    if (fs.existsSync(inputPath) && fs.statSync(inputPath).isDirectory()) {
      const gitDir = path.join(inputPath, '.git');
      if (fs.existsSync(gitDir)) {
        return path.resolve(inputPath);
      }
    }
    return path.resolve(process.cwd(), inputPath);
  }

  private async runGit(args: string[], cwd?: string): Promise<GitResult> {
    const workDir = cwd || this.repoPath;
    try {
      return await execAsync('git', args, {
        cwd: workDir,
        maxBuffer: 100 * 1024 * 1024,
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0',
          GIT_SSH_COMMAND: 'ssh -o BatchMode=yes',
        },
      });
    } catch (err: any) {
      throw new Error(`Git 命令失败 (git ${args.join(' ')}): ${err.stderr || err.message}`);
    }
  }

  async ensureRepoReady(): Promise<void> {
    if (!fs.existsSync(this.repoPath) || !fs.existsSync(path.join(this.repoPath, '.git'))) {
      throw new Error(`目录 ${this.repoPath} 不是有效的 Git 仓库`);
    }
    await this.runGit(['remote', 'update', '--prune']);
  }

  async detectDefaultBranch(): Promise<string> {
    try {
      const result = await this.runGit(['symbolic-ref', '--short', `refs/remotes/${this.remoteName}/HEAD`]);
      const ref = result.stdout.trim();
      const parts = ref.split('/');
      return parts.slice(2).join('/');
    } catch {
      try {
        const { stdout } = await this.runGit(['branch', '-r', '--list', `${this.remoteName}/main`]);
        if (stdout.trim()) return 'main';
      } catch {}
      try {
        const { stdout } = await this.runGit(['branch', '-r', '--list', `${this.remoteName}/master`]);
        if (stdout.trim()) return 'master';
      } catch {}
      return 'main';
    }
  }

  async listRemoteBranches(): Promise<string[]> {
    const { stdout } = await this.runGit([
      'for-each-ref',
      '--format=%(refname:strip=3)',
      `refs/remotes/${this.remoteName}/`,
    ]);
    const branches = stdout
      .split('\n')
      .map((b) => b.trim())
      .filter((b) => b && b !== 'HEAD' && !b.endsWith('/HEAD'));
    return [...new Set(branches)];
  }

  async getLastCommit(branchName: string): Promise<CommitInfo> {
    const format = '%H|%an|%ae|%aI|%s';
    const { stdout } = await this.runGit([
      'log',
      '-1',
      `--format=${format}`,
      `${this.remoteName}/${branchName}`,
    ]);
    const line = stdout.trim();
    if (!line) {
      throw new Error(`无法获取分支 ${branchName} 的提交信息`);
    }
    const [sha, authorName, authorEmail, date, ...msgParts] = line.split('|');
    return {
      sha,
      authorName,
      authorEmail,
      date,
      message: msgParts.join('|'),
    };
  }

  async getBranchCommitCount(branchName: string, defaultBranch: string): Promise<{ ahead: number; behind: number }> {
    try {
      const { stdout } = await this.runGit([
        'rev-list',
        '--left-right',
        '--count',
        `${this.remoteName}/${defaultBranch}...${this.remoteName}/${branchName}`,
      ]);
      const [behindStr, aheadStr] = stdout.trim().split(/\s+/);
      return {
        ahead: parseInt(aheadStr, 10) || 0,
        behind: parseInt(behindStr, 10) || 0,
      };
    } catch {
      return { ahead: 0, behind: 0 };
    }
  }

  async isBranchMerged(branchName: string, defaultBranch: string): Promise<boolean> {
    try {
      const { stdout } = await this.runGit([
        'branch',
        '-r',
        '--merged',
        `${this.remoteName}/${defaultBranch}`,
        '--list',
        `${this.remoteName}/${branchName}`,
      ]);
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  buildLocalProtectionRules(): BranchProtectionRule[] {
    const mk = (r: Omit<BranchProtectionRule, 'source'>): BranchProtectionRule =>
      ({ ...r, source: 'local-inference' });
    return [
      mk({
        pattern: 'main',
        requiresApprovingReviews: true,
        requiredApprovingReviewCount: 1,
        requiresStatusChecks: true,
        allowsDeletions: false,
        allowsForcePushes: false,
        restrictsPushes: true,
      }),
      mk({
        pattern: 'master',
        requiresApprovingReviews: true,
        requiredApprovingReviewCount: 1,
        requiresStatusChecks: true,
        allowsDeletions: false,
        allowsForcePushes: false,
        restrictsPushes: true,
      }),
      mk({
        pattern: 'release/*',
        requiresApprovingReviews: true,
        requiresStatusChecks: true,
        allowsDeletions: false,
        allowsForcePushes: false,
        restrictsPushes: true,
      }),
      mk({
        pattern: 'hotfix/*',
        requiresApprovingReviews: false,
        requiresStatusChecks: true,
        allowsDeletions: false,
        allowsForcePushes: false,
        restrictsPushes: false,
      }),
      mk({
        pattern: 'develop',
        requiresApprovingReviews: true,
        requiresStatusChecks: true,
        allowsDeletions: false,
        allowsForcePushes: false,
        restrictsPushes: true,
      }),
      mk({
        pattern: 'v*.*',
        requiresApprovingReviews: false,
        requiresStatusChecks: false,
        allowsDeletions: false,
        allowsForcePushes: false,
        restrictsPushes: true,
      }),
    ];
  }

  matchProtectionRule(branchName: string, rules: BranchProtectionRule[]): BranchProtectionRule | undefined {
    return rules.find((rule) => {
      const pattern = rule.pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      const regex = new RegExp(`^${pattern}$`, 'i');
      return regex.test(branchName);
    });
  }

  async getBranchesInfo(
    defaultBranch: string,
    protectionRules: BranchProtectionRule[]
  ): Promise<BranchInfo[]> {
    await this.ensureRepoReady();
    const branches = await this.listRemoteBranches();
    const result: BranchInfo[] = [];

    for (const branchName of branches) {
      try {
        const lastCommit = await this.getLastCommit(branchName);
        const { ahead, behind } = await this.getBranchCommitCount(branchName, defaultBranch);
        const isMerged = branchName === defaultBranch
          ? true
          : await this.isBranchMerged(branchName, defaultBranch);

        const matchedRule = this.matchProtectionRule(branchName, protectionRules);
        const isProtected = branchName === defaultBranch || !!matchedRule || isProbablyProtectedByName(branchName);

        result.push({
          name: branchName,
          remoteName: this.remoteName,
          lastCommit,
          aheadOfDefault: ahead,
          behindDefault: behind,
          isMerged,
          isProtected,
          protectionRule: matchedRule,
        });
      } catch (err) {
        console.warn(`跳过分支 ${branchName}: ${(err as Error).message}`);
      }
    }

    return result;
  }

  async deleteRemoteBranch(branchName: string): Promise<void> {
    await this.runGit(['push', this.remoteName, '--delete', branchName]);
  }

  async getRepoUrl(): Promise<string> {
    try {
      const { stdout } = await this.runGit(['remote', 'get-url', this.remoteName]);
      return stdout.trim();
    } catch {
      return '';
    }
  }
}
