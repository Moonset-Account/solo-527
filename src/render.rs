use crate::models::*;
use crate::validation::{build_entries_from_collected, needs_pending_review, validate_entries};
use anyhow::{Context, Result};
use std::collections::HashMap;
use std::path::Path;

pub struct RenderOptions {
    pub product_line: String,
    pub version: String,
    pub template_file: Option<std::path::PathBuf>,
    pub collected_data_file: Option<std::path::PathBuf>,
}

pub fn default_templates() -> HashMap<String, ProductLineTemplate> {
    let mut templates = HashMap::new();

    templates.insert(
        "default".to_string(),
        ProductLineTemplate {
            name: "default".to_string(),
            product_name: "产品".to_string(),
            feature_title: "新功能".to_string(),
            fix_title: "修复".to_string(),
            known_issue_title: "已知问题".to_string(),
            upgrade_notice_title: "升级提醒".to_string(),
            pending_title: "待补充内容".to_string(),
            category_keywords: HashMap::from([
                ("feature".to_string(), vec!["feature".to_string(), "feat".to_string(), "新功能".to_string(), "功能".to_string(), "enhancement".to_string()]),
                ("fix".to_string(), vec!["bug".to_string(), "fix".to_string(), "bugfix".to_string(), "修复".to_string(), "defect".to_string()]),
                ("known_issue".to_string(), vec!["known-issue".to_string(), "known_issue".to_string(), "known issue".to_string(), "已知问题".to_string(), "issue".to_string()]),
                ("upgrade_notice".to_string(), vec!["deprecation".to_string(), "upgrade".to_string(), "breaking".to_string(), "升级".to_string(), "deprecated".to_string(), "migration".to_string()]),
            ]),
        },
    );

    templates.insert(
        "mobile".to_string(),
        ProductLineTemplate {
            name: "mobile".to_string(),
            product_name: "移动端 App".to_string(),
            feature_title: "✨ 新功能".to_string(),
            fix_title: "🐛 修复与改进".to_string(),
            known_issue_title: "⚠️ 已知问题".to_string(),
            upgrade_notice_title: "🚀 升级提醒".to_string(),
            pending_title: "📝 待补充".to_string(),
            category_keywords: HashMap::from([
                ("feature".to_string(), vec!["feature".to_string(), "feat".to_string(), "新功能".to_string(), "功能".to_string(), "enhancement".to_string(), "ui".to_string()]),
                ("fix".to_string(), vec!["bug".to_string(), "fix".to_string(), "bugfix".to_string(), "修复".to_string(), "defect".to_string(), "ios".to_string(), "android".to_string(), "crash".to_string()]),
                ("known_issue".to_string(), vec!["known-issue".to_string(), "known_issue".to_string(), "known issue".to_string(), "已知问题".to_string(), "issue".to_string(), "limitation".to_string()]),
                ("upgrade_notice".to_string(), vec!["deprecation".to_string(), "upgrade".to_string(), "breaking".to_string(), "升级".to_string(), "deprecated".to_string(), "migration".to_string(), "sdk".to_string()]),
            ]),
        },
    );

    templates.insert(
        "enterprise".to_string(),
        ProductLineTemplate {
            name: "enterprise".to_string(),
            product_name: "企业级平台".to_string(),
            feature_title: "功能增强".to_string(),
            fix_title: "缺陷修复".to_string(),
            known_issue_title: "遗留问题".to_string(),
            upgrade_notice_title: "迁移与升级".to_string(),
            pending_title: "信息待完善".to_string(),
            category_keywords: HashMap::from([
                ("feature".to_string(), vec!["feature".to_string(), "feat".to_string(), "新功能".to_string(), "功能".to_string(), "enhancement".to_string(), "模块".to_string()]),
                ("fix".to_string(), vec!["bug".to_string(), "fix".to_string(), "bugfix".to_string(), "修复".to_string(), "defect".to_string(), "缺陷".to_string()]),
                ("known_issue".to_string(), vec!["known-issue".to_string(), "known_issue".to_string(), "known issue".to_string(), "已知问题".to_string(), "issue".to_string(), "遗留".to_string(), "限制".to_string()]),
                ("upgrade_notice".to_string(), vec!["deprecation".to_string(), "upgrade".to_string(), "breaking".to_string(), "升级".to_string(), "deprecated".to_string(), "migration".to_string(), "迁移".to_string(), "废弃".to_string()]),
            ]),
        },
    );

    templates
}

