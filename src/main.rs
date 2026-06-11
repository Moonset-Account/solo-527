mod cli;
mod compressor;
mod exit_code;
mod renamer;
mod report;
mod rollback;
mod scanner;

use anyhow::{Context, Result};
use std::path::{Path, PathBuf};

use cli::Cli;
use compressor::{CompressOptions, CompressResult};
use exit_code::ExitCode;
use report::Report;
use rollback::RollbackManifest;
use scanner::{ImageEntry, ImageFormat};

fn main() -> Result<()> {
    let cli: Cli = clap::Parser::parse();

    init_logger(&cli.log_level);

    if let Some(ref undo_path) = cli.undo {
        return run_undo(undo_path, &cli.format);
    }

    run_process(&cli)
}

fn init_logger(level: &str) {
    let filter = match level {
        "trace" => log::LevelFilter::Trace,
        "debug" => log::LevelFilter::Debug,
        "info" => log::LevelFilter::Info,
        "warn" => log::LevelFilter::Warn,
        "error" => log::LevelFilter::Error,
        _ => log::LevelFilter::Warn,
    };
    env_logger::Builder::new()
        .filter_level(filter)
        .format_timestamp_secs()
        .init();
}

fn run_undo(undo_path: &str, format: &str) -> Result<()> {
    let path = Path::new(undo_path);
    let reverted = rollback::execute_rollback(path)
        .with_context(|| format!("Rollback failed for manifest {}", undo_path))?;

    if format == "json" {
        let output = serde_json::json!({
            "rollback": {
                "manifest": undo_path,
                "reverted": reverted
            }
        });
        println!("{}", serde_json::to_string_pretty(&output).unwrap());
    } else {
        println!("Rollback complete: {} operations reverted", reverted);
    }

    std::process::exit(ExitCode::Success as i32);
}

fn run_process(cli: &Cli) -> Result<()> {
    let scan_result = scanner::scan_images(&cli.input, cli.recursive, cli.filter.as_deref())
        .with_context(|| format!("Failed to scan input: {}", cli.input))?;

    if scan_result.entries.is_empty() && scan_result.skipped.is_empty() {
        log::warn!("No images found in {}", cli.input);
        let report = Report::new(vec![]);
        output_report(&report, &cli.format);
        std::process::exit(ExitCode::Success as i32);
    }

    let output_format = determine_output_format(cli);
    let out_dir = Path::new(&cli.out);

    let mut report = Report::new(scan_result.skipped);
    let mut manifest = if cli.rollback {
        Some(RollbackManifest::new())
    } else {
        None
    };

    let is_dry_run = cli.dry_run;

    if is_dry_run {
        eprintln!("DRY RUN — no files will be modified\n");
    }

    let total = scan_result.entries.len();
    let progress = indicatif::ProgressBar::new(total as u64);
    progress.set_style(
        indicatif::ProgressStyle::default_bar()
            .template("[{elapsed_precise}] {bar:40.cyan/blue} {pos}/{len} {msg}")
            .unwrap(),
    );

    for (idx, entry) in scan_result.entries.iter().enumerate() {
        progress.set_message(format!("{}", entry.path.display()));

        let output_path = compute_output_path(entry, idx, &cli.rename, out_dir, &output_format);

        if is_dry_run {
            report.add_success(
                entry,
                &CompressResult {
                    output_path: output_path.clone(),
                    original_size: entry.size_bytes,
                    compressed_size: 0,
                    original_dimensions: (0, 0),
                    output_dimensions: (0, 0),
                },
                &output_format.to_string(),
            );
            progress.inc(1);
            continue;
        }

        let opts = CompressOptions {
            quality: cli.quality,
            max_width: cli.width,
            output_format,
        };

        match compressor::compress_image(&entry.path, &output_path, &opts) {
            Ok(result) => {
                if let Some(ref mut m) = manifest {
                    let same_file = entry.path == output_path;
                    m.add(&entry.path, entry.size_bytes, &output_path, !same_file);
                }
                report.add_success(entry, &result, &output_format.to_string());
            }
            Err(e) => {
                let msg = e.to_string();
                log::error!("Failed to compress {}: {}", entry.path.display(), msg);
                report.add_failure(entry, msg, &output_format.to_string());
            }
        }

        progress.inc(1);
    }

    progress.finish_with_message("done");

    if let Some(ref m) = manifest {
        let manifest_path = out_dir.join("imgproc_rollback.json");
        m.save(&manifest_path)?;
        if cli.format == "json" {
            eprintln!("Rollback manifest: {}", manifest_path.display());
        } else {
            eprintln!("\nRollback manifest saved to {}", manifest_path.display());
        }
    }

    output_report(&report, &cli.format);

    let exit_code = ExitCode::from_results(report.total_success, report.total_failed);
    std::process::exit(exit_code as i32);
}

fn determine_output_format(cli: &Cli) -> ImageFormat {
    if cli.webp {
        ImageFormat::WebP
    } else if cli.png {
        ImageFormat::Png
    } else if cli.jpeg {
        ImageFormat::Jpeg
    } else {
        ImageFormat::Jpeg
    }
}

fn compute_output_path(
    entry: &ImageEntry,
    index: usize,
    rename_pattern: &Option<String>,
    out_dir: &Path,
    output_format: &ImageFormat,
) -> PathBuf {
    if let Some(ref pattern) = rename_pattern {
        match renamer::apply_rename_pattern(&entry.path, pattern, index + 1, output_format) {
            Ok(name) => out_dir.join(name),
            Err(_) => {
                let ext = output_format.extension();
                let stem = entry.path.file_stem().unwrap_or_default().to_string_lossy();
                out_dir.join(format!("{}.{}", stem, ext))
            }
        }
    } else {
        let ext = output_format.extension();
        let stem = entry.path.file_stem().unwrap_or_default().to_string_lossy();
        out_dir.join(format!("{}.{}", stem, ext))
    }
}

fn output_report(report: &Report, format: &str) {
    match format {
        "json" => println!("{}", report.to_json()),
        _ => println!("{}", report.to_text()),
    }
}
