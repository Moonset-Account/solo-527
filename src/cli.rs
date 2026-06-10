use crate::config::RulesConfig;
use crate::report::ReportFormat;
use clap::{Parser, ValueEnum};
use std::path::PathBuf;

#[derive(Debug, Clone, Parser)]
#[command(
    name = "oas-checker",
    author,
    version,
    about = "OpenAPI Spec Contract Change Checker",
    long_about = "Detects breaking changes between two OpenAPI 3.0 specification files.
Compares an old (baseline) spec against a new spec, producing human-readable
or machine-parseable reports of all detected changes, including field removals,
type narrowing, required/optional changes, enum alterations, and response code changes."
)]
pub struct Cli {
    #[arg(
        short = 'o',
        long = "old",
        alias = "baseline",
        required = true,
        value_name = "FILE",
        help = "Path to the old (baseline) OpenAPI spec file [YAML/JSON]"
    )]
    pub old_spec: PathBuf,

    #[arg(
        short = 'n',
        long = "new",
        required = true,
        value_name = "FILE",
        help = "Path to the new OpenAPI spec file [YAML/JSON]"
    )]
    pub new_spec: PathBuf,

    #[arg(
        long = "fail-on-breaking",
        default_value_t = false,
        help = "Return non-zero exit code if any breaking changes are detected (CI mode)"
    )]
    pub fail_on_breaking: bool,

    #[arg(
        long = "format",
        short = 'f',
        value_enum,
        default_value_t = FormatArg::Text,
        help = "Output report format"
    )]
    pub format: FormatArg,

    #[arg(
        long = "config",
        short = 'c',
        value_name = "FILE",
        help = "Path to rules config file (ignore rules & severity overrides)"
    )]
    pub config_file: Option<PathBuf>,

    #[arg(
        long = "output",
        short = 'O',
        value_name = "FILE",
        help = "Write report to file instead of stdout"
    )]
    pub output_file: Option<PathBuf>,

    #[arg(
        long = "verbose",
        short = 'v',
        default_value_t = false,
        help = "Enable verbose diagnostic logging"
    )]
    pub verbose: bool,

    #[arg(
        long = "list-endpoints",
        default_value_t = false,
        help = "List all affected endpoints in the output summary"
    )]
    pub list_endpoints: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum FormatArg {
    /// Human-readable text report (console-friendly)
    Text,
    /// Markdown report (for PR descriptions / docs)
    Markdown,
    /// Compact JSON (one line, for machines)
    Json,
    /// Pretty-printed JSON
    PrettyJson,
}

impl From<FormatArg> for ReportFormat {
    fn from(f: FormatArg) -> Self {
        match f {
            FormatArg::Text => ReportFormat::Text,
            FormatArg::Markdown => ReportFormat::Markdown,
            FormatArg::Json => ReportFormat::Json,
            FormatArg::PrettyJson => ReportFormat::PrettyJson,
        }
    }
}

impl Cli {
    pub fn load_config(&self) -> RulesConfig {
        if let Some(path) = &self.config_file {
            RulesConfig::from_file(path).unwrap_or_else(|e| {
                eprintln!("Warning: Failed to load config {:?}: {}", path, e);
                RulesConfig::default()
            })
        } else {
            RulesConfig::default()
        }
    }
}