pub fn load_template(path: &Path) -> Result<ProductLineTemplate> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("无法读取模板文件: {}", path.display()))?;
    let template: ProductLineTemplate = serde_json::from_str(&content)
        .with_context(|| format!("解析模板 JSON 失败: {}", path.display()))?;
    Ok(template)
}

pub fn get_template(product_line: &str, template_file: Option<&Path>) -> Result<ProductLineTemplate> {
    if let Some(path) = template_file {
        return load_template(path);
    }
    let templates = default_templates();
    Ok(templates
        .get(product_line)
        .cloned()
        .unwrap_or_else(|| templates.get("default").cloned().unwrap()))
}

fn category_from_keyword(key: &str) -> Option<ChangeCategory> {
    match key.to_lowercase().as_str() {
        "feature" | "features" | "feat" => Some(ChangeCategory::Feature),
        "fix" | "fixes" | "bugfix" => Some(ChangeCategory::Fix),
        "known_issue" | "known-issue" | "knownissue" | "known_issues" => Some(ChangeCategory::KnownIssue),
        "upgrade_notice" | "upgrade-notice" | "upgradenotice" | "upgrade" | "deprecation" => Some(ChangeCategory::UpgradeNotice),
        _ => None,
    }
}

pub fn derive_category_from_issues(
    issues: &[IssueInfo],
    template: &ProductLineTemplate,
) -> Option<ChangeCategory> {
    if issues.is_empty() {
        return None;
    }

    let all_labels: Vec<String> = issues
        .iter()
        .flat_map(|i| i.labels.iter().map(|l| l.to_lowercase()))
        .collect();

    let mut best: Option<(ChangeCategory, usize)> = None;
    for (cat_key, keywords) in &template.category_keywords {
        if let Some(cat) = category_from_keyword(cat_key) {
            let matches = keywords
                .iter()
                .filter(|kw| all_labels.iter().any(|l| l == &kw.to_lowercase()))
                .count();
            if matches > 0 && (best.is_none() || matches > best.as_ref().unwrap().1) {
                best = Some((cat, matches));
            }
        }
    }

    if best.is_none() {
        let all_titles_lower: Vec<String> = issues
            .iter()
            .map(|i| i.title.to_lowercase())
            .filter(|t| !t.is_empty())
            .collect();

        for (cat_key, keywords) in &template.category_keywords {
            if let Some(cat) = category_from_keyword(cat_key) {
                let matches = keywords
                    .iter()
                    .filter(|kw| {
                        let kw_lower = kw.to_lowercase();
                        all_titles_lower.iter().any(|t| t.contains(&kw_lower))
                    })
                    .count();
                if matches > 0 && (best.is_none() || matches > best.as_ref().unwrap().1) {
                    best = Some((cat, matches));
                }
            }
        }
    }

    if best.is_none() {
        for label in &all_labels {
            if let Some(cat) = category_from_keyword(label) {
                return Some(cat);
            }
        }
    }

    if best.is_none() {
        for title_lower in issues.iter().map(|i| i.title.to_lowercase()) {
            if let Some(cat) = category_from_keyword(&title_lower) {
                return Some(cat);
            }
        }
    }

    best.map(|(c, _)| c)
}

pub fn derive_title_from_issues(issues: &[IssueInfo]) -> Option<String> {
    issues
        .first()
        .map(|i| i.title.trim().to_string())
        .filter(|t| !t.is_empty())
}

pub fn merge_issue_links(issues: &[IssueInfo]) -> Vec<SourceLink> {
    issues
        .iter()
        .filter_map(|i| {
            i.url.as_ref().map(|u| SourceLink {
                url: u.clone(),
                label: Some(i.id.clone()),
                source_type: "issue".to_string(),
            })
        })
        .collect()
}

pub fn enrich_entry_with_issues(
    mut entry: ChangeEntry,
    template: &ProductLineTemplate,
) -> ChangeEntry {
    let title_empty = entry
        .title
        .as_ref()
        .map(|t| t.trim().is_empty())
        .unwrap_or(true);
    let title_equals_description = entry
        .title
        .as_ref()
        .zip(Some(&entry.description))
        .map(|(t, d)| t.trim() == d.trim())
        .unwrap_or(false);
    let needs_title = title_empty || (title_equals_description && !entry.issues.is_empty());
    if needs_title {
        if let Some(derived_title) = derive_title_from_issues(&entry.issues) {
            entry.title = Some(derived_title);
        }
    }

    if matches!(entry.category, ChangeCategory::Unknown) {
        if let Some(derived_cat) = derive_category_from_issues(&entry.issues, template) {
            entry.category = derived_cat;
        }
    }

    let issue_links = merge_issue_links(&entry.issues);
    for link in issue_links {
        if !entry.source_links.iter().any(|l| l.url == link.url) {
            entry.source_links.push(link);
        }
    }

    entry
}

