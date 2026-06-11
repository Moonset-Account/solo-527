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

fn should_unlink_before_compress(original_path: &Path, output_path: &Path) -> Result<bool> {
    if !same_file(original_path, output_path)? {
        return Ok(false);
    }

    let sym_meta = fs::symlink_metadata(output_path)
        .with_context(|| format!("Cannot lstat {}", output_path.display()))?;
    if sym_meta.file_type().is_symlink() {
        log::info!(
            "Output {} is a symlink to original, safe to unlink",
            output_path.display()
        );
        return Ok(true);
    }

    let canon_orig = fs::canonicalize(original_path)
        .with_context(|| format!("Cannot canonicalize {}", original_path.display()))?;
    let canon_out = fs::canonicalize(output_path)
        .with_context(|| format!("Cannot canonicalize {}", output_path.display()))?;

    if canon_orig == canon_out {
        log::info!(
            "Output {} and original {} resolve to same directory entry ({}) — will NOT unlink",
            output_path.display(),
            original_path.display(),
            canon_out.display()
        );
        Ok(false)
    } else {
        log::info!(
            "Output {} and original {} are different directory entries (hardlink) sharing inode — will unlink output",
            output_path.display(),
            original_path.display()
        );
        Ok(true)
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
        let is_same = if output_path.exists() {
            same_file(original_path, output_path)?
        } else {
            false
        };

        let (action, backup_path) = if is_same {
            let backup = generate_backup_path(output_path);
            fs::copy(original_path, &backup)
                .with_context(|| format!("Cannot create backup of {} to {}", output_path.display(), backup.display()))?;
            log::info!("Backed up {} -> {}", output_path.display(), backup.display());

            if should_unlink_before_compress(original_path, output_path)? {
                fs::remove_file(output_path)
                    .with_context(|| format!("Cannot unlink output {} to break hard/sym link association with original", output_path.display()))?;
                log::info!("Unlinked {} to break association with original", output_path.display());
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
                        if output.exists() {
                            fs::remove_file(&output)
                                .with_context(|| format!("Cannot remove current output before restoring from backup {}", entry.output_path))?;
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
    fn test_should_unlink_same_directory_entry_different_writing() {
        let dir = TempDir::new().unwrap();
        let file = dir.path().join("photo.png");
        fs::write(&file, b"dummy").unwrap();

        let alias = dir.path().join("./photo.png");
        assert!(!should_unlink_before_compress(&file, &alias).unwrap(),
            "same directory entry with different path writing must NOT be unlinked");
    }

    #[test]
    fn test_should_unlink_hardlink() {
        let dir = TempDir::new().unwrap();
        let file = dir.path().join("orig.png");
        fs::write(&file, b"dummy content").unwrap();

        let link = dir.path().join("link.png");
        fs::hard_link(&file, &link).unwrap();

        assert!(should_unlink_before_compress(&file, &link).unwrap(),
            "hardlink (different directory entry) should be unlinked before compress");
    }

    #[test]
    fn test_should_unlink_symlink() {
        let dir = TempDir::new().unwrap();
        let file = dir.path().join("orig.png");
        fs::write(&file, b"dummy content").unwrap();

        let sym = dir.path().join("sym.png");
        #[cfg(unix)]
        std::os::unix::fs::symlink(&file, &sym).unwrap();

        #[cfg(unix)]
        assert!(should_unlink_before_compress(&file, &sym).unwrap(),
            "symlink should be unlinked before compress");
    }

    #[test]
    fn test_should_unlink_different_files() {
        let dir = TempDir::new().unwrap();
        let file_a = dir.path().join("a.png");
        let file_b = dir.path().join("b.png");
        fs::write(&file_a, b"aaa").unwrap();
        fs::write(&file_b, b"bbb").unwrap();

        assert!(!should_unlink_before_compress(&file_a, &file_b).unwrap(),
            "different files should not be unlinked");
    }

    #[test]
    fn test_generate_backup_path() {
        let p = Path::new("/tmp/photo.jpg");
        assert_eq!(generate_backup_path(p), PathBuf::from("/tmp/photo.jpg.imgproc-orig"));

        let p = Path::new("/tmp/photo");
        assert_eq!(generate_backup_path(p), PathBuf::from("/tmp/photo.bak.imgproc-orig"));
    }
}
