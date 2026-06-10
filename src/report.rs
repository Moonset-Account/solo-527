use crate::diff::{ChangeSeverity, DiffResult, Change};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ReportFormat {
    Markdown,
    Json,
    PrettyJson,
    Text,
}

impl std::str::FromStr for ReportFormat {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "markdown" | "md" => Ok(ReportFormat::Markdown),
            "json" => Ok(ReportFormat::Json),
            "pretty-json" | "pretty_json" | "prettyjson" => Ok(ReportFormat::PrettyJson),
            "text" | "console" | "human" => Ok(ReportFormat::Text),
            other => Err(format!("Unknown format: {}", other)),
        }
    }
}

impl std::fmt::Display for ReportFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ReportFormat::Markdown => write!(f, "markdown"),
            ReportFormat::Json => write!(f, "json"),
            ReportFormat::PrettyJson => write!(f, "pretty-json"),
            ReportFormat::Text => write!(f, "text"),
        }
    }
}

pub struct ReportGenerator;

impl ReportGenerator {
    pub fn generate(result: &DiffResult, format: ReportFormat) -> String {
        match format {
            ReportFormat::Markdown => Self::generate_markdown(result),
            ReportFormat::Json => Self::generate_json(result, false),
            ReportFormat::PrettyJson => Self::generate_json(result, true),
            ReportFormat::Text => Self::generate_text(result),
        }
    }

    fn generate_markdown(result: &DiffResult) -> String {
        let mut out = String::new();

        out.push_str(&format!(
            "# API Contract Change Report\n\n"
        ));
        out.push_str(&format!(
            "**Version**: `{}` → `{}`\n\n",
            result.old_version, result.new_version
        ));

        out.push_str("## Summary\n\n");
        out.push_str(&format!(
            "- 📊 **Total Changes**: {}\n",
            result.total_changes
        ));
        out.push_str(&format!(
            "- 🔴 **Breaking**: {}  \n",
            result.breaking_count
        ));
        out.push_str(&format!(
            "- 🟡 **Warnings**: {}  \n",
            result.warning_count
        ));
        out.push_str(&format!(
            "- 🔵 **Info**: {}  \n",
            result.info_count
        ));
        if result.ignored_count > 0 {
            out.push_str(&format!(
                "- ⏭️  **Ignored**: {}\n",
                result.ignored_count
            ));
        }
        out.push('\n');

        if result.has_breaking_changes() {
            out.push_str("> ⚠️  **This change contains BREAKING changes.**\n\n");
        }

        if !result.affected_endpoints.is_empty() {
            out.push_str("## Affected Endpoints\n\n");
            for ep in &result.affected_endpoints {
                let changes_for_ep = count_changes_by_endpoint(&result.changes, ep);
                out.push_str(&format!(
                    "- **{}** — {} change(s)\n",
                    ep, changes_for_ep
                ));
            }
            out.push('\n');
        }

        let by_severity = group_by_severity(&result.changes);

        if let Some(breaking) = by_severity.get(&ChangeSeverity::Breaking) {
            if !breaking.is_empty() {
                out.push_str("## 🔴 Breaking Changes\n\n");
                Self::render_change_table_markdown(&mut out, breaking);
                out.push('\n');
            }
        }

        if let Some(warnings) = by_severity.get(&ChangeSeverity::Warning) {
            if !warnings.is_empty() {
                out.push_str("## 🟡 Warnings\n\n");
                Self::render_change_table_markdown(&mut out, warnings);
                out.push('\n');
            }
        }

        if let Some(info) = by_severity.get(&ChangeSeverity::Info) {
            if !info.is_empty() {
                out.push_str("## 🔵 Info / Additions\n\n");
                Self::render_change_table_markdown(&mut out, info);
                out.push('\n');
            }
        }

        out
    }

    fn render_change_table_markdown(out: &mut String, changes: &[&Change]) {
        out.push_str("| # | Type | Endpoint | Field | Message |\n");
        out.push_str("|---|------|----------|-------|---------|\n");
        for (i, ch) in changes.iter().enumerate() {
            let endpoint = ch.endpoint();
            let field = ch.field.as_deref().unwrap_or("-");
            let msg = ch.message.replace('|', "\\|").replace('\n', " ");
            out.push_str(&format!(
                "| {} | {} | `{}` | `{}` | {} |\n",
                i + 1,
                ch.change_type.label(),
                endpoint,
                field,
                msg
            ));
        }
    }