pub fn enrich_entries_with_issues(
    entries: Vec<ChangeEntry>,
    template: &ProductLineTemplate,
) -> Vec<ChangeEntry> {
    entries
        .into_iter()
        .map(|e| enrich_entry_with_issues(e, template))
        .collect()
}

pub fn group_entries(entries: Vec<ChangeEntry>) -> GroupedChanges {
    let mut features = Vec::new();
    let mut fixes = Vec::new();
    let mut known_issues = Vec::new();
    let mut upgrade_notices = Vec::new();
    let mut pending_review = Vec::new();

    for entry in entries {
        if needs_pending_review(&entry) {
            pending_review.push(entry);
            continue;
        }

        match entry.category {
            ChangeCategory::Feature => features.push(entry),
            ChangeCategory::Fix => fixes.push(entry),
            ChangeCategory::KnownIssue => known_issues.push(entry),
            ChangeCategory::UpgradeNotice => upgrade_notices.push(entry),
            ChangeCategory::Unknown => pending_review.push(entry),
        }
    }

    GroupedChanges {
        features,
        fixes,
        known_issues,
        upgrade_notices,
        pending_review,
    }
}

pub fn render(
    data: &CollectedData,
    opts: &RenderOptions,
) -> Result<RenderedReleaseNote> {
    let template = get_template(&opts.product_line, opts.template_file.as_deref())?;
    let raw_entries = build_entries_from_collected(data);
    let entries = enrich_entries_with_issues(raw_entries, &template);
    let grouped = group_entries(entries.clone());
    let validation = validate_entries(&entries);

    let mut input_files = data.input_files.clone();
    if let Some(cdf) = &opts.collected_data_file {
        if !input_files.iter().any(|p| p == cdf) {
            input_files.insert(0, cdf.clone());
        }
    }

    Ok(RenderedReleaseNote {
        product_line: template.name.clone(),
        product_name: template.product_name.clone(),
        feature_title: template.feature_title.clone(),
        fix_title: template.fix_title.clone(),
        known_issue_title: template.known_issue_title.clone(),
        upgrade_notice_title: template.upgrade_notice_title.clone(),
        pending_title: template.pending_title.clone(),
        template_file: opts.template_file.clone(),
        version: opts.version.clone(),
        generated_at: chrono::Utc::now(),
        input_files,
        grouped,
        validation,
    })
}

