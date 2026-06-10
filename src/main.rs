use clap::Parser;
use note2task::cli::{Cli, Commands};
use note2task::completion;
use note2task::errors::exit_code;
use note2task::logger::init_logger;
use note2task::{run_scan, EXIT_SUCCESS};

fn main() {
    let cli = Cli::parse();

    init_logger(cli.verbose, cli.quiet);

    let result = match cli.command {
        Some(Commands::Scan(ref scan_args)) => run_scan(scan_args).map(|_| ()),
        Some(Commands::Completions { shell }) => completion::generate(shell),
        None => {
            eprintln!("请指定子命令。使用 --help 查看帮助。");
            eprintln!("常用子命令:");
            eprintln!("  note2task scan --from .     扫描当前目录");
            eprintln!("  note2task completions zsh   生成 zsh 补全");
            std::process::exit(2);
        }
    };

    match result {
        Ok(()) => {
            log::info!("执行完成 ✓");
            std::process::exit(EXIT_SUCCESS);
        }
        Err(e) => {
            log::error!("{}", e);
            eprintln!("\n错误: {}", e);
            eprintln!("\n提示: 使用 --help 查看用法说明");
            std::process::exit(exit_code(&e));
        }
    }
}
