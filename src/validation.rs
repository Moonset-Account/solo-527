use crate::models::*;
use std::collections::HashMap;

pub fn validation_rules() -> Vec<ValidationRule> {
    vec![
        ValidationRule {
            rule_id: "R001".to_string(),
            description: "提交缺少工单编号（ticket ID）".to_string(),
            severity: "error".to_string(),
            suggested_action: "在提交信息中添加工单编号，格式如 PROJ-123 或 #456".to_string(),
        },
        ValidationRule {
            rule_id: "R002".to_string(),
            description: "变更条目缺少标题（title）".to_string(),
            severity: "error".to_string(),
            suggested_action: "为变更条目补充简洁、准确的标题描述".to_string(),
        },
        ValidationRule {
            rule_id: "R003".to_string(),
            description: "变更条目缺少影响范围（scope）".to_string(),
            severity: "warning".to_string(),
            suggested_action: "明确该变更影响的模块、产品线或用户群体".to_string(),
        },
        ValidationRule {
            rule_id: "R004".to_string(),
            description: "变更条目未归类到有效分类（category）".to_string(),
            severity: "warning".to_string(),
            suggested_action: "将该条目归类为 feature、fix、known_issue 或 upgrade_notice".to_string(),
        },
        ValidationRule {
            rule_id: "R005".to_string(),
            description: "手工备注缺少来源链接（source link）".to_string(),
            severity: "info".to_string(),
            suggested_action: "为备注补充关联的工单或文档链接，方便追溯".to_string(),
        },
    ]
}

fn get_rule(rule_id: &str) -> Option<ValidationRule> {
    validation_rules().into_iter().find(|r| r.rule_id == rule_id)
}

pub fn validate_entry(entry: &ChangeEntry) -> Vec<ValidationIssue> {
    let mut issues = Vec::new();

    if entry.ticket_ids.is_empty() {
        if let Some(rule) = get_rule("R001") {
            issues.push(ValidationIssue {
                rule_id: rule.rule_id,
                severity: rule.severity,
                description: rule.description,
                suggested_action: rule.suggested_action,
                entry_id: Some(entry.id.clone()),
                source_file: entry.source_file.clone(),
                affected_fields: vec!["ticket_ids".to_string()],
            });
        }
    }

    if entry.title.is_none() || entry.title.as_ref().unwrap().trim().is_empty() {
        if let Some(rule) = get_rule("R002") {
            issues.push(ValidationIssue {
                rule_id: rule.rule_id,
                severity: rule.severity,
                description: rule.description,
                suggested_action: rule.suggested_action,
                entry_id: Some(entry.id.clone()),
                source_file: entry.source_file.clone(),
                affected_fields: vec!["title".to_string()],
            });
        }
    }

    if entry.scope.is_none() || entry.scope.as_ref().unwrap().trim().is_empty() {
        if let Some(rule) = get_rule("R003") {
            issues.push(ValidationIssue {
                rule_id: rule.rule_id,
                severity: rule.severity,
                description: rule.description,
                suggested_action: rule.suggested_action,
                entry_id: Some(entry.id.clone()),
                source_file: entry.source_file.clone(),
                affected_fields: vec!["scope".to_string()],
            });
        }
    }

    if matches!(entry.category, ChangeCategory::Unknown) {
        if let Some(rule) = get_rule("R004") {
            issues.push(ValidationIssue {
                rule_id: rule.rule_id,
                severity: rule.severity,
                description: rule.description,
                suggested_action: rule.suggested_action,
                entry_id: Some(entry.id.clone()),
                source_file: entry.source_file.clone(),
                affected_fields: vec!["category".to_string()],
            });
        }
    }

    issues
}

pub fn validate_entries(entries: &[ChangeEntry]) -> ValidationResult {
    let mut all_issues = Vec::new();
    let mut entries_needing_review = Vec::new();

    for entry in entries {
        let entry_issues = validate_entry(entry);
        if !entry_issues.is_empty() {
            entries_needing_review.push(entry.clone());
        }
        all_issues.extend(entry_issues);
    }

    let has_errors = all_issues
        .iter()
        .any(|i| i.severity == "error");

    ValidationResult {
        is_valid: !has_errors,
        issues: all_issues,
        entries_needing_review,
    }
}