pub fn render_markdown(report: &RenderedReleaseNote) -> Result<String> {
    let mut md = String::new();
    md.push_str(&format!("# {} {} 发布说明\n\n", report.product_name, report.version));
    md.push_str(&format!(
        "> 生成时间: {}  \n",
        report.generated_at.format("%Y-%m-%d %H:%M:%S UTC")
    ));

    if !report.input_files.is_empty() {
        md.push_str("> 输入文件: ");
        let files: Vec<String> = report
            .input_files
            .iter()
            .map(|p| p.display().to_string())
            .collect();
        md.push_str(&files.join(", "));
        md.push_str("  \n");
    }
    if let Some(tf) = &report.template_file {
        md.push_str(&format!("> 模板文件: {}  \n", tf.display()));
    }
    md.push_str("\n");

    md.push_str(&render_section_markdown(
        &report.feature_title,
        &report.grouped.features,
        "暂无新功能",
    ));
    md.push_str(&render_section_markdown(
        &report.fix_title,
        &report.grouped.fixes,
        "暂无修复内容",
    ));
    md.push_str(&render_section_markdown(
        &report.known_issue_title,
        &report.grouped.known_issues,
        "暂无已知问题",
    ));
    md.push_str(&render_section_markdown(
        &report.upgrade_notice_title,
        &report.grouped.upgrade_notices,
        "暂无升级提醒",
    ));

    if !report.grouped.pending_review.is_empty() {
        md.push_str(&format!("## {}\n\n", report.pending_title));
        md.push_str(
            "以下条目缺少必要信息（工单编号、标题、影响范围或分类），请补充完善后再纳入正式发布说明：\n\n",
        );
        for entry in &report.grouped.pending_review {
            md.push_str(&format!("### {}\n\n", entry.title.clone().unwrap_or_else(|| format!("条目 {}", entry.id))));
            md.push_str(&format!("- ID: `{}`  \n", entry.id));
            if let Some(scope) = &entry.scope {
                md.push_str(&format!("- 影响范围: {}  \n", scope));
            } else {
                md.push_str("- ⚠️ 缺少影响范围  \n");
            }
            md.push_str(&format!("- 分类: `{}`  \n", entry.category));
            if entry.ticket_ids.is_empty() {
                md.push_str("- ⚠️ 缺少工单编号  \n");
            } else {
                md.push_str(&format!("- 工单: {}  \n", entry.ticket_ids.join(", ")));
            }
            if let Some(src) = &entry.source_file {
                md.push_str(&format!("- 来源文件: `{}`  \n", src.display()));
            }
            for link in &entry.source_links {
                md.push_str(&format!(
                    "- {}: [{}]({})\n",
                    link.source_type,
                    link.label.clone().unwrap_or_else(|| link.url.clone()),
                    link.url
                ));
            }
            md.push_str(&format!("\n> 原始描述: {}\n\n", entry.description));
        }
        md.push_str("\n");
    }

    if !report.validation.issues.is_empty() {
        md.push_str("## 校验报告\n\n");
        md.push_str(&format!(
            "**校验结果:** {}\n\n",
            if report.validation.is_valid { "✅ 通过" } else { "❌ 存在错误" }
        ));
        md.push_str("| 规则编号 | 严重程度 | 描述 | 影响字段 | 建议修复 |\n");
        md.push_str("|---------|---------|------|---------|--------|\n");
        for issue in &report.validation.issues {
            let entry_info = issue
                .entry_id
                .as_ref()
                .map(|e| format!(" ({})", e))
                .unwrap_or_default();
            md.push_str(&format!(
                "| {} | {} | {}{} | {} | {} |\n",
                issue.rule_id,
                issue.severity,
                issue.description,
                entry_info,
                issue.affected_fields.join(", "),
                issue.suggested_action
            ));
        }
        md.push_str("\n");
    }

    Ok(md)
}

fn render_section_markdown(
    title: &str,
    entries: &[ChangeEntry],
    empty_msg: &str,
) -> String {
    let mut md = format!("## {}\n\n", title);
    if entries.is_empty() {
        md.push_str(&format!("_{}_\n\n", empty_msg));
        return md;
    }

    for entry in entries {
        let title_text = entry
            .title
            .clone()
            .unwrap_or_else(|| format!("条目 {}", entry.id));
        md.push_str(&format!("- **{}**", title_text));
        if let Some(scope) = &entry.scope {
            md.push_str(&format!(" (_{}_)", scope));
        }
        md.push_str("\n");

        if !entry.ticket_ids.is_empty() || !entry.issues.is_empty() {
            let mut parts: Vec<String> = Vec::new();
            for tid in &entry.ticket_ids {
                if let Some(issue) = entry.issues.iter().find(|i| &i.id == tid) {
                    if let Some(url) = &issue.url {
                        parts.push(format!("[{}: {}]({})", issue.id, issue.title, url));
                    } else {
                        parts.push(format!("{}: {}", issue.id, issue.title));
                    }
                } else {
                    parts.push(tid.clone());
                }
            }
            for issue in entry.issues.iter() {
                if !entry.ticket_ids.iter().any(|t| t == &issue.id) {
                    if let Some(url) = &issue.url {
                        parts.push(format!("[{}: {}]({})", issue.id, issue.title, url));
                    } else {
                        parts.push(format!("{}: {}", issue.id, issue.title));
                    }
                }
            }
            md.push_str(&format!("  - 工单: {}\n", parts.join(", ")));
        }
        if !entry.description.is_empty() {
            md.push_str(&format!("  - 描述: {}\n", entry.description));
        }
        if !entry.source_links.is_empty() {
            for link in &entry.source_links {
                let label = link.label.clone().unwrap_or_else(|| link.url.clone());
                md.push_str(&format!("  - [{}]({})\n", label, link.url));
            }
        }
    }
    md.push_str("\n");
    md
}
