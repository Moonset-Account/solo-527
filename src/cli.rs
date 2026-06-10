use crate::errors::{Note2TaskError, Result};
use crate::models::{DueDateFilter, ExportFormat};
use chrono::{Datelike, Duration, NaiveDate};
use clap::ArgAction;
use clap::{Parser, Subcommand, ValueEnum};
use std::path::PathBuf;

#[derive(Copy, Clone, Debug, ValueEnum)]
pub enum Shell {
    Bash,
    Zsh,
    Fish,
    Powershell,
    Elvish,
}

impl Shell {
    pub fn to_clap_shell(self) -> clap_complete::Shell {
        match self {
            Shell::Bash => clap_complete::Shell::Bash,
            Shell::Zsh => clap_complete::Shell::Zsh,
            Shell::Fish => clap_complete::Shell::Fish,
            Shell::Powershell => clap_complete::Shell::PowerShell,
            Shell::Elvish => clap_complete::Shell::Elvish,
        }
    }
}

#[derive(Debug, Clone, Parser)]
#[command(
    name = "note2task",
    version,
    about = "Markdown笔记转任务命令行工具",
    long_about = "从 Markdown 笔记中解析待办事项、提取元数据（项目名、标签、截止日期、优先级），\n\
                   并生成统一格式的任务列表。支持去重、过滤、dry-run 预览、多种格式导出。",
    after_help = "\
示例：
  # 扫描当前目录下所有 Markdown 文件并输出到控制台
  note2task --from .

  # 仅显示 #bug 标签的待办，导出为 JSON
  note2task --from notes/ --tag bug --export json

  # 显示本周到期且优先级1的任务，JSON 输出到文件
  note2task --from . --due-before this-week --priority 1 --export json:tasks.json

  # 只预览不写入文件
  note2task --from . --dry-run

  # 生成 bash shell completion
  note2task completions bash > ~/.bash_completion.d/note2task
",
    arg_required_else_help = true,
)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Option<Commands>,

    #[arg(short, long, action = ArgAction::Count, global = true, help_heading = "全局选项")]
    pub verbose: u8,

    #[arg(long, global = true, help_heading = "全局选项", help = "安静模式，仅输出错误")]
    pub quiet: bool,
}

#[derive(Debug, Clone, Subcommand)]
pub enum Commands {
    #[command(
        name = "scan",
        visible_alias = "s",
        about = "扫描 Markdown 笔记并提取待办任务",
        long_about = "从指定路径递归扫描所有 Markdown 文件，解析待办项并导出。默认输出到控制台。",
        after_help = "示例：
  note2task scan --from ./notes
  note2task scan --from . --export json:out.json --dry-run
"
    )]
    Scan(ScanArgs),

    #[command(
        name = "completions",
        visible_alias = "c",
        about = "生成 Shell 补全脚本",
        after_help = "示例：note2task completions zsh > ~/.zfunc/_note2task"
    )]
    Completions {
        #[arg(value_enum)]
        shell: Shell,
    },
}

#[derive(Debug, Clone, Parser)]
pub struct ScanArgs {
    #[arg(
        short = 'f',
        long = "from",
        value_name = "PATH",
        help = "Markdown 源路径（文件或目录，目录将递归扫描）",
        long_help = "指定要扫描的 Markdown 文件或目录。\n\
                      如果是目录，会递归扫描所有 .md/.markdown 文件。\n\
                      可多次指定。默认扫描当前目录。",
        default_value = ".",
        num_args = 1..,
    )]
    pub from: Vec<PathBuf>,

    #[arg(
        short = 't',
        long = "tag",
        value_name = "TAG",
        help = "按标签过滤（可多次指定，逻辑 AND）",
        long_help = "只输出包含所有指定标签的任务。\n\
                      可多次指定，任务必须同时包含所有标签（AND）。",
        num_args = 1..,
    )]
    pub tags: Vec<String>,

    #[arg(
        long = "due",
        value_name = "SPEC",
        help = "按截止日期过滤: exact=YYYY-MM-DD | before=DATE | after=DATE | today | tomorrow | week | overdue",
        long_help = "日期格式:
  --due exact:2025-01-20   精确匹配指定日期
  --due before:2025-01-20  在指定日期之前（含当天）
  --due after:2025-01-20   在指定日期之后（含当天）
  --due today              今天到期
  --due tomorrow           明天到期
  --due week               本周内到期
  --due overdue            已逾期",
    )]
    pub due: Option<String>,

    #[arg(
        long = "status",
        value_name = "STATUS",
        help = "按状态过滤: todo | done | in-progress | cancelled（默认全部）",
        value_enum,
        num_args = 1..,
    )]
    pub status_filter: Vec<StatusFilter>,

    #[arg(
        long = "project",
        value_name = "NAME",
        help = "按项目名过滤（子串匹配，不区分大小写）",
        num_args = 1..,
    )]
    pub projects: Vec<String>,

    #[arg(
        long = "priority",
        value_name = "1-5",
        help = "按优先级过滤（1 最高）",
        value_parser = clap::value_parser!(u8).range(1..=5),
    )]
    pub priority: Option<u8>,

    #[arg(
        short = 'e',
        long = "export",
        value_name = "[FMT][:PATH]",
        default_value = "stdout",
        help = "导出格式和路径",
        long_help = "指定导出格式和可选的路径。
