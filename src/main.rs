use clap::Parser;
use nightly_failure_summary::aggregate::aggregate_failures;
use nightly_failure_summary::cli::Cli;
use nightly_failure_summary::error::AppError;
use nightly_failure_summary::history::{load_history, update_history};
use nightly_failure_summary::junit::collect_failed_test_cases;
use nightly_failure_summary::report::{format_json_report, format_text_report};
use nightly_failure_summary::screenshot::scan_screenshot_dir;
use nightly_failure_summary::types::{HistoryFile, Report};

fn main() {
    let cli = Cli::parse();

    if let Err(e) = run(cli) {
        eprintln!("Error: {}", e);
        if e.is_severe() {
            std::process::exit(1);
        }
    }
}

fn run(cli: Cli) -> Result<(), AppError> {
    let junit_dir = &cli.junit_dir;
    let screenshot_dir = &cli.screenshot_dir;
    let test_file_base = cli.test_file_base.as_deref().unwrap_or_else(|| std::path::Path::new("."));

    let scan_result = scan_screenshot_dir(screenshot_dir);
    let screenshot_warnings = scan_result.warnings;

    if cli.dry_run {
        println!("Dry-run mode: would process the following inputs:");
        println!("  JUnit XML dir:     {}", junit_dir.display());
        println!("  Screenshot dir:    {}", screenshot_dir.display());
        println!(
            "  History file:      {}",
            cli.history_file
                .as_ref()
                .map(|p| p.display().to_string())
                .unwrap_or_else(|| "(none)".to_string())
        );
        println!("  Test file base:    {}", test_file_base.display());
        println!("  Screenshot files:  {} found", scan_result.entries.len());

        for w in &screenshot_warnings {
            println!("  ⚠  {}", w);
        }

        match collect_failed_test_cases(junit_dir, test_file_base) {
            Ok(cases) => println!("  Failed test cases: {} found", cases.len()),
            Err(e) => println!("  Failed test cases: ERROR - {}", e),
        }

        return Ok(());
    }

    let failed_cases = collect_failed_test_cases(junit_dir, test_file_base)?;

    let history: HistoryFile = match &cli.history_file {
        Some(path) => load_history(path)?,
        None => HistoryFile::default(),
    };

    let aggregated = aggregate_failures(&failed_cases, &scan_result.entries, &history);

    let total_failures: usize = aggregated.iter().map(|a| a.occurrence_count).sum();
    let unique_tests = aggregated.len();

    let all_warnings: Vec<String> = screenshot_warnings
        .into_iter()
        .chain(aggregated.iter().flat_map(|a| a.screenshot_warnings.clone()))
        .collect();

    let report = Report {
        generated_at: chrono::Utc::now(),
        total_failures,
        unique_tests,
        failures: aggregated,
        warnings: all_warnings,
    };

    if cli.json {
        let json_output = format_json_report(&report).map_err(|e| AppError::HistoryParse {
            path: "<stdout>".to_string(),
            message: e.to_string(),
        })?;
        println!("{}", json_output);
    } else {
        let text_output = format_text_report(&report, cli.verbose);
        println!("{}", text_output);
    }

    if cli.update_history {
        if let Some(ref history_path) = cli.history_file {
            let mut updated_history = history;
            for failure in &report.failures {
                let screenshot_hashes = nightly_failure_summary::flaky::compute_screenshot_hashes_for_test(
                    &failure.test_name,
                    &failure.classname,
                    &scan_result.entries,
                );
                update_history(
                    &mut updated_history,
                    &failure.test_name,
                    &failure.classname,
                    true,
                    screenshot_hashes,
                );
            }
            nightly_failure_summary::history::save_history(history_path, &updated_history)?;
            if cli.verbose {
                eprintln!("History updated: {}", history_path.display());
            }
        }
    }

    Ok(())
}
