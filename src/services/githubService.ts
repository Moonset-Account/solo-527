import { Octokit } from '@octokit/rest';
import type {
  PullRequestInfo,
  BranchProtectionRule,
  BranchInfo,
  CommitInfo,
} from '../types/index.js';
import { parseRepoUrl, isProbablyProtectedByName } from '../utils/index.js';

export interface GitHubBranchResult {
  branches: BranchInfo[];
  defaultBranch: string;
}

export class GitHubService {
  private octokit: Octokit | null = null;
  private owner: string = '';
  private repo: string = '';

  constructor(
    repoInputOrOwner: string,
    tokenOrRepoName?: string,
    tokenMaybe?: string
  ) {
    let owner: string = '';
    let name: string = '';
    let token: string | undefined;

    if (typeof tokenOrRepoName === 'string' && /^[a-zA-Z0-9_.-]+$/.test(tokenOrRepoName) && !tokenOrRepoName.includes('/') && !tokenOrRepoName.includes(':')) {
      owner = repoInputOrOwner;
      name = tokenOrRepoName;
      token = tokenMaybe || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    } else {
      const parsed = parseRepoUrl(repoInputOrOwner);
      owner = parsed.owner;
      name = parsed.name;
      token = (tokenOrRepoName as string | undefined) || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    }

    this.owner = owner;
    this.repo = name;

    if (token && this.owner && this.repo) {
      try {
        this.octokit = new Octokit({ auth: token });
      } catch (err: any) {
        console.warn(`GitHub API 初始化失败: ${err.message}`);
        this.octokit = null;
      }
    }
  }

  static fromOwnerName(owner: string, name: string, token?: string): GitHubService {
    const svc = new GitHubService(owner, name, token);
    return svc;
  }

  static fromRemoteUrl(remoteUrl: string, token?: string): GitHubService {
    const svc = new GitHubService(remoteUrl, token);
    return svc;
  }

  isAvailable(): boolean {
    return this.octokit !== null && this.owner !== '' && this.repo !== '';
  }

  getRepoInfo(): { owner: string; name: string } {
    return { owner: this.owner, name: this.repo };
  }

  async fetchDefaultBranch(): Promise<string> {
    if (!this.octokit || !this.owner || !this.repo) return '';
    try {
      const { data } = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      return data.default_branch || 'main';
    } catch {
      return '';
    }
  }

  async fetchBranchesViaApi(): Promise<GitHubBranchResult> {
    const result: GitHubBranchResult = { branches: [], defaultBranch: 'main' };
    if (!this.octokit || !this.owner || !this.repo) return result;

    try {
      result.defaultBranch = await this.fetchDefaultBranch() || 'main';
      const allBranches: BranchInfo[] = [];
      let page = 1;

      while (page <= 20) {
        const response = await this.octokit.repos.listBranches({
          owner: this.owner,
          repo: this.repo,
          per_page: 100,
          page,
        });

        if (response.data.length === 0) break;

        for (const b of response.data) {
          const lastCommit: CommitInfo = {
            sha: b.commit.sha,
            authorName: '',
            authorEmail: '',
            date: '',
            message: '',
          };

          if (lastCommit.sha) {
            try {
              const commitResp = await this.octokit.repos.getCommit({
                owner: this.owner,
                repo: this.repo,
                ref: b.commit.sha,
              });
              lastCommit.authorName = commitResp.data.commit.author?.name || '';
              lastCommit.authorEmail = commitResp.data.commit.author?.email || '';
              lastCommit.date = commitResp.data.commit.author?.date || '';
              lastCommit.message = commitResp.data.commit.message || '';
            } catch {}
          }

          const isProtectedByName = isProbablyProtectedByName(b.name);
          allBranches.push({
            name: b.name,
            remoteName: 'origin',
            lastCommit,
            aheadOfDefault: 0,
            behindDefault: 0,
            isMerged: b.name === result.defaultBranch,
            isProtected: b.protected || isProtectedByName || b.name === result.defaultBranch,
          });
        }

        if (response.data.length < 100) break;
        page++;
      }

      result.branches = allBranches;

      if (result.defaultBranch && allBranches.length > 0) {
        console.warn(
          `🔍 正在使用 GitHub Compare API 计算 ${allBranches.length} 个分支的 ahead/behind（可能较慢）...`
        );
        const enrichTasks = allBranches.map(async (branch) => {
          if (branch.name === result.defaultBranch) return branch;
          const compare = await this.compareCommits(result.defaultBranch, branch.name);
          branch.aheadOfDefault = compare.ahead;
          branch.behindDefault = compare.behind;
          if (compare.status === 'identical') {
            branch.isMerged = true;
          } else if (compare.status === 'behind' || (compare.ahead === 0 && compare.behind > 0)) {
            branch.isMerged = true;
          } else if (compare.ahead === 0 && compare.behind === 0) {
            branch.isMerged = true;
          }
          return branch;
        });
        await Promise.allSettled(enrichTasks);
      }
    } catch (err: any) {
      console.warn(`通过 GitHub API 获取分支失败: ${err.message}`);
    }

    return result;
  }

