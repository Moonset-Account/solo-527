use crate::models::{PrInfo, PrStatus};
use anyhow::Result;

pub trait PrProvider {
    fn fetch_prs(&self) -> Result<Vec<PrInfo>>;
}

pub struct MockPrProvider {
    prs: Vec<PrInfo>,
}

impl MockPrProvider {
    pub fn new(prs: Vec<PrInfo>) -> Self {
        Self { prs }
    }
}

impl PrProvider for MockPrProvider {
    fn fetch_prs(&self) -> Result<Vec<PrInfo>> {
        Ok(self.prs.clone())
    }
}

pub struct GitHubPrProvider {
    pub repo_owner: String,
    pub repo_name: String,
    pub token: Option<String>,
    pub api_base: String,
}

impl GitHubPrProvider {
    pub fn new(owner: &str, repo: &str) -> Self {
        Self {
            repo_owner: owner.to_string(),
            repo_name: repo.to_string(),
            token: None,
            api_base: "https://api.github.com".to_string(),
        }
    }

    pub fn with_token(mut self, token: &str) -> Self {
        self.token = Some(token.to_string());
        self
    }
}

impl PrProvider for GitHubPrProvider {
    fn fetch_prs(&self) -> Result<Vec<PrInfo>> {
        let url = format!(
            "{}/repos/{}/{}/pulls?state=all&per_page=100",
            self.api_base, self.repo_owner, self.repo_name
        );

        let client = reqwest_client();
        let mut request = client.get(&url);

        if let Some(token) = &self.token {
            request = request.bearer_auth(token);
        }

        let response = request
            .header("User-Agent", "git-brclean")
            .send()
            .map_err(|e| anyhow::anyhow!("GitHub API 请求失败: {}", e))?;

        if !response.status().is_success() {
            anyhow::bail!(
                "GitHub API 返回错误状态: {} - {}",
                response.status(),
                response.text().unwrap_or_default()
            );
        }

        let prs: Vec<serde_json::Value> = response
            .json()
            .map_err(|e| anyhow::anyhow!("解析 GitHub 响应失败: {}", e))?;

        let result = prs
            .iter()
            .filter_map(|pr| {
                let number = pr.get("number")?.as_u64()?;
                let title = pr.get("title")?.as_str()?.to_string();
                let state = pr.get("state")?.as_str()?;
                let head = pr.get("head")?;
                let branch = head.get("ref")?.as_str()?.to_string();
                let user = pr.get("user")?;
                let author = user.get("login")?.as_str()?.to_string();
                let html_url = pr.get("html_url").and_then(|u| u.as_str()).map(|s| s.to_string());

                let status = match state {
                    "open" => {
                        if pr.get("draft").and_then(|d| d.as_bool()).unwrap_or(false) {
                            PrStatus::Draft
                        } else {
                            PrStatus::Open
                        }
                    }
                    "closed" => {
                        if pr.get("merged_at").and_then(|m| m.as_str()).is_some() {
                            PrStatus::Merged
                        } else {
                            PrStatus::Closed
                        }
                    }
                    _ => PrStatus::Unknown,
                };

                Some(PrInfo {
                    number,
                    title,
                    status,
                    branch,
                    author,
                    url: html_url,
                })
            })
            .collect();

        Ok(result)
    }
}

fn reqwest_client() -> reqwest::blocking::Client {
    reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .unwrap_or_else(|_| reqwest::blocking::Client::new())
}

pub struct GitLabPrProvider {
    pub project_id: String,
    pub token: Option<String>,
    pub api_base: String,
}

impl GitLabPrProvider {
    pub fn new(project_id: &str) -> Self {
        Self {
            project_id: project_id.to_string(),
            token: None,
            api_base: "https://gitlab.com/api/v4".to_string(),
        }
    }
}

impl PrProvider for GitLabPrProvider {
    fn fetch_prs(&self) -> Result<Vec<PrInfo>> {
        let url = format!(
            "{}/projects/{}/merge_requests?state=all&per_page=100",
            self.api_base,
            urlencoding::encode(&self.project_id)
        );

        let client = reqwest_client();
        let mut request = client.get(&url);

        if let Some(token) = &self.token {
            request = request.header("PRIVATE-TOKEN", token);
        }

        let response = request
            .send()
            .map_err(|e| anyhow::anyhow!("GitLab API 请求失败: {}", e))?;

        if !response.status().is_success() {
            anyhow::bail!("GitLab API 返回错误状态: {}", response.status());
        }

        let mrs: Vec<serde_json::Value> = response
            .json()
            .map_err(|e| anyhow::anyhow!("解析 GitLab 响应失败: {}", e))?;

        let result = mrs
            .iter()
            .filter_map(|mr| {
                let iid = mr.get("iid")?.as_u64()?;
                let title = mr.get("title")?.as_str()?.to_string();
                let state = mr.get("state")?.as_str()?;
                let branch = mr.get("source_branch")?.as_str()?.to_string();
                let author = mr
                    .get("author")
                    .and_then(|a| a.get("name"))
                    .and_then(|n| n.as_str())
                    .unwrap_or("unknown")
                    .to_string();
                let web_url = mr.get("web_url").and_then(|u| u.as_str()).map(|s| s.to_string());

                let status = match state {
                    "opened" => PrStatus::Open,
                    "merged" => PrStatus::Merged,
                    "closed" => PrStatus::Closed,
                    "draft" => PrStatus::Draft,
                    _ => PrStatus::Unknown,
                };

                Some(PrInfo {
                    number: iid,
                    title,
                    status,
                    branch,
                    author,
                    url: web_url,
                })
            })
            .collect();

        Ok(result)
    }
}

pub fn create_pr_provider(
    source: crate::config::PrSource,
    api_url: Option<&str>,
    token: Option<&str>,
    repo_path: &std::path::Path,
) -> Result<Box<dyn PrProvider + Send + Sync>> {
    match source {
        crate::config::PrSource::GitHub => {
            let (owner, repo) = extract_github_repo(repo_path)
                .or_else(|| {
                    api_url.and_then(|url| {
                        let parts: Vec<&str> = url.trim_end_matches('/').split('/').collect();
                        if parts.len() >= 2 {
                            Some((parts[parts.len() - 2].to_string(), parts[parts.len() - 1].to_string()))
                        } else {
                            None
                        }
                    })
                })
                .ok_or_else(|| anyhow::anyhow!("无法确定 GitHub 仓库信息"))?;

            let mut provider = GitHubPrProvider::new(&owner, &repo);
            if let Some(t) = token {
                provider = provider.with_token(t);
            }
            if let Some(url) = api_url {
                provider.api_base = url.to_string();
            }
            Ok(Box::new(provider))
        }
        crate::config::PrSource::GitLab => {
            let project_id = api_url
                .unwrap_or("")
                .to_string();
            let mut provider = GitLabPrProvider::new(&project_id);
            if let Some(t) = token {
                provider.token = Some(t.to_string());
            }
            Ok(Box::new(provider))
        }
        _ => {
            anyhow::bail!("暂不支持的 PR 源: {:?}", source)
        }
    }
}

fn extract_github_repo(_repo_path: &std::path::Path) -> Option<(String, String)> {
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mock_provider() {
        let prs = vec![PrInfo {
            number: 1,
            title: "Test PR".to_string(),
            status: PrStatus::Open,
            branch: "feature/test".to_string(),
            author: "testuser".to_string(),
            url: None,
        }];

        let provider = MockPrProvider::new(prs);
        let result = provider.fetch_prs().unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].number, 1);
        assert_eq!(result[0].status, PrStatus::Open);
    }
}
