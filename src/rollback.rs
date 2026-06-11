use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

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

impl RollbackManifest {
    pub fn new() -> Self {
        RollbackManifest {
            tool: "imgproc".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            operations: Vec::new(),
        }
    }

    pub fn add(
        &mut self,
        original_path: &Path,
        original_size: u64,
        output_path: &Path,
    ) -> Result<()> {
        let same_path = original_path == output_path;
        let (action, backup_path) = if same_path {
            let backup = output_path.with_extension(format!(
                "{}.imgproc-orig",
                output_path.extension().and_then(|e| e.to_str()).unwrap_or("bak")
            ));
            fs::copy(output_path, &backup)
                .with_context(|| format!("Cannot create backup of {} to {}", output_path.display(), backup.display()))?;
            log::info!("Backed up {} -> {}", output_path.display(), backup.display());
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
