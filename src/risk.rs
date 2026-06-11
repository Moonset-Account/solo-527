use crate::models::BranchInfo;
use crate::models::RiskLevel;
use crate::config::CleanupConfig;

pub struct RiskEngine {
    config: CleanupConfig,
}

impl RiskEngine {
    pub fn new(config: CleanupConfig) -> Self {
        Self { config }
    }

    pub fn assess(&self, branch: &mut BranchInfo) {
        let mut risk_score = 0i32;
        let mut reasons: Vec<String> = vec![];

        if branch.is_protected {
            branch.risk_level = RiskLevel::Critical;
            branch.risk_reasons = vec!["受保护分支".to_string()];
            return;
        }

        if branch.is_merged {
            risk_score -= 30;
            reasons.push("已合入主分支".to_string());
        }

        let age_days = branch.age_days();
        if age_days > 365 {
            risk_score += 10;
            reasons.push(format!("超过 1 年未活动 ({} 天)", age_days));
        } else if age_days > 180 {
            risk_score += 5;
            reasons.push(format!("超过 6 个月未活动 ({} 天)", age_days));
        } else if age_days > 90 {
            risk_score += 2;
            reasons.push(format!("超过 3 个月未活动 ({} 天)", age_days));
        } else if age_days < 7 {
            risk_score -= 10;
            reasons.push("近期活跃".to_string());
        }

        match branch.pr_status {
            crate::models::PrStatus::Merged => {
                risk_score -= 20;
                reasons.push("PR 已合并".to_string());
            }
            crate::models::PrStatus::Open => {
                risk_score += 15;
                reasons.push("存在打开的 PR".to_string());
            }
            crate::models::PrStatus::Draft => {
                risk_score += 5;
                reasons.push("存在草稿 PR".to_string());
            }
            crate::models::PrStatus::Closed => {
                risk_score -= 5;
                reasons.push("PR 已关闭".to_string());
            }
            _ => {}
        }

        if branch.ahead_of_default > 0 {
            risk_score += (branch.ahead_of_default as i32).min(20);
            reasons.push(format!("领先主分支 {} 个提交", branch.ahead_of_default));
        }

        if branch.behind_default > 50 {
            risk_score += 5;
            reasons.push(format!("落后主分支 {} 个提交", branch.behind_default));
        }

        if branch.is_remote && branch.is_local {
            risk_score -= 5;
            reasons.push("本地和远端同步存在".to_string());
        }

        if self.config.is_excluded(&branch.name) {
            risk_score += 50;
            reasons.push("在排除列表中".to_string());
        }

        let level = self.score_to_level(risk_score);
        branch.risk_level = level;
        branch.risk_reasons = reasons;
    }

    fn score_to_level(&self, score: i32) -> RiskLevel {
        if score <= -20 {
            RiskLevel::Safe
        } else if score <= 0 {
            RiskLevel::Low
        } else if score <= 15 {
            RiskLevel::Medium
        } else if score <= 30 {
            RiskLevel::High
        } else {
            RiskLevel::Critical
        }
    }

    pub fn should_delete(&self, branch: &BranchInfo) -> bool {
        if branch.is_protected {
            return false;
        }

        if self.config.is_excluded(&branch.name) {
            return false;
        }

        if self.config.merged_only && !branch.is_merged {
            return false;
        }

        if let Some(min_days) = self.config.older_than_days {
            if branch.age_days() < min_days {
                return false;
            }
        }

        branch.risk_level <= self.config.min_risk_level
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::PrStatus;
    use chrono::Utc;

    fn create_branch(name: &str, merged: bool, days_old: i64, pr_status: PrStatus) -> BranchInfo {
        BranchInfo {
            name: name.to_string(),
            is_local: true,
            is_remote: false,
            remote_name: None,
            last_commit_sha: "abc123".to_string(),
            last_commit_message: "test".to_string(),
            last_commit_date: Utc::now() - chrono::Duration::days(days_old),
            last_commit_author: "test".to_string(),
            is_merged: merged,
            merged_into: if merged { Some("main".to_string()) } else { None },
            ahead_of_default: 0,
            behind_default: 0,
            pr_status,
            pr_number: None,
            pr_title: None,
            is_protected: false,
            protection_reasons: vec![],
            risk_level: RiskLevel::Low,
            risk_reasons: vec![],
            size_bytes: None,
        }
    }

    #[test]
    fn test_merged_branch_is_safe() {
        let config = CleanupConfig::default();
        let engine = RiskEngine::new(config);
        let mut branch = create_branch("feature/test", true, 30, PrStatus::Merged);
        engine.assess(&mut branch);
        assert!(branch.risk_level <= RiskLevel::Safe);
        assert!(branch.risk_reasons.iter().any(|r| r.contains("已合并")));
    }

    #[test]
    fn test_protected_branch_is_critical() {
        let config = CleanupConfig::default();
        let engine = RiskEngine::new(config);
        let mut branch = create_branch("main", false, 1, PrStatus::NotApplicable);
        branch.is_protected = true;
        engine.assess(&mut branch);
        assert_eq!(branch.risk_level, RiskLevel::Critical);
    }

    #[test]
    fn test_open_pr_increases_risk() {
        let config = CleanupConfig::default();
        let engine = RiskEngine::new(config);
        let mut branch = create_branch("feature/new", false, 10, PrStatus::Open);
        engine.assess(&mut branch);
        assert!(branch.risk_level >= RiskLevel::Medium);
        assert!(branch.risk_reasons.iter().any(|r| r.contains("打开的 PR")));
    }

    #[test]
    fn test_older_than_filter() {
        let config = CleanupConfig {
            older_than_days: Some(30),
            merged_only: false,
            min_risk_level: RiskLevel::Medium,
            ..Default::default()
        };
        let engine = RiskEngine::new(config.clone());

        let old_branch = create_branch("old", true, 60, PrStatus::Merged);
        let new_branch = create_branch("new", true, 10, PrStatus::Merged);

        assert!(engine.should_delete(&old_branch));
        assert!(!engine.should_delete(&new_branch));
    }

    #[test]
    fn test_merged_only_filter() {
        let config = CleanupConfig {
            merged_only: true,
            min_risk_level: RiskLevel::High,
            ..Default::default()
        };
        let engine = RiskEngine::new(config);

        let merged = create_branch("merged", true, 30, PrStatus::Merged);
        let unmerged = create_branch("unmerged", false, 30, PrStatus::Open);

        assert!(engine.should_delete(&merged));
        assert!(!engine.should_delete(&unmerged));
    }
}
