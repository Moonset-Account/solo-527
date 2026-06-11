use clap::Parser;

#[derive(Parser, Debug, Clone)]
#[command(
    name = "imgproc",
    version,
    about = "Batch image compression and renaming tool for CI pipelines",
    long_about = "imgproc — batch image compression & renaming CLI\n\n\
        Supports PNG, JPEG, WebP formats with quality control, resize,\n\
        format conversion, and rollback capability.\n\n\
        Exit codes:\n  0 — success\n  1 — partial failure (some files failed)\n  2 — fatal error\n\n\
        Examples:\n  \
        imgproc ./images --quality 80 --width 1920\n  \
        imgproc ./assets --webp --out ./dist --format json\n  \
        imgproc ./photos --dry-run --quality 75"
)]
pub struct Cli {
    #[arg(
        index = 1,
        help = "Input directory or file path (use '-' for stdin JSON list)"
    )]
    pub input: String,

    #[arg(short, long, default_value = ".", help = "Output directory")]
    pub out: String,

    #[arg(short, long, default_value_t = 80, value_parser = clap::value_parser!(u8).range(1..=100), help = "Compression quality (1-100)")]
    pub quality: u8,

    #[arg(short = 'W', long, help = "Maximum width in pixels; larger images are resized")]
    pub width: Option<u32>,

    #[arg(short, long, help = "Convert output to WebP format")]
    pub webp: bool,

    #[arg(long, help = "Convert output to PNG format")]
    pub png: bool,

    #[arg(long, help = "Convert output to JPEG format")]
    pub jpeg: bool,

    #[arg(long, help = "Dry-run: show what would happen without modifying files")]
    pub dry_run: bool,

    #[arg(short, long, default_value = "text", value_parser = ["text", "json"], help = "Output format: text or json")]
    pub format: String,

    #[arg(short, long, help = "Rename pattern (e.g. 'img_{index:04}.{ext}')")]
    pub rename: Option<String>,

    #[arg(long, help = "Generate rollback manifest file")]
    pub rollback: bool,

    #[arg(long, help = "Rollback using a previously generated manifest")]
    pub undo: Option<String>,

    #[arg(short, long, default_value = "warn", value_parser = ["trace", "debug", "info", "warn", "error"], help = "Log level")]
    pub log_level: String,

    #[arg(long, help = "Recurse into subdirectories")]
    pub recursive: bool,

    #[arg(long, help = "Number of parallel threads (default: num_cpus)")]
    pub threads: Option<usize>,

    #[arg(long, help = "Only process files matching these extensions (comma-separated, e.g. png,jpg)")]
    pub filter: Option<String>,
}
