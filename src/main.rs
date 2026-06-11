use clap::{CommandFactory, Parser, Subcommand, ValueEnum};
use git_brclean::*;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(
    name = "git-brclean",
    version,
    about = "Git 分支清理助手 - 团队级分支管理工具",
    long_about = "扫描、风险分级、交互确认和清理 Git 分支。支持本地和远端分支，集成 PR 状态检测和保护规则。"
)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,

    #[arg(short, long, global = true)]
    repo: Option<PathBuf>,

    #[arg(short, long, global = true, action = clap::ArgAction::Count)]
    verbose: u8,

    #[arg(long, global = true, value_enum, default_value_t = OutputFormatCli::Human)]
    format: OutputFormatCli,

    #[arg(short, long, global = true)]
    output: Option<PathBuf>,

    #[arg(long, global = true)]
    config: Option<PathBuf>,
}

#[derive(Subcommand, Debug)]
enum Commands {
    Scan {
        #[arg(long)]
        merged: bool,

        #[arg(long)]
        older_than: Option<i64>,

        #[arg(short, long, num_args = 0..)]
        exclude: Vec<String>,

        #[arg(long)]
        include_remote: bool,

        #[arg(long, default_value = "origin")]
        remote: String,

        #[arg(long, default_value = "main")]
        default_branch: String,

        #[arg(long)]
        min_risk: Option<RiskLevelCli>,

        #[arg(long, num_args = 0..)]
        protect: Vec<String>,
    },
    Clean {
        #[arg(long)]
        dry_run: bool,

        #[arg(long)]
        merged: bool,

        #[arg(long)]
        older_than: Option<i64>,

        #[arg(short, long, num_args = 0..)]
        exclude: Vec<String>,

        #[arg(long)]
        include_remote: bool,

        #[arg(long, default_value = "origin")]
        remote: String,

        #[arg(long, default_value = "main")]
        default_branch: String,

        #[arg(long)]
        min_risk: Option<RiskLevelCli>,

        #[arg(long, num_args = 0..)]
        protect: Vec<String>,

        #[arg(long, default_value_t = true)]
        interactive: bool,

        #[arg(long)]
        no_interactive: bool,

        #[arg(long)]
        no_rollback: bool,

        #[arg(long)]
        pr_source: Option<PrSourceCli>,

        #[arg(long)]
        pr_api_url: Option<String>,

        #[arg(long)]
        pr_token: Option<String>,
    },
    Rollback {
        #[arg(default_value = "latest")]
        id: String,

        #[arg(long)]
        list: bool,
    },
    Completions {
        #[arg(value_enum)]
        shell: clap_complete::Shell,
    },
}

#[derive(ValueEnum, Debug, Clone, Copy)]
enum OutputFormatCli {
    Human,
    Json,
    JsonPretty,
    Csv,
    Markdown,
}

impl From<OutputFormatCli> for config::OutputFormat {
    fn from(f: OutputFormatCli) -> Self {
        match f {
            OutputFormatCli::Human => config::OutputFormat::Human,
            OutputFormatCli::Json => config::OutputFormat::Json,
            OutputFormatCli::JsonPretty => config::OutputFormat::JsonPretty,
            OutputFormatCli::Csv => config::OutputFormat::Csv,
            OutputFormatCli::Markdown => config::OutputFormat::Markdown,
        }
    }
}

#[derive(ValueEnum, Debug, Clone, Copy)]
enum RiskLevelCli {
    Safe,
    Low,
    Medium,
    High,
    Critical,
}

impl From<RiskLevelCli> for models::RiskLevel {
    fn from(r: RiskLevelCli) -> Self {
        match r {
            RiskLevelCli::Safe => models::RiskLevel::Safe,
            RiskLevelCli::Low => models::RiskLevel::Low,
            RiskLevelCli::Medium => models::RiskLevel::Medium,
            RiskLevelCli::High => models::RiskLevel::High,
            RiskLevelCli::Critical => models::RiskLevel::Critical,
        }
    }
}

#[derive(ValueEnum, Debug, Clone, Copy)]
enum PrSourceCli {
    GitHub,
    GitLab,
    Gitea,
    Bitbucket,
}

