use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[cfg(unix)]
use std::os::unix::fs::MetadataExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackManifest {
    pub tool: String,
    pub version: String,
    pub timestamp: String,
    pub operations: Vec<RollbackEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RollbackAction {
    DeleteOutput,
    RestoreFromBackup,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackEntry {
    pub original_path: String,
    pub original_size: u64,
    pub output_path: String,
    pub action: RollbackAction,
    pub backup_path: Option<String>,
}

pub fn same_file(a: &Path, b: &Path) -> Result<bool> {
    if !a.exists() || !b.exists() {
        return Ok(false);
    }
    let meta_a = fs::metadata(a)
        .with_context(|| format!("Cannot stat {}", a.display()))?;
    let meta_b = fs::metadata(b)
        .with_context(|| format!("Cannot stat {}", b.display()))?;

    #[cfg(unix)]
    {
        Ok(meta_a.dev() == meta_b.dev() && meta_a.ino() == meta_b.ino())
    }

    #[cfg(not(unix))]
    {
        Ok(a == b)
    }
}

fn generate_backup_path(output_path: &Path) -> PathBuf {
    let ext = output_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("bak");
    output_path.with_extension(format!("{}.imgproc-orig", ext))
}

impl RollbackManifest {
    pub fn new() -> Self {
        RollbackManifest {
            tool: "imgproc".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            operations: Vec::new(),
        }
    }

    pub fn prepare(
        &mut self,
        original_path: &Path,
        original_size: u64,
        output_path: &Path,
    ) -> Result<()> {
        let (is_same_file, same_path_string) = if output_path.exists() {
            let same_inode = same_file(original_path, output_path)?;
            let same_str = original_path == output_path;
            (same_inode, same_str)
        } else {
            (false, false)
        };

        let (action, backup_path) = if is_same_file {
            let backup = generate_backup_path(output_path);
            fs::copy(original_path, &backup)
                .with_context(|| format!("Cannot create backup of {} to {}", output_path.display(), backup.display()))?;
            log::info!("Backed up {} -> {}", output_path.display(), backup.display());

            if !same_path_string {
                fs::remove_file(output_path)
                    .with_context(|| format!("Cannot unlink output {} to break hard/sym link association with original", output_path.display()))?;
                log::info!("Unlinked {} to break association with original (different path, same inode)", output_path.display());
            }

            (RollbackAction::RestoreFromBackup, Some(backup.display().to_string()))
        } else {
            (RollbackAction::DeleteOutput, None)
        };

        self.operations.push(RollbackEntry {
            original_path: original_path.display().to_string(),
            original_size,
            output_path: output_path.display().to_string(),
            action,
            backup_path,
        });
        Ok(())
    }

    pub fn save(&self, path: &Path) -> Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("Cannot create directory for manifest {}", path.display()))?;
        }
        let json = serde_json::to_string_pretty(self)
            .context("Failed to serialize rollback manifest")?;
        fs::write(path, json)
            .with_context(|| format!("Failed to write rollback manifest to {}", path.display()))?;
        log::info!("Rollback manifest written to {}", path.display());
        Ok(())
    }

    pub fn load(path: &Path) -> Result<Self> {
        let data = fs::read_to_string(path)
            .with_context(|| format!("Cannot read rollback manifest {}", path.display()))?;
        serde_json::from_str(&data)
            .with_context(|| format!("Cannot parse rollback manifest {}", path.display()))
    }
}

pub fn execute_rollback(manifest_path: &Path) -> Result<u32> {
    let manifest = RollbackManifest::load(manifest_path)?;
    let mut reverted = 0u32;

    for entry in &manifest.operations {
        let output = PathBuf::from(&entry.output_path);

        match &entry.action {
            RollbackAction::DeleteOutput => {
                if output.exists() {
                    fs::remove_file(&output)
                        .with_context(|| format!("Cannot remove output file {}", entry.output_path))?;
                    log::info!("Removed output file {}", entry.output_path);
                }
            }
            RollbackAction::RestoreFromBackup => {
                if let Some(ref backup_str) = entry.backup_path {
                    let backup = PathBuf::from(backup_str);
                    if backup.exists() {
                        if let Some(parent) = output.parent() {
                            if !parent.as_os_str().is_empty() {
                                fs::create_dir_all(parent).ok();
                            }
                        }
                        fs::rename(&backup, &output)
                            .with_context(|| format!("Cannot restore {} from backup {}", entry.output_path, backup_str))?;
                        log::info!("Restored {} from backup {}", entry.output_path, backup_str);
                    } else {
                        log::warn!(
                            "Backup file {} no longer exists, cannot restore {}",
                            backup_str,
                            entry.output_path
                        );
                    }
                }
            }
        }

        reverted += 1;
    }

    let backup = manifest_path.with_extension("json.bak");
    fs::rename(manifest_path, &backup)
        .with_context(|| format!("Cannot rename manifest to backup"))?;
    log::info!("Manifest backed up to {}", backup.display());

    Ok(reverted)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_same_file_different_paths() {
        let dir = TempDir::new().unwrap();
        let file = dir.path().join("a.png");
        fs::write(&file, b"dummy").unwrap();

        let alias1 = dir.path().join("a.png");
        let alias2 = dir.path().join("./a.png");
        let alias3 = dir.path().join("b.png");

        assert!(same_file(&alias1, &alias2).unwrap());
        assert!(!same_file(&alias1, &alias3).unwrap());
        assert!(!same_file(&alias1, Path::new("/nonexistent")).unwrap());
    }

    #[test]
    fn test_same_file_hard_link() {
        let dir = TempDir::new().unwrap();
        let file = dir.path().join("orig.png");
        fs::write(&file, b"dummy content").unwrap();

        let link = dir.path().join("link.png");
        fs::hard_link(&file, &link).unwrap();

        assert!(same_file(&file, &link).unwrap());
    }

    #[test]
    fn test_same_file_symlink() {
        let dir = TempDir::new().unwrap();
        let file = dir.path().join("orig.png");
        fs::write(&file, b"dummy content").unwrap();

        let sym = dir.path().join("sym.png");
        #[cfg(unix)]
        std::os::unix::fs::symlink(&file, &sym).unwrap();

        #[cfg(unix)]
        assert!(same_file(&file, &sym).unwrap());
    }

    #[test]
    fn test_generate_backup_path() {
        let p = Path::new("/tmp/photo.jpg");
        assert_eq!(generate_backup_path(p), PathBuf::from("/tmp/photo.jpg.imgproc-orig"));

        let p = Path::new("/tmp/photo");
        assert_eq!(generate_backup_path(p), PathBuf::from("/tmp/photo.bak.imgproc-orig"));
    }
}