  async compareCommits(
    baseBranch: string,
    headBranch: string
  ): Promise<{ ahead: number; behind: number; status: string }> {
    if (!this.octokit || !this.owner || !this.repo) {
      return { ahead: 0, behind: 0, status: 'unknown' };
    }

    try {
      const { data } = await this.octokit.repos.compareCommits({
        owner: this.owner,
        repo: this.repo,
        base: baseBranch,
        head: headBranch,
        per_page: 1,
      });

      return {
        ahead: data.ahead_by || 0,
        behind: data.behind_by || 0,
        status: data.status || 'unknown',
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('rate limit')) {
        console.warn(`⚠️  GitHub API 速率限制: 无法比较 ${baseBranch}...${headBranch}`);
      } else if (msg.includes('404')) {
        console.warn(`⚠️  无法比较 ${baseBranch}...${headBranch}: 分支或引用不存在`);
      }
      return { ahead: 0, behind: 0, status: 'error' };
    }
  }

  private async fetchCommitDate(sha: string): Promise<string> {
    if (!this.octokit || !this.owner || !this.repo) return '';
    try {
      const { data } = await this.octokit.repos.getCommit({
        owner: this.owner,
        repo: this.repo,
        ref: sha,
      });
      return data.commit.author?.date || '';
    } catch {
      return '';
    }
  }

  async fetchPullRequestsForBranch(branchName: string): Promise<PullRequestInfo[]> {
    if (!this.octokit || !this.owner || !this.repo) {
      return [];
    }

    try {
      const prs: PullRequestInfo[] = [];
      const response = await this.octokit.pulls.list({
        owner: this.owner,
        repo: this.repo,
        state: 'all',
        head: `${this.owner}:${branchName}`,
        per_page: 30,
        page: 1,
      });

      for (const pr of response.data) {
        let prState: PullRequestInfo['state'];
        if (pr.draft) {
          prState = 'draft';
        } else if (pr.merged_at) {
          prState = 'merged';
        } else if (pr.state === 'closed') {
          prState = 'closed';
        } else {
          prState = 'open';
        }

        prs.push({
          number: pr.number,
          title: pr.title,
          state: prState,
          htmlUrl: pr.html_url,
          author: pr.user?.login || 'unknown',
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          mergedAt: pr.merged_at || undefined,
          closedAt: pr.closed_at || undefined,
          baseBranch: pr.base.ref,
          headBranch: pr.head.ref,
        });
      }

      return prs.sort((a, b) => {
        const order: Record<string, number> = { open: 0, draft: 1, merged: 2, closed: 3 };
        return (order[a.state] || 0) - (order[b.state] || 0);
      });
    } catch (err: any) {
      console.warn(`获取分支 ${branchName} 的 PR 失败: ${err.message}`);
      return [];
    }
  }

  async fetchAllPullRequests(): Promise<Map<string, PullRequestInfo[]>> {
    const result = new Map<string, PullRequestInfo[]>();
    if (!this.octokit || !this.owner || !this.repo) {
      return result;
    }

    try {
      let page = 1;
      const perPage = 100;

      while (page <= 10) {
        const response = await this.octokit.pulls.list({
          owner: this.owner,
          repo: this.repo,
          state: 'all',
          per_page: perPage,
          page,
        });

        if (response.data.length === 0) break;

        for (const pr of response.data) {
          let prState: PullRequestInfo['state'];
          if (pr.draft) {
            prState = 'draft';
          } else if (pr.merged_at) {
            prState = 'merged';
          } else if (pr.state === 'closed') {
            prState = 'closed';
          } else {
            prState = 'open';
          }

          const info: PullRequestInfo = {
            number: pr.number,
            title: pr.title,
            state: prState,
            htmlUrl: pr.html_url,
            author: pr.user?.login || 'unknown',
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            mergedAt: pr.merged_at || undefined,
            closedAt: pr.closed_at || undefined,
            baseBranch: pr.base.ref,
            headBranch: pr.head.ref,
          };

          const key = pr.head.ref;
          if (!result.has(key)) {
            result.set(key, []);
          }
          result.get(key)!.push(info);
        }

        if (response.data.length < perPage) break;
        page++;
      }

      for (const [, prs] of result) {
        prs.sort((a, b) => {
          const order: Record<string, number> = { open: 0, draft: 1, merged: 2, closed: 3 };
          return (order[a.state] || 0) - (order[b.state] || 0);
        });
      }
    } catch (err: any) {
      console.warn(`批量获取 PR 失败: ${err.message}`);
    }

    return result;
  }

  async fetchBranchProtectionRules(): Promise<BranchProtectionRule[]> {
    const rules: BranchProtectionRule[] = [];
    if (!this.octokit || !this.owner || !this.repo) {
      return rules;
    }

    try {
      const branches = await this.octokit.repos.listBranches({
        owner: this.owner,
        repo: this.repo,
        protected: true,
        per_page: 100,
      });

      for (const branch of branches.data) {
        if (!branch.protected) continue;

        try {
          const protection = await this.octokit.repos.getBranchProtection({
            owner: this.owner,
            repo: this.repo,
            branch: branch.name,
          });

          const data = protection.data as any;
          rules.push({
            pattern: branch.name,
            requiresApprovingReviews: !!data.required_pull_request_reviews,
            requiredApprovingReviewCount:
              data.required_pull_request_reviews?.required_approving_review_count,
            requiresStatusChecks: !!data.required_status_checks,
            requiredStatusCheckContexts:
              data.required_status_checks?.contexts ||
              (data.required_status_checks?.checks || []).map((c: any) => c.context),
            allowsDeletions: data.allow_deletions?.enabled || false,
            allowsForcePushes: data.allow_force_pushes?.enabled || false,
            restrictsPushes: !!data.restrictions,
          });
        } catch {
          continue;
        }
      }
    } catch (err: any) {
      console.warn(`获取分支保护规则失败: ${err.message}`);
    }

    return rules;
  }
}
