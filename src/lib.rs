pub mod cli;
pub mod completion;
pub mod dedup;
pub mod errors;
pub mod exporter;
pub mod file_walker;
pub mod filter;
pub mod logger;
pub mod models;
pub mod parser;

pub use cli::{Cli, Commands, ScanArgs};
pub use errors::{exit_code, Note2TaskError, EXIT_NOTHING_TO_DO, EXIT_SUCCESS};
pub use models::ExportReport;

use crate::cli::ParsedExport;
use crate::dedup::{deduplicate, DedupResult};
use crate::errors::Result;
use crate::exporter::export;
use crate::file_walker::collect_markdown_files;
use crate::filter::{apply_filters, FilterCriteria};
use crate::parser::MarkdownParser;

pub fn run_scan(args: &ScanArgs) -> Result<ExportReport> {
    let today = args.resolve_today()?;
    log::info!("今日日期: {}", today);

    if args.dry_run {
        log::warn!(
            "[dry-run] 已启用预览模式 - 不会写入任何文件，仅展示将执行的操作"
        );
    }

    let parsed_export = args.parse_export()?;
    let due_filter = args.parse_due_filter(today)?;

    let scan = collect_markdown_files(&args.from)?;
    if scan.files.is_empty() {
        return Err(Note2TaskError::NoMarkdownFiles(format!(
            "在以下路径中未找到 Markdown 文件: {}",
            args.from
                .iter()
                .map(|p| p.display().to_string())
                .collect::<Vec<_>>()
                .join(", ")
        )));
    }

    let parser = MarkdownParser::new(today).with_strict(args.strict);
    let mut all_items = Vec::new();

    for file in &scan.files {
        log::info!("解析: {}", file.display());
        let items = parser.parse_file(file)?;
        all_items.extend(items);
    }

    let total_parsed = all_items.len();
    log::info!("共解析 {} 个待办项", total_parsed);

    let items_after_filter = {
        let criteria = FilterCriteria {
            tags_any: vec![],
            tags_all: args.tags.clone(),
            due: due_filter,
            status: args.status_filter.clone(),
            projects: args.projects.clone(),
            priority: args.priority,
            today,
        };
        apply_filters(all_items, &criteria)
    };

    let total_before_dedup = items_after_filter.len();
    let mut final_items = if args.no_dedup {
        items_after_filter
    } else {
        let DedupResult { unique_items, .. } = deduplicate(items_after_filter);
        unique_items
    };

    log::info!(
        "过滤后: {} 项, 去重后: {} 项 (去除 {} 重复)",
        total_before_dedup,
        final_items.len(),
        total_before_dedup - final_items.len()
    );

    sort_items(&mut final_items);

    let ParsedExport { format, path } = &parsed_export;
    let report = export(
        &final_items,
        scan.files,
        *format,
        path.as_deref(),
        args.dry_run,
        total_parsed,
        total_before_dedup,
    )?;

    Ok(report)
}

fn sort_items(items: &mut Vec<models::TodoItem>) {
    items.sort_by(|a, b| {
        use std::cmp::Ordering;

        let due_cmp = match (&a.due_date, &b.due_date) {
            (Some(d1), Some(d2)) => {
                let today = chrono::Local::now().date_naive();
                let date1 = d1.to_naive_date(today);
                let date2 = d2.to_naive_date(today);
                match (date1, date2) {
                    (Some(x), Some(y)) => x.cmp(&y),
                    (Some(_), None) => Ordering::Less,
                    (None, Some(_)) => Ordering::Greater,
                    (None, None) => Ordering::Equal,
                }
            }
            (Some(_), None) => Ordering::Less,
            (None, Some(_)) => Ordering::Greater,
            (None, None) => Ordering::Equal,
        };
        if due_cmp != Ordering::Equal {
            return due_cmp;
        }

        let prio_cmp = match (a.priority, b.priority) {
            (Some(p1), Some(p2)) => p1.cmp(&p2),
            (Some(_), None) => Ordering::Less,
            (None, Some(_)) => Ordering::Greater,
            (None, None) => Ordering::Equal,
        };
        if prio_cmp != Ordering::Equal {
            return prio_cmp;
        }

        let proj_cmp = a.project.cmp(&b.project);
        if proj_cmp != Ordering::Equal {
            return proj_cmp;
        }

        a.content.to_lowercase().cmp(&b.content.to_lowercase())
    });
}