impl From<PrSourceCli> for config::PrSource {
    fn from(p: PrSourceCli) -> Self {
        match p {
            PrSourceCli::GitHub => config::PrSource::GitHub,
            PrSourceCli::GitLab => config::PrSource::GitLab,
            PrSourceCli::Gitea => config::PrSource::Gitea,
            PrSourceCli::Bitbucket => config::PrSource::Bitbucket,
        }
    }
}

fn main() {
    let cli = Cli::parse();

    let log_file = if cli.verbose > 0 {
        Some(logger::default_log_file())
    } else {
        None
    };

    if let Err(e) = logger::init_logger(cli.verbose, log_file.as_deref()) {
        eprintln!("警告: 初始化日志失败: {}", e);
    }

    let result = run(cli);

    match result {
        Ok(exit_code) => {
            std::process::exit(exit_code);
        }
        Err(e) => {
            eprintln!("错误: {:#}", e);
            std::process::exit(1);
        }
    }
}

fn run(mut cli: Cli) -> anyhow::Result<i32> {
    let command = cli.command.take().unwrap_or(Commands::Scan {
        merged: false,
        older_than: None,
        exclude: vec![],
        include_remote: false,
        remote: "origin".to_string(),
        default_branch: "main".to_string(),
        min_risk: None,
        protect: vec![],
    });

    match command {
        Commands::Scan { .. } | Commands::Clean { .. } => {
            run_clean_command(cli, command)
        }
        Commands::Rollback { id, list } => {
            run_rollback_command(cli, &id, list)
        }
        Commands::Completions { shell } => {
            print_completions(shell);
            Ok(0)
        }
    }
}

fn run_clean_command(cli: Cli, command: Commands) -> anyhow::Result<i32> {
    let (is_clean, opts) = match &command {
        Commands::Scan {
            merged,
            older_than,
            exclude,
            include_remote,
            remote,
            default_branch,
            min_risk,
            protect,
        } => (false, CleanOpts {
            dry_run: true,
            merged: *merged,
            older_than: *older_than,
            exclude: exclude.clone(),
            include_remote: *include_remote,
            remote: remote.clone(),
            default_branch: default_branch.clone(),
            min_risk: *min_risk,
            protect: protect.clone(),
            interactive: false,
            no_interactive: true,
            no_rollback: true,
            pr_source: None,
            pr_api_url: None,
            pr_token: None,
        }),
        Commands::Clean {
            dry_run,
            merged,
            older_than,
            exclude,
            include_remote,
            remote,
            default_branch,
            min_risk,
            protect,
            interactive,
            no_interactive,
            no_rollback,
            pr_source,
            pr_api_url,
            pr_token,
        } => (true, CleanOpts {
            dry_run: *dry_run,
            merged: *merged,
            older_than: *older_than,
            exclude: exclude.clone(),
            include_remote: *include_remote,
            remote: remote.clone(),
            default_branch: default_branch.clone(),
            min_risk: *min_risk,
            protect: protect.clone(),
            interactive: *interactive,
            no_interactive: *no_interactive,
            no_rollback: *no_rollback,
            pr_source: *pr_source,
            pr_api_url: pr_api_url.clone(),
            pr_token: pr_token.clone(),
        }),
        _ => unreachable!(),
    };

    let mut config = if let Some(config_path) = &cli.config {
        config::CleanupConfig::from_file(config_path)?
    } else {
        config::CleanupConfig::default()
    };

    let cli_overrides = build_cli_overrides(&cli, &opts, is_clean);
    config.merge_cli_overrides(cli_overrides);

    if !is_clean {
        config.dry_run = true;
        config.interactive = false;
    }

    let mut executor = executor::CleanupExecutor::new(config.clone())?;

    if let Some(pr_source) = &config.pr_source {
        match pr::create_pr_provider(
            *pr_source,
            config.pr_api_url.as_deref(),
            config.pr_token.as_deref(),
            &config.repo_path,
        ) {
            Ok(provider) => {
                executor = executor.with_pr_provider(provider);
            }
            Err(e) => {
                eprintln!("警告: 创建 PR provider 失败: {}", e);
            }
        }
    }

    let report = executor.execute()?;

    let reporter = reporter::ReportGenerator::new(cli.format.into());
    let output = reporter.generate(&report)?;

    if let Some(output_path) = &cli.output {
        if let Some(parent) = output_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(output_path, &output)?;
        eprintln!("报告已写入: {}", output_path.display());
    } else {
        println!("{}", output);
    }

    Ok(reporter::exit_code_for_report(&report))
}

