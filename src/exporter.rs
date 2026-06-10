use crate::errors::{Note2TaskError, Result};
use crate::models::{ExportFormat, ExportReport, TodoItem};
use chrono::Local;
use serde_json::json;
use std::io::Write;
use std::path::Path;

pub fn export(
    items: &[TodoItem],
    files_scanned: Vec<std::path::PathBuf>,
    format: ExportFormat,
    output_path: Option<&Path>,
    dry_run: bool,
    total_parsed: usize,
) -> Result<ExportReport> {
    let duplicates_removed = total_parsed - items.len();
    let report = ExportReport {
        generated_at: Local::now().format("%Y-%m-%dT%H:%M:%S%z").to_string(),
        total_parsed,
        total_after_dedup: items.len(),
        duplicates_removed,
        files_scanned,
        items: items.to_vec(),
        dry_run,
    };

    match format {
        ExportFormat::Stdout => {
            render_stdout(&report)?;
            if dry_run && output_path.is_some() {
                log::info!(
                    "[dry-run] 将写入文件: {} ({} 个任务)",
                    output_path.unwrap().display(),
                    items.len()
                );
            } else if let Some(path) = output_path {
                let content = render_stdout_string(&report)?;
                write_file(path, &content, dry_run)?;
            }
        }
        ExportFormat::Json => {
            let json_str = serde_json::to_string_pretty(&to_json_value(&report))?;
            match output_path {
                Some(path) => write_file(path, &json_str, dry_run)?,
                None => {
                    let mut stdout = std::io::stdout();
                    writeln!(stdout, "{}", json_str).ok();
                }
            }
        }
        ExportFormat::Markdown => {
            let md = render_markdown(&report)?;
            match output_path {
                Some(path) => write_file(path, &md, dry_run)?,
                None => {
                    let mut stdout = std::io::stdout();
                    writeln!(stdout, "{}", md).ok();
                }
            }
        }
    }

    Ok(report)
}

fn to_json_value(report: &ExportReport) -> serde_json::Value {
    let items_json: Vec<serde_json::Value> = report
        .items
        .iter()
        .map(|item| {
            json!({
                "id": item.id,
                "content": item.content,
                "status": format!("{}", item.status),
                "status_symbol": item.status.to_symbol(),
                "project": item.project,
                "tags": item.tags.iter().map(|t| t.as_str().to_string()).collect::<Vec<_>>(),
                "due_date": item.due_date.as_ref().map(|d| format!("{}", d)),
                "priority": item.priority,
                "source": {
                    "file": item.source.file.to_string_lossy(),
                    "line": item.source.line,
                    "raw_text": item.source.raw_text,
                }
            })
        })
        .collect();

    json!({
        "generated_at": report.generated_at,
        "summary": {
            "total_parsed": report.total_parsed,
            "total_after_dedup": report.total_after_dedup,
            "duplicates_removed": report.duplicates_removed,
            "files_scanned_count": report.files_scanned.len(),
        },
        "files_scanned": report.files_scanned.iter()
            .map(|p| p.to_string_lossy().to_string())
            .collect::<Vec<_>>(),
        "items": items_json,
        "dry_run": report.dry_run,
    })
}

fn render_stdout(report: &ExportReport) -> Result<()> {
    let s = render_stdout_string(report)?;
    let mut stdout = std::io::stdout();
    writeln!(stdout, "{}", s).ok();
    Ok(())
}

fn render_stdout_string(report: &ExportReport) -> Result<String> {
    let mut out = String::new();
    out.push_str(&format!(
        "📋 note2task 扫描报告  (生成于 {})\n",
        report.generated_at
    ));
    out.push_str(&format!(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    ));
    out.push_str(&format!(
        "扫描文件: {} 个  |  解析待办: {}  |  去重后: {}  |  去除重复: {}\n",
        report.files_scanned.len(),
        report.total_parsed,
        report.total_after_dedup,
        report.duplicates_removed
    ));
    if report.dry_run {
        out.push_str("模式: [dry-run] 预览  ⚠️  未写入文件\n");
    }
    out.push_str("\n");

    if report.items.is_empty() {
        out.push_str("✅  没有找到待办任务。\n");
        return Ok(out);
    }

    for (idx, item) in report.items.iter().enumerate() {
        let proj = item.project.as_deref().unwrap_or("(无项目)");
        let status_sym = format!("[{}]", item.status.to_symbol());
        let prio = match item.priority {
            Some(p) => format!(" !{}", p),
            None => String::new(),
        };
        let due = match &item.due_date {
            Some(d) => format!(" @{}", d),
            None => String::new(),
        };
        let tags = if item.tags.is_empty() {
            String::new()
        } else {
            item.tags
                .iter()
                .map(|t| format!(" {}", t))
                .collect::<Vec<_>>()
                .join("")
        };

        out.push_str(&format!(
            "{:>3}. {} {} {}{}{}{}\n",
            idx + 1,
            status_sym,
            item.content,
            proj_display(proj),
            tags,
            due,
            prio
        ));
        out.push_str(&format!(
            "      ↳ {}:{}  |  ID: {}\n",
            item.source.file.display(),
            item.source.line,
            &item.id[..8]
        ));
    }

    Ok(out)
}

