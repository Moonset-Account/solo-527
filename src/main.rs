use oas_checker::*;
use clap::Parser;
use std::process::ExitCode;

fn main() -> ExitCode {
    let cli = cli::Cli::parse();

    if cli.verbose {
        let subscriber = tracing_subscriber::fmt()
            .with_env_filter(
                tracing_subscriber::EnvFilter::try_from_default_env()
                    .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("debug")),
            )
            .finish();
        let _ = tracing::subscriber::set_global_default(subscriber);
    }

    let result = run_check(&cli);

    match result {
        Ok(diff) => {
            let format = cli.format.into();
            let report = report::ReportGenerator::generate(&diff, format);

            match &cli.output_file {
                Some(path) => {
                    if let Err(e) = std::fs::write(path, &report) {
                        eprintln!("Error writing to {:?}: {}", path, e);
                        return ExitCode::from(2);
                    }
                    eprintln!("Report written to {:?}", path);
                }
                None => {
                    println!("{}", report);
                }
            }

            if cli.list_endpoints && !diff.affected_endpoints.is_empty() {
                eprintln!("\nAffected endpoints:");
                for ep in &diff.affected_endpoints {
                    eprintln!("  - {}", ep);
                }
            }

            eprintln!("\nSummary: {} breaking, {} warnings, {} info, {} ignored",
                diff.breaking_count, diff.warning_count, diff.info_count, diff.ignored_count);

            if cli.fail_on_breaking && diff.has_breaking_changes() {
                eprintln!("\n❌ Breaking changes detected — CI check FAILED.");
                ExitCode::from(1)
            } else if diff.has_breaking_changes() {
                eprintln!("\n⚠️  Breaking changes detected (use --fail-on-breaking for CI).");
                ExitCode::SUCCESS
            } else {
                eprintln!("\n✅ No breaking changes detected.");
                ExitCode::SUCCESS
            }
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            ExitCode::from(2)
        }
    }
}

fn run_check(cli: &cli::Cli) -> anyhow::Result<diff::DiffResult> {
    let old = parser::OpenAPIParser::parse_file(&cli.old_spec)?;
    let new = parser::OpenAPIParser::parse_file(&cli.new_spec)?;

    let config = cli.load_config();
    let detector = diff::ChangeDetector::new(config);

    Ok(detector.detect(&old, &new))
}