struct CleanOpts {
    dry_run: bool,
    merged: bool,
    older_than: Option<i64>,
    exclude: Vec<String>,
    include_remote: bool,
    remote: String,
    default_branch: String,
    min_risk: Option<RiskLevelCli>,
    protect: Vec<String>,
    interactive: bool,
    no_interactive: bool,
    no_rollback: bool,
    pr_source: Option<PrSourceCli>,
    pr_api_url: Option<String>,
    pr_token: Option<String>,
}

fn build_cli_overrides(cli: &Cli, opts: &CleanOpts, is_clean: bool) -> config::CliOverrides {
    let mut overrides = config::CliOverrides::default();

    if cli.repo.is_some() {
        overrides.repo_path = cli.repo.clone();
    }

    if is_clean {
        overrides.dry_run = Some(opts.dry_run);
    }

    if opts.merged {
        overrides.merged_only = Some(true);
    }

    if opts.older_than.is_some() {
        overrides.older_than_days = opts.older_than;
    }

    if !opts.exclude.is_empty() {
        overrides.exclude_patterns = opts.exclude.clone();
    }

    if opts.include_remote {
        overrides.include_remote = Some(true);
    }

    if opts.remote != "origin" {
        overrides.remote_name = Some(opts.remote.clone());
    }

    if opts.default_branch != "main" {
        overrides.default_branch = Some(opts.default_branch.clone());
    }

    if opts.min_risk.is_some() {
        overrides.min_risk_level = opts.min_risk.map(|r| r.into());
    }

    if !opts.protect.is_empty() {
        overrides.protect_patterns = opts.protect.clone();
    }

    if is_clean {
        overrides.interactive = Some(opts.interactive && !opts.no_interactive);
        overrides.rollback_enabled = Some(!opts.no_rollback);
    }

    overrides.format = Some(cli.format.into());

    if cli.output.is_some() {
        overrides.output_file = cli.output.clone();
    }

    if opts.pr_source.is_some() {
        overrides.pr_source = opts.pr_source.map(|s| s.into());
    }

    if opts.pr_api_url.is_some() {
        overrides.pr_api_url = opts.pr_api_url.clone();
    }

    if opts.pr_token.is_some() {
        overrides.pr_token = opts.pr_token.clone();
    }

    overrides
}

fn run_rollback_command(cli: Cli, id: &str, list: bool) -> anyhow::Result<i32> {
    let repo_path = cli.repo.clone().unwrap_or_else(|| PathBuf::from("."));

    let config = config::CleanupConfig {
        repo_path,
        dry_run: false,
        interactive: false,
        rollback_enabled: true,
        ..Default::default()
    };

    let rollback_dir = config.log_dir.clone().unwrap_or_else(|| platform::rollback_dir());
    let rollback_log = rollback::RollbackLog::new(&rollback_dir)?;

    if list {
        let entries = rollback_log.list_rollbacks()?;
        if entries.is_empty() {
            println!("没有找到回滚记录。");
        } else {
            println!("回滚记录列表:");
            for entry in entries {
                println!(
                    "  {} - {} (删除了 {} 个分支)",
                    entry.id,
                    entry.timestamp.with_timezone(&chrono::Local::now().timezone()).format("%Y-%m-%d %H:%M:%S"),
                    entry.deleted_count
                );
            }
        }
        return Ok(0);
    }

    let mut executor = executor::CleanupExecutor::new(config)?;
    let restored = executor.rollback(id)?;

    println!("已回滚 {} 个分支:", restored.len());
    for branch in &restored {
        println!("  - {}", branch);
    }

    Ok(0)
}

fn print_completions(shell: clap_complete::Shell) {
    let mut cmd = Cli::command();
    let name = "git-brclean";
    clap_complete::generate(shell, &mut cmd, name, &mut std::io::stdout());
}

#[cfg(test)]
mod tests {
    use super::*;
    use clap::CommandFactory;

    #[test]
    fn verify_cli() {
        Cli::command().debug_assert();
    }
}
