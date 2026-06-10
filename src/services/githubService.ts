import { Octokit } from '@octokit/rest';
import type { PullRequestInfo, BranchProtectionRule } from '../types/index.js';
import { parseRepoUrl } from '../utils/index.js';

export class GitHubService {
  private octokit: Octokit | null = null;
  private owner: string = '';
  private repo: string = '';

  constructor(repoInput: string, token?: string) {
    const parsed = parseRepoUrl(repoInput);
    this.owner = parsed.owner;
    this.repo = parsed.name;

    const useToken = token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (useToken && this.owner && this.repo) {
      try {
        this.octokit = new Octokit({ auth: useToken });
      } catch (err) {
        console.warn(`GitHub API 初始化失败: ${(err as Error).message}`);
        this.octokit = null;
      }
    }
  }

  isAvailable(): boolean {
    return this.octokit !== null && this.owner !== '' && this.repo !== '';
  }

  getRepoInfo(): { owner: string; name: string } {
    return { owner: this.owner, name: this.repo };
  }

  async fetchPullRequestsForBranch(branchName: string): Promise<PullRequestInfo[]> {
    if (!this.octokit || !this.owner || !this.repo) {
      return [];
    }

    try {
      const prs: PullRequestInfo[] = [];
      const states: Array<'open' | 'closed' | 'all'> = ['all'];

      for (const state of states) {
        const response = await this.octokit.pulls.list({
          owner: this.owner,
          repo: this.repo,
          state,
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
      }

      return prs.sort((a, b) => {
        const order = { open: 0, draft: 1, merged: 2, closed: 3 };
        return order[a.state] - order[b.state];
      });
    } catch (err) {
      console.warn(`获取分支 ${branchName} 的 PR 失败: ${(err as Error).message}`);
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
      const states: Array<'open' | 'closed' | 'all'> = ['all'];

      for (const state of states) {
        while (page <= 10) {
          const response = await this.octokit.pulls.list({
            owner: this.owner,
            repo: this.repo,
            state,
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
        page = 1;
      }

      for (const [, prs] of result) {
        prs.sort((a, b) => {
          const order = { open: 0, draft: 1, merged: 2, closed: 3 };
          return order[a.state] - order[b.state];
        });
      }
    } catch (err) {
      console.warn(`批量获取 PR 失败: ${(err as Error).message}`);
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

          const data = protection.data;
          rules.push({
            pattern: branch.name,
            requiresApprovingReviews: !!data.required_pull_request_reviews,
            requiredApprovingReviewCount:
              data.required_pull_request_reviews?.required_approving_review_count,
            requiresStatusChecks: !!data.required_status_checks,
            requiredStatusCheckContexts:
              data.required_status_checks?.contexts ||
              data.required_status_checks?.checks?.map((c: any) => c.context),
            allowsDeletions: data.allow_deletions?.enabled || false,
            allowsForcePushes: data.allow_force_pushes?.enabled || false,
            restrictsPushes: !!data.restrictions,
          });
        } catch {
          continue;
        }
      }
    } catch (err) {
      console.warn(`获取分支保护规则失败: ${(err as Error).message}`);
    }

    return rules;
  }
}
