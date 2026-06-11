use clap::Parser;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(
    name = "nightly-failure-summary",
    version,
    about = "Aggregate nightly test failure results from JUnit XML, screenshots, and history"
)]
pub struct Cli {
    #[arg(long, short = 'J', help = "Directory containing JUnit XML reports")]
    pub junit_dir: PathBuf,

    #[arg(long, short = 'S', help = "Directory containing browser screenshots")]
    pub screenshot_dir: PathBuf,

    #[arg(long, help = "Path to historical failure records (JSON)")]
    pub history_file: Option<PathBuf>,

    #[arg(long, help = "Base directory for test source files")]
    pub test_file_base: Option<PathBuf>,

    #[arg(long, short, help = "Output as JSON (CI-friendly)")]
    pub json: bool,

    #[arg(long, short, help = "Dry-run: show what would be processed without generating report")]
    pub dry_run: bool,

    #[arg(long, short, help = "Verbose output with full details")]
    pub verbose: bool,

    #[arg(long, help = "Update history file after generating report")]
    pub update_history: bool,
}
