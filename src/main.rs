use anyhow::Result;
use clap::{Parser, Subcommand};
use releasenote::*;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(
    name = "releasenote",
    version,
    about = "发布说明拼装 CLI - 从 Git、工单、备注生成结构化的发布报告",
    long_about = "读取 Git tag、合并记录、工单标题和手工备注，把功能、修复、已知问题和升级提醒分组输出。\n支持 Markdown/JSON 两种格式，保留来源链接，缺少工单编号或标题的提交进入待补充区。"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    #[command(
        about = "收集 Git 提交、工单和手工备注为原始数据",
        long_about = "从指定的 Git tag 区间读取提交记录，配合工单文件和手工备注文件，生成原始的 CollectedData JSON。"
    )]
    Collect {
        #[arg(long, help = "起始 Git tag（不含），如 v1.0.0")]
        from: Option<String>,

        #[arg(long, help = "结束 Git tag（含），如 v2.0.0")]
        to: Option<String>,

        #[arg(long, help = "Git 仓库路径，默认为当前目录")]
        repo: Option<PathBuf>,

        #[arg(long, help = "工单 JSON 文件路径")]
        issues: Option<PathBuf>,

        #[arg(long, help = "手工备注文件路径（支持 Markdown 或 JSON）")]
        notes: Option<PathBuf>,

        #[arg(short, long, help = "输出文件路径（JSON 格式），不指定则输出到 stdout")]
        output: Option<PathBuf>,

        #[arg(long, help = "输出格式化的 JSON")]
        pretty: bool,
    },

    #[command(
        about = "渲染已收集的数据为分组的发布说明",
        long_about = "读取 CollectedData JSON，按产品线模板分组渲染，并执行数据校验。\n缺少工单编号、标题或分类的条目会进入待补充区，不会被静默丢弃。"
    )]
    Render {
        #[arg(short, long, help = "产品线名称（default/mobile/enterprise 或自定义模板）", default_value = "default")]
        product_line: String,

        #[arg(short, long, help = "版本号，如 v2.0.0")]
        version: String,

        #[arg(long, help = "已收集的 CollectedData JSON 文件路径")]
        input: PathBuf,

        #[arg(long, help = "自定义产品线模板 JSON 文件路径")]
        template: Option<PathBuf>,

        #[arg(short, long, help = "输出渲染后的 JSON 到指定文件，不指定则仅输出校验摘要")]
        output: Option<PathBuf>,

        #[arg(long, help = "输出格式化的 JSON")]
        pretty: bool,
    },

    #[command(
        about = "导出发布说明为 Markdown 或 JSON 格式",
        long_about = "读取 RenderedReleaseNote JSON，导出为 Markdown 或 JSON 格式的最终报告。\n报告中保留输入文件路径、规则编号和建议修复动作。"
    )]
    Export {
        #[arg(long, help = "已渲染的 RenderedReleaseNote JSON 文件路径")]
        input: PathBuf,

        #[arg(short, long, default_value = "markdown", value_parser = ["markdown", "md", "json"], help = "导出格式: markdown / md / json")]
        format: String,

        #[arg(short, long, help = "输出文件路径，不指定则输出到 stdout")]
        output: Option<PathBuf>,

        #[arg(long, help = "JSON 格式时输出格式化结果")]
        pretty: bool,
    },

    #[command(
        about = "一键流水线：收集 → 渲染 → 导出",
        long_about = "相当于依次执行 collect、render、export 三个命令，直接生成最终报告。"
    )]
    All {
        #[arg(long, help = "起始 Git tag（不含），如 v1.0.0")]
        from: Option<String>,

        #[arg(long, help = "结束 Git tag（含），如 v2.0.0")]
        to: Option<String>,

        #[arg(long, help = "Git 仓库路径，默认为当前目录")]
        repo: Option<PathBuf>,

        #[arg(long, help = "工单 JSON 文件路径")]
        issues: Option<PathBuf>,

        #[arg(long, help = "手工备注文件路径（支持 Markdown 或 JSON）")]
        notes: Option<PathBuf>,

        #[arg(short, long, help = "产品线名称（default/mobile/enterprise）", default_value = "default")]
        product_line: String,

        #[arg(short, long, help = "版本号，如 v2.0.0")]
        version: String,

        #[arg(long, help = "自定义产品线模板 JSON 文件路径")]
        template: Option<PathBuf>,

        #[arg(short, long, default_value = "markdown", value_parser = ["markdown", "md", "json"], help = "导出格式: markdown / md / json")]
        format: String,

        #[arg(short, long, help = "输出文件路径，不指定则输出到 stdout")]
        output: Option<PathBuf>,

        #[arg(long, help = "JSON 格式时输出格式化结果")]
        pretty: bool,
    },

    #[command(about = "列出所有校验规则")]
    Rules,

    #[command(about = "列出所有可用的产品线模板")]
    Templates,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Collect {
            from,
            to,
            repo,
            issues,
            notes,
            output,
            pretty,
        } => {
            let data = collect(&CollectOptions {
                from_tag: from,
                to_tag: to,
                git_repo: repo,
                issue_file: issues,
                notes_file: notes,
            })?;
            println!("✅ 收集完成: {} 条提交, {} 条工单, {} 条备注",
                data.commits.len(), data.issues.len(), data.manual_notes.len());
            if let Some(content) = export_collected(&data, output.as_ref(), pretty)? {
                println!("{}", content);
            } else if let Some(path) = output {
                println!("💾 已写入: {}", path.display());
            }
        }

        Commands::Render {
            product_line,
            version,
            input,
            template,
            output,
            pretty,
        } => {
            let content = std::fs::read_to_string(&input)?;
            let data: CollectedData = serde_json::from_str(&content)
                .map_err(|e| anyhow::anyhow!("解析 CollectedData 失败: {}", e))?;

            let rendered = render(&data, &RenderOptions {
                product_line,
                version,
                template_file: template,
                collected_data_file: Some(input),
            })?;

            println!("{}", format_validation_summary(&rendered.validation));
            println!("📦 分组结果: 功能 {} | 修复 {} | 已知问题 {} | 升级提醒 {} | 待补充 {}",
                rendered.grouped.features.len(),
                rendered.grouped.fixes.len(),
                rendered.grouped.known_issues.len(),
                rendered.grouped.upgrade_notices.len(),
                rendered.grouped.pending_review.len(),
            );

            if output.is_some() {
                let json = if pretty {
                    serde_json::to_string_pretty(&rendered)?
                } else {
                    serde_json::to_string(&rendered)?
                };
                if let Some(path) = output {
                    std::fs::write(&path, json)?;
                    println!("💾 已写入: {}", path.display());
                }
            }
        }

        Commands::Export {
            input,
            format,
            output,
            pretty,
        } => {
            let content = std::fs::read_to_string(&input)?;
            let rendered: RenderedReleaseNote = serde_json::from_str(&content)
                .map_err(|e| anyhow::anyhow!("解析 RenderedReleaseNote 失败: {}", e))?;

            let export_format: ExportFormat = format.parse()?;
            let export_opts = ExportOptions {
                format: export_format,
                output: output.clone(),
                pretty,
            };

            if let Some(content) = export(&rendered, &export_opts)? {
                println!("{}", content);
            } else if let Some(path) = output {
                println!("💾 已导出: {}", path.display());
            }
        }

        Commands::All {
            from,
            to,
            repo,
            issues,
            notes,
            product_line,
            version,
            template,
            format,
            output,
            pretty,
        } => {
            let data = collect(&CollectOptions {
                from_tag: from,
                to_tag: to,
                git_repo: repo,
                issue_file: issues,
                notes_file: notes,
            })?;
            println!("✅ 收集完成: {} 条提交, {} 条工单, {} 条备注",
                data.commits.len(), data.issues.len(), data.manual_notes.len());

            let rendered = render(&data, &RenderOptions {
                product_line,
                version,
                template_file: template,
                collected_data_file: None,
            })?;
            println!("{}", format_validation_summary(&rendered.validation));
            println!("📦 分组结果: 功能 {} | 修复 {} | 已知问题 {} | 升级提醒 {} | 待补充 {}",
                rendered.grouped.features.len(),
                rendered.grouped.fixes.len(),
                rendered.grouped.known_issues.len(),
                rendered.grouped.upgrade_notices.len(),
                rendered.grouped.pending_review.len(),
            );

            let export_format: ExportFormat = format.parse()?;
            let export_opts = ExportOptions {
                format: export_format,
                output: output.clone(),
                pretty,
            };

            if let Some(content) = export(&rendered, &export_opts)? {
                println!("{}", content);
            } else if let Some(path) = output {
                println!("💾 已导出: {}", path.display());
            }
        }

        Commands::Rules => {
            let rules = validation_rules();
            println!("📋 校验规则列表 ({} 条):\n", rules.len());
            for rule in rules {
                println!("  [{}] ({}) {}", rule.rule_id, rule.severity.to_uppercase(), rule.description);
                println!("      建议: {}\n", rule.suggested_action);
            }
        }

        Commands::Templates => {
            let templates = render::default_templates();
            println!("🎨 可用产品线模板 ({} 个):\n", templates.len());
            for (name, tmpl) in templates {
                println!("  \"{}\" -> {}", name, tmpl.product_name);
                println!("      功能: \"{}\" | 修复: \"{}\"", tmpl.feature_title, tmpl.fix_title);
                println!("      已知问题: \"{}\" | 升级: \"{}\"", tmpl.known_issue_title, tmpl.upgrade_notice_title);
                println!("      待补充: \"{}\"\n", tmpl.pending_title);
            }
            println!("💡 也可以通过 --template 传入自定义 JSON 模板文件。");
        }
    }

    Ok(())
}
