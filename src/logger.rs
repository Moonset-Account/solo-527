use crate::platform;
use anyhow::Result;
use std::path::{Path, PathBuf};
use tracing::Level;
use tracing_subscriber::{fmt, EnvFilter};

pub fn init_logger(verbose: u8, _log_file: Option<&Path>) -> Result<()> {
    let filter = match verbose {
        0 => "warn",
        1 => "info",
        2 => "debug",
        _ => "trace",
    };

    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(filter));

    fmt()
        .with_env_filter(env_filter)
        .with_target(false)
        .with_level(true)
        .init();

    Ok(())
}

pub fn default_log_file() -> PathBuf {
    let log_dir = platform::log_dir();
    let now = chrono::Local::now();
    log_dir.join(format!("git-brclean-{}.log", now.format("%Y%m%d")))
}

#[allow(dead_code)]
pub fn log_level_from_verbose(verbose: u8) -> Level {
    match verbose {
        0 => Level::WARN,
        1 => Level::INFO,
        2 => Level::DEBUG,
        _ => Level::TRACE,
    }
}