    fn generate_json(result: &DiffResult, pretty: bool) -> String {
        if pretty {
            serde_json::to_string_pretty(result).unwrap_or_else(|e| format!("{{\"error\": \"{}\"}}", e))
        } else {
            serde_json::to_string(result).unwrap_or_else(|e| format!("{{\"error\": \"{}\"}}", e))
        }
    }

    fn generate_text(result: &DiffResult) -> String {
        let mut out = String::new();

        let bar = "═".repeat(60);
        out.push_str(&format!("{}\n", bar));
        out.push_str("  API CONTRACT CHANGE REPORT\n");
        out.push_str(&format!("{}\n\n", bar));

        out.push_str(&format!(
            "  Version:  {}  →  {}\n\n",
            result.old_version, result.new_version
        ));

        out.push_str("  ┌─────────────────── SUMMARY ───────────────────┐\n");
        out.push_str(&format!(
            "  │  📊 Total Changes    : {:<26} │\n",
            result.total_changes
        ));
        out.push_str(&format!(
            "  │  🔴 Breaking         : {:<26} │\n",
            result.breaking_count
        ));
        out.push_str(&format!(
            "  │  🟡 Warnings         : {:<26} │\n",
            result.warning_count
        ));
        out.push_str(&format!(
            "  │  🔵 Info             : {:<26} │\n",
            result.info_count
        ));
        if result.ignored_count > 0 {
            out.push_str(&format!(
                "  │  ⏭️  Ignored          : {:<26} │\n",
                result.ignored_count
            ));
        }
        out.push_str("  └─────────────────────────────────────────────────┘\n\n");

        if result.has_breaking_changes() {
            out.push_str("  ⚠️   BREAKING CHANGES DETECTED!\n\n");
        }

        if !result.affected_endpoints.is_empty() {
            out.push_str("─── AFFECTED ENDPOINTS ──────────────────────────────\n");
            for ep in &result.affected_endpoints {
                let count = count_changes_by_endpoint(&result.changes, ep);
                out.push_str(&format!("  • {:<55} ({})\n", ep, count));
            }
            out.push('\n');
        }

        let by_severity = group_by_severity(&result.changes);

        if let Some(breaking) = by_severity.get(&ChangeSeverity::Breaking) {
            if !breaking.is_empty() {
                out.push_str("─── 🔴 BREAKING CHANGES ─────────────────────────────\n\n");
                Self::render_changes_text(&mut out, breaking);
                out.push('\n');
            }
        }

        if let Some(warnings) = by_severity.get(&ChangeSeverity::Warning) {
            if !warnings.is_empty() {
                out.push_str("─── 🟡 WARNINGS ─────────────────────────────────────\n\n");
                Self::render_changes_text(&mut out, warnings);
                out.push('\n');
            }
        }

        if let Some(info) = by_severity.get(&ChangeSeverity::Info) {
            if !info.is_empty() {
                out.push_str("─── 🔵 INFO / ADDITIONS ─────────────────────────────\n\n");
                Self::render_changes_text(&mut out, info);
                out.push('\n');
            }
        }

        out.push_str(&format!("{}\n", bar));
        out
    }

    fn render_changes_text(out: &mut String, changes: &[&Change]) {
        for (i, ch) in changes.iter().enumerate() {
            out.push_str(&format!("  [{:>3}] {} {}\n", i + 1, ch.severity.emoji(), ch.change_type.label()));
            out.push_str(&format!("         Endpoint: {}\n", ch.endpoint()));
            if let Some(field) = &ch.field {
                out.push_str(&format!("         Field:    {}\n", field));
            }
            out.push_str(&format!("         Message:  {}\n", ch.message));
            if let Some(old) = &ch.old_value {
                out.push_str(&format!("         Old:      {}\n", truncate(old, 80)));
            }
            if let Some(new) = &ch.new_value {
                out.push_str(&format!("         New:      {}\n", truncate(new, 80)));
            }
            out.push('\n');
        }
    }
}

fn group_by_severity(changes: &[Change]) -> BTreeMap<ChangeSeverity, Vec<&Change>> {
    let mut map: BTreeMap<ChangeSeverity, Vec<&Change>> = BTreeMap::new();
    for ch in changes {
        map.entry(ch.severity).or_default().push(ch);
    }
    map
}

fn count_changes_by_endpoint(changes: &[Change], endpoint: &str) -> usize {
    changes.iter().filter(|c| c.endpoint() == endpoint).count()
}

fn truncate(s: &str, max: usize) -> String {
    if s.len() <= max {
        s.to_string()
    } else {
        let mut result: String = s.chars().take(max - 3).collect();
        result.push_str("...");
        result
    }
}
