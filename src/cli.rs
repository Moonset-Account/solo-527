use clap::{Parser, Subcommand, ValueEnum};
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(name = "license-audit")]
#[command(author, version, about, long_about = None)]
#[command(about = "依赖许可证审计工具 - 扫描项目依赖的许可证并评估风险")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand, Debug)]
pub enum Commands {
    #[command(about = "扫描项目依赖并生成许可证审计报告")]
    Scan(ScanArgs),

    #[command(about = "列出所有支持的许可证及其风险等级")]
    Licenses,

    #[command(about = "生成示例配置文件")]
    InitConfig(InitConfigArgs),
}

#[derive(clap::Args, Debug)]
pub struct ScanArgs {
    #[arg(
        short,
        long,
        value_name = "PATH",
        default_value = ".",
        help = "要扫描的路径，可以是目录或具体的清单文件"
    )]
    pub path: Vec<PathBuf>,

    #[arg(
        short = 'f',
        long,
        value_enum,
        default_value_t = OutputFormatCli::Table,
        help = "输出格式"
    )]
    pub format: OutputFormatCli,

    #[arg(
        short = 'o',
        long,
        value_name = "FILE",
        help = "输出文件路径，不指定则输出到标准输出"
    )]
    pub output: Option<PathBuf>,

    #[arg(
        short = 'w',
        long,
        help = "扫描 monorepo 工作区（npm workspaces / Cargo workspace）"
    )]
    pub workspace: bool,

    #[arg(
        long = "allow",
        value_name = "LICENSE",
        help = "允许的许可证（白名单），可多次指定"
    )]
    pub allow: Vec<String>,

    #[arg(
        long = "deny",
        value_name = "LICENSE",
        help = "禁止的许可证（黑名单），可多次指定"
    )]
    pub deny: Vec<String>,

    #[arg(
        short = 'c',
        long,
        value_name = "FILE",
        help = "配置文件路径（TOML 或 JSON 格式）"
    )]
    pub config: Option<PathBuf>,

    #[arg(long, help = "包含开发依赖")]
    pub include_dev: bool,

    #[arg(long, help = "遇到高风险依赖时返回非零退出码")]
    pub fail_on_high: bool,

    #[arg(long, default_value_t = true, help = "遇到严重风险依赖时返回非零退出码")]
    pub fail_on_critical: bool,

    #[arg(long, help = "遇到未知许可证依赖时返回非零退出码")]
    pub fail_on_unknown: bool,

    #[arg(
        long,
        short = 'r',
        default_value_t = true,
        help = "递归扫描子目录"
    )]
    pub recursive: bool,
}

#[derive(clap::Args, Debug)]
pub struct InitConfigArgs {
    #[arg(
        short,
        long,
        value_name = "FILE",
        default_value = "license-audit.toml",
        help = "输出配置文件路径"
    )]
    pub output: PathBuf,

    #[arg(
        short = 'f',
        long,
        value_enum,
        default_value_t = ConfigFormat::Toml,
        help = "配置文件格式"
    )]
    pub format: ConfigFormat,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, ValueEnum)]
pub enum OutputFormatCli {
    #[value(name = "json")]
    Json,
    #[value(name = "html")]
    Html,
    #[value(name = "table")]
    Table,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, ValueEnum)]
pub enum ConfigFormat {
    #[value(name = "toml")]
    Toml,
    #[value(name = "json")]
    Json,
}

impl From<OutputFormatCli> for crate::config::OutputFormat {
    fn from(f: OutputFormatCli) -> Self {
        match f {
            OutputFormatCli::Json => crate::config::OutputFormat::Json,
            OutputFormatCli::Html => crate::config::OutputFormat::Html,
            OutputFormatCli::Table => crate::config::OutputFormat::Table,
        }
    }
}
