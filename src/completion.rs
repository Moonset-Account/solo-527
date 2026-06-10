use crate::cli::{Cli, Shell};
use crate::errors::{Note2TaskError, Result};
use clap::CommandFactory;
use std::io::Write;

pub fn generate(shell: Shell) -> Result<()> {
    let mut cmd = Cli::command();
    let name = cmd.get_name().to_string();
    let clap_shell = shell.to_clap_shell();

    let mut buf = Vec::new();
    clap_complete::generate(clap_shell, &mut cmd, &name, &mut buf);

    let content = String::from_utf8(buf)
        .map_err(|e| Note2TaskError::CompletionError(format!("UTF-8 转换失败: {}", e)))?;

    let mut stdout = std::io::stdout();
    stdout
        .write_all(content.as_bytes())
        .map_err(|e| Note2TaskError::CompletionError(format!("写入 stdout 失败: {}", e)))?;
    stdout
        .flush()
        .map_err(|e| Note2TaskError::CompletionError(format!("刷新 stdout 失败: {}", e)))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_completions_for_all_shells() {
        let shells = [
            Shell::Bash,
            Shell::Zsh,
            Shell::Fish,
            Shell::Powershell,
            Shell::Elvish,
        ];
        for sh in shells {
            // Just ensure it doesn't panic
            let _ = sh.to_clap_shell();
        }
    }
}
