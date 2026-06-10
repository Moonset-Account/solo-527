use crate::errors::{Note2TaskError, Result};
use crate::models::is_markdown_file;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

pub struct ScanResult {
    pub files: Vec<PathBuf>,
    pub total_walked: usize,
}

pub fn collect_markdown_files(paths: &[PathBuf]) -> Result<ScanResult> {
    let mut files: Vec<PathBuf> = Vec::new();
    let mut total_walked = 0usize;

    for path in paths {
        let abs_path = to_absolute(path)?;

        if !abs_path.exists() {
            return Err(Note2TaskError::InvalidPath {
                path: path.display().to_string(),
            });
        }

        if abs_path.is_file() {
            if is_markdown_file(&abs_path) {
                files.push(normalize_path(&abs_path));
                total_walked += 1;
            } else {
                return Err(Note2TaskError::NoMarkdownFiles(format!(
                    "指定的文件不是 Markdown: {}",
                    abs_path.display()
                )));
            }
            continue;
        }

        if abs_path.is_dir() {
            for entry in WalkDir::new(&abs_path)
                .follow_links(false)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                total_walked += 1;
                let entry_path = entry.path();
                if entry_path.is_file() && is_markdown_file(entry_path) {
                    if should_skip_dir(entry_path) {
                        log::debug!("跳过: {}", entry_path.display());
                        continue;
                    }
                    files.push(normalize_path(entry_path));
                }
            }
        }
    }

    files.sort();
    files.dedup();

    log::info!(
        "扫描路径: {}, 找到 {} 个 Markdown 文件 (遍历 {} 个条目)",
        paths
            .iter()
            .map(|p| p.display().to_string())
            .collect::<Vec<_>>()
            .join(", "),
        files.len(),
        total_walked
    );

    Ok(ScanResult {
        files,
        total_walked,
    })
}

fn to_absolute(path: &Path) -> Result<PathBuf> {
    if path.is_absolute() {
        Ok(path.to_path_buf())
    } else {
        std::env::current_dir()
            .map(|cwd| cwd.join(path))
            .map_err(|e| Note2TaskError::Other(format!("无法获取当前目录: {}", e)))
    }
}

fn normalize_path(path: &Path) -> PathBuf {
    path.canonicalize().unwrap_or_else(|_| path.to_path_buf())
}

fn should_skip_dir(path: &Path) -> bool {
    let skip_names = [
        "node_modules",
        ".git",
        ".svn",
        ".hg",
        "target",
        "dist",
        "build",
        ".venv",
        "venv",
        "__pycache__",
    ];

    for component in path.components() {
        if let Some(name) = component.as_os_str().to_str() {
            if skip_names.contains(&name) {
                return true;
            }
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_test_files() -> tempfile::TempDir {
        let dir = TempDir::new().unwrap();
        std::fs::write(dir.path().join("note1.md"), "note1").unwrap();
        std::fs::write(dir.path().join("note2.markdown"), "note2").unwrap();
        std::fs::write(dir.path().join("readme.txt"), "txt").unwrap();

        let sub = dir.path().join("subdir");
        std::fs::create_dir(&sub).unwrap();
        std::fs::write(sub.join("note3.md"), "note3").unwrap();

        let skip = dir.path().join("node_modules");
        std::fs::create_dir(&skip).unwrap();
        std::fs::write(skip.join("should_skip.md"), "skip").unwrap();

        dir
    }

    #[test]
    fn test_collect_markdown_files() {
        let dir = create_test_files();
        let result = collect_markdown_files(&[dir.path().to_path_buf()]).unwrap();
        assert_eq!(result.files.len(), 3);
        for f in &result.files {
            assert!(is_markdown_file(f));
        }
    }

    #[test]
    fn test_collect_single_file() {
        let dir = create_test_files();
        let path = dir.path().join("note1.md");
        let result = collect_markdown_files(&[path.clone()]).unwrap();
        assert_eq!(result.files.len(), 1);
    }

    #[test]
    fn test_invalid_path() {
        let result = collect_markdown_files(&[PathBuf::from("/nonexistent/path/xyz")]);
        assert!(result.is_err());
    }
}
