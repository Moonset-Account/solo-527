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
pub struct RollbackEntry {
    pub original_path: String,
    pub original_size: u64,
    pub output_path: String,
    pub was_copied: bool,
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

    pub fn add(&mut self, original_path: &Path, original_size: u64, output_path: &Path, was_copied: bool) {
        self.operations.push(RollbackEntry {
            original_path: original_path.display().to_string(),
            original_size,
            output_path: output_path.display().to_string(),
            was_copied,
        });
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
        if output.exists() {
            fs::remove_file(&output)
                .with_context(|| format!("Cannot remove output file {}", entry.output_path))?;
            log::info!("Removed {}", entry.output_path);
        }

        if entry.was_copied {
            let original = PathBuf::from(&entry.original_path);
            if !original.exists() {
                log::warn!(
                    "Original file {} no longer exists, cannot restore",
                    entry.original_path
                );
                continue;
            }
            fs::copy(&original, &output)
                .with_context(|| format!("Cannot restore {} from {}", entry.output_path, entry.original_path))?;
            log::info!("Restored {} from {}", entry.output_path, entry.original_path);
        }

        reverted += 1;
    }

    let backup = manifest_path.with_extension("json.bak");
    fs::rename(manifest_path, &backup)
        .with_context(|| format!("Cannot rename manifest to backup"))?;
    log::info!("Manifest backed up to {}", backup.display());

    Ok(reverted)
}