fn proj_display(p: &str) -> String {
    if p == "(无项目)" {
        String::new()
    } else {
        format!("  📁 {}", p)
    }
}

fn render_markdown(report: &ExportReport) -> Result<String> {
    let mut out = String::new();
    out.push_str(&format!("# note2task 任务报告\n\n"));
    out.push_str(&format!(
        "> 生成时间: {}  |  模式: {}\n\n",
        report.generated_at,
        if report.dry_run { "预览 (dry-run)" } else { "正式" }
    ));
    out.push_str(&format!("## 概览\n\n"));
    out.push_str(&format!(
        "| 指标 | 数值 |\n| --- | --- |\n| 扫描文件 | {} |\n| 解析待办 | {} |\n| 去重后 | {} |\n| 去除重复 | {} |\n\n",
        report.files_scanned.len(),
        report.total_parsed,
        report.total_after_dedup,
        report.duplicates_removed
    ));

    out.push_str(&format!("## 任务列表\n\n"));

    if report.items.is_empty() {
        out.push_str("没有找到待办任务。\n");
        return Ok(out);
    }

    out.push_str(&format!(
        "| # | 状态 | 内容 | 项目 | 标签 | 截止日期 | 优先级 | 来源 |\n"
    ));
    out.push_str(&format!(
        "| ---: | :---: | --- | --- | --- | --- | :---: | --- |\n"
    ));

    for (idx, item) in report.items.iter().enumerate() {
        let proj = item.project.as_deref().unwrap_or("-");
        let tags_str = if item.tags.is_empty() {
            "-".to_string()
        } else {
            item.tags
                .iter()
                .map(|t| t.to_string())
                .collect::<Vec<_>>()
                .join(" ")
        };
        let due_str = item
            .due_date
            .as_ref()
            .map(|d| d.to_string())
            .unwrap_or_else(|| "-".to_string());
        let prio_str = item
            .priority
            .map(|p| p.to_string())
            .unwrap_or_else(|| "-".to_string());
        let source_str = format!("`{}:{}`", item.source.file.display(), item.source.line);

        out.push_str(&format!(
            "| {} | {} | {} | {} | {} | {} | {} | {} |\n",
            idx + 1,
            item.status.to_symbol(),
            escape_md_cell(&item.content),
            escape_md_cell(proj),
            tags_str,
            due_str,
            prio_str,
            source_str
        ));
    }

    Ok(out)
}

fn escape_md_cell(s: &str) -> String {
    s.replace('|', "\\|").replace('\n', " ")
}

fn write_file(path: &Path, content: &str, dry_run: bool) -> Result<()> {
    if dry_run {
        log::info!(
            "[dry-run] 将写入 {} 字节到: {}",
            content.len(),
            path.display()
        );
        return Ok(());
    }

    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| Note2TaskError::WriteError {
                path: path.display().to_string(),
                reason: format!("无法创建目录: {}", e),
            })?;
        }
    }

    std::fs::write(path, content).map_err(|e| Note2TaskError::WriteError {
        path: path.display().to_string(),
        reason: e.to_string(),
    })?;

    log::info!("✓ 已写入 {} 字节到: {}", content.len(), path.display());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{DueDate, SourceLocation, Tag, TaskStatus, TodoItem};
    use chrono::NaiveDate;
    use std::path::PathBuf;

    fn sample_items() -> Vec<TodoItem> {
        vec![TodoItem {
            id: "abc123def4".to_string(),
            content: "测试任务内容".to_string(),
            status: TaskStatus::Todo,
            project: Some("测试项目".to_string()),
            tags: vec![Tag::new("bug").unwrap()],
            due_date: Some(DueDate::Date(
                NaiveDate::from_ymd_opt(2025, 1, 20).unwrap(),
            )),
            priority: Some(2),
            source: SourceLocation {
                file: PathBuf::from("test.md"),
                line: 10,
                raw_text: "- [ ] 测试任务内容 #bug @due(2025-01-20) !2".to_string(),
            },
        }]
    }

    #[test]
    fn test_json_export() {
        let items = sample_items();
        let report = export(
            &items,
            vec![PathBuf::from("test.md")],
            ExportFormat::Json,
            None,
            false,
            1,
        )
        .unwrap();
        assert_eq!(report.total_after_dedup, 1);
    }
}
