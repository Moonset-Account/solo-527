use env_logger::Builder;
use std::io::Write;

pub fn init_logger(verbose: u8, quiet: bool) {
    let level = if quiet {
        log::LevelFilter::Error
    } else {
        match verbose {
            0 => log::LevelFilter::Warn,
            1 => log::LevelFilter::Info,
            2 => log::LevelFilter::Debug,
            _ => log::LevelFilter::Trace,
        }
    };

    Builder::new()
        .format(|buf, record| {
            let ts = chrono::Local::now().format("%H:%M:%S%.3f");
            let level = match record.level() {
                log::Level::Error => "ERROR",
                log::Level::Warn => "WARN ",
                log::Level::Info => "INFO ",
                log::Level::Debug => "DEBUG",
                log::Level::Trace => "TRACE",
            };
            writeln!(
                buf,
                "{} [{}] {}",
                ts,
                level,
                record.args()
            )
        })
        .filter(None, level)
        .target(env_logger::Target::Stderr)
        .try_init()
        .ok();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_init_does_not_panic() {
        init_logger(0, false);
        init_logger(1, false);
        init_logger(3, false);
        init_logger(0, true);
    }
}