格式选项: stdout（默认）、json、md / markdown。
使用冒号分隔输出路径。
示例:
  --export stdout                控制台输出（默认）
  --export json                JSON 到控制台
  --export json:tasks.json    JSON 写入文件
  --export md:todo.md        Markdown 写入文件",
    )]
    pub export: String,

    #[arg(
        long = "no-dedup",
        help = "关闭去重（默认开启，同内容同项目同日期视为重复）",
    )]
    pub no_dedup: bool,

    #[arg(
        short = 'n',
        long = "dry-run",
        help = "预览模式：不写入文件，仅显示将要执行的操作",
    )]
    pub dry_run: bool,

    #[arg(
        long = "strict",
        help = "严格模式：遇到解析错误立即中止（默认警告并跳过）",
    )]
    pub strict: bool,

    #[arg(
        long = "today",
        value_name = "YYYY-MM-DD",
        help = "覆盖今日日期（用于测试相对日期 @due(today) 等）",
    )]
    pub today_override: Option<String>,
}

#[derive(Copy, Clone, Debug, ValueEnum)]
pub enum StatusFilter {
    Todo,
    Done,
    InProgress,
    Cancelled,
    All,
}

#[derive(Debug, Clone)]
pub struct ParsedExport {
    pub format: ExportFormat,
    pub path: Option<PathBuf>,
}

impl ScanArgs {
    pub fn parse_export(&self) -> Result<ParsedExport> {
        let s = &self.export;
        let (fmt_part, path_part) = if let Some(idx) = s.find(':') {
            (&s[..idx], Some(&s[idx + 1..]))
        } else {
            (s.as_str(), None)
        };

        let format = ExportFormat::from_str(fmt_part).ok_or_else(|| {
            Note2TaskError::UnsupportedExportFormat(fmt_part.to_string())
        })?;

        let path = path_part.map(|p| PathBuf::from(p));

        Ok(ParsedExport { format, path })
    }

    pub fn resolve_today(&self) -> Result<NaiveDate> {
        match &self.today_override {
            Some(s) => NaiveDate::parse_from_str(s, "%Y-%m-%d").map_err(|_| {
                Note2TaskError::InvalidDateFormat {
                    input: s.clone(),
                }
            }),
            None => Ok(chrono::Local::now().date_naive()),
        }
    }

    pub fn parse_due_filter(&self, today: NaiveDate) -> Result<Option<DueDateFilter>> {
        let spec = match &self.due {
            Some(s) => s,
            None => return Ok(None),
        };

        let lower = spec.to_lowercase();
        let filter = DueDateFilter {
            before: None,
            after: None,
            exactly: None,
        };

        if lower == "today" {
            return Ok(Some(DueDateFilter {
                exactly: Some(today),
                ..filter
            }));
        }
        if lower == "tomorrow" {
            return Ok(Some(DueDateFilter {
                exactly: Some(today + Duration::days(1)),
                ..filter
            }));
        }
        if lower == "week" || lower == "thisweek" || lower == "this-week" {
            let weekday = today.weekday().num_days_from_monday();
            let week_start = today - Duration::days(weekday as i64);
            let week_end = week_start + Duration::days(6);
            return Ok(Some(DueDateFilter {
                after: Some(week_start),
                before: Some(week_end),
                ..filter
            }));
        }
        if lower == "overdue" {
            return Ok(Some(DueDateFilter {
                before: Some(today - Duration::days(1)),
                ..filter
            }));
        }

        if let Some(rest) = lower.strip_prefix("exact:") {
            let d = parse_date(rest)?;
            return Ok(Some(DueDateFilter {
                exactly: Some(d),
                ..filter
            }));
        }
        if let Some(rest) = lower.strip_prefix("before:") {
            let d = parse_date(rest)?;
            return Ok(Some(DueDateFilter {
                before: Some(d),
                ..filter
            }));
        }
        if let Some(rest) = lower.strip_prefix("after:") {
            let d = parse_date(rest)?;
            return Ok(Some(DueDateFilter {
                after: Some(d),
                ..filter
            }));
        }

        let d = parse_date(&lower)?;
        Ok(Some(DueDateFilter {
            exactly: Some(d),
            ..filter
        }))
    }
}

fn parse_date(s: &str) -> Result<NaiveDate> {
    NaiveDate::parse_from_str(s, "%Y-%m-%d").map_err(|_| Note2TaskError::InvalidDateFormat {
    input: s.to_string(),
})
}