pub fn needs_pending_review(entry: &ChangeEntry) -> bool {
    let issues = validate_entry(entry);
    issues.iter().any(|i| {
        i.severity == "error" || i.rule_id == "R003"
    })
}

pub fn build_entries_from_collected(data: &CollectedData) -> Vec<ChangeEntry> {
    let mut entries = Vec::new();
    let ticket_re = regex::Regex::new(r"(?i)([A-Z]{2,}-\d+|#\d+)").unwrap();

    let issue_map: HashMap<String, &IssueInfo> = data
        .issues
        .iter()
        .map(|i| (i.id.clone(), i))
        .collect();

    for (idx, commit) in data.commits.iter().enumerate() {
        let ticket_ids: Vec<String> = ticket_re
            .captures_iter(&commit.message)
            .filter_map(|cap| cap.get(1).map(|m| m.as_str().to_string()))
            .collect();

        let linked_issues: Vec<IssueInfo> = ticket_ids
            .iter()
            .filter_map(|tid| issue_map.get(tid).cloned().cloned())
            .collect();

        let title = if commit.is_merge {
            commit
                .message
                .strip_prefix("Merge ")
                .map(|s| s.trim().to_string())
        } else {
            Some(commit.message.clone())
        };

        let category = categorize_from_message(&commit.message);
        let scope = extract_scope(&commit.message);

        entries.push(ChangeEntry {
            id: format!("commit-{}", idx),
            title: title.clone().filter(|t| !t.trim().is_empty()),
            description: commit.message.clone(),
            category,
            scope: scope.clone(),
            ticket_ids,
            commits: vec![commit.clone()],
            issues: linked_issues,
            manual_notes: Vec::new(),
            source_links: commit.source_links.clone(),
            source_file: None,
        });
    }

    for (idx, note) in data.manual_notes.iter().enumerate() {
        let ticket_ids: Vec<String> = note
            .source_links
            .iter()
            .filter(|l| l.source_type == "ticket")
            .filter_map(|l| l.label.clone())
            .collect();

        let linked_issues: Vec<IssueInfo> = ticket_ids
            .iter()
            .filter_map(|tid| issue_map.get(tid).cloned().cloned())
            .collect();

        entries.push(ChangeEntry {
            id: format!("note-{}", idx),
            title: Some(note.title.clone()).filter(|t| !t.trim().is_empty()),
            description: note.content.clone(),
            category: note.category.clone().unwrap_or(ChangeCategory::Unknown),
            scope: note.scope.clone(),
            ticket_ids,
            commits: Vec::new(),
            issues: linked_issues,
            manual_notes: vec![note.clone()],
            source_links: note.source_links.clone(),
            source_file: note.source_file.clone(),
        });
    }

    entries
}

fn categorize_from_message(msg: &str) -> ChangeCategory {
    let lower = msg.to_lowercase();

    if lower.contains("已知问题") || lower.contains("known issue") || lower.contains("known_issue") {
        return ChangeCategory::KnownIssue;
    }
    if lower.contains("升级") || lower.contains("upgrade") || lower.contains("breaking") {
        return ChangeCategory::UpgradeNotice;
    }
    if lower.starts_with("fix")
        || lower.starts_with("修复")
        || lower.starts_with("bugfix")
        || lower.starts_with("bug fix")
        || lower.contains("fixes:")
        || lower.contains("fix:")
    {
        return ChangeCategory::Fix;
    }
    if lower.starts_with("feat")
        || lower.starts_with("功能")
        || lower.starts_with("feature")
        || lower.contains("feat:")
        || lower.contains("feature:")
    {
        return ChangeCategory::Feature;
    }
    ChangeCategory::Unknown
}

fn extract_scope(msg: &str) -> Option<String> {
    let re = regex::Regex::new(r"(?i)scope\s*[:=]\s*([^\s,]+)").unwrap();
    re.captures(msg)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str().to_string())
        .filter(|s| !s.is_empty())
}
