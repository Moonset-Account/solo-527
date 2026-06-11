use anyhow::{Context, Result};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct ImageEntry {
    pub path: PathBuf,
    pub size_bytes: u64,
    pub format: ImageFormat,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[allow(dead_code)]
pub enum ImageFormat {
    Png,
    Jpeg,
    WebP,
}

impl std::fmt::Display for ImageFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ImageFormat::Png => write!(f, "png"),
            ImageFormat::Jpeg => write!(f, "jpeg"),
            ImageFormat::WebP => write!(f, "webp"),
        }
    }
}

impl ImageFormat {
    pub fn extension(&self) -> &str {
        match self {
            ImageFormat::Png => "png",
            ImageFormat::Jpeg => "jpg",
            ImageFormat::WebP => "webp",
        }
    }

    pub fn from_extension(ext: &str) -> Option<Self> {
        match ext.to_ascii_lowercase().as_str() {
            "png" => Some(ImageFormat::Png),
            "jpg" | "jpeg" => Some(ImageFormat::Jpeg),
            "webp" => Some(ImageFormat::WebP),
            _ => None,
        }
    }
}

pub struct ScanResult {
    pub entries: Vec<ImageEntry>,
    pub skipped: Vec<(PathBuf, String)>,
}

pub fn scan_images(
    input: &str,
    recursive: bool,
    filter: Option<&str>,
) -> Result<ScanResult> {
    if input == "-" {
        return scan_from_stdin();
    }

    let path = Path::new(input);
    if !path.exists() {
        anyhow::bail!("Input path does not exist: {}", input);
    }

    let allowed_exts: Vec<String> = filter
        .map(|f| {
            f.split(',')
                .map(|s| s.trim().to_ascii_lowercase())
                .collect()
        })
        .unwrap_or_else(|| vec!["png".into(), "jpg".into(), "jpeg".into(), "webp".into()]);

    let mut entries = Vec::new();
    let mut skipped = Vec::new();

    if path.is_file() {
        if let Some(entry) = try_entry(path, &allowed_exts) {
            entries.push(entry);
        } else {
            skipped.push((path.to_path_buf(), "unsupported format".into()));
        }
    } else if path.is_dir() {
        let max_depth = if recursive { usize::MAX } else { 1 };
        for entry in WalkDir::new(path).max_depth(max_depth).into_iter().filter_map(|e| e.ok()) {
            let p = entry.path();
            if !p.is_file() {
                continue;
            }
            if let Some(img_entry) = try_entry(p, &allowed_exts) {
                entries.push(img_entry);
            } else if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
                if ImageFormat::from_extension(ext).is_some() && !allowed_exts.contains(&ext.to_ascii_lowercase()) {
                    skipped.push((p.to_path_buf(), "filtered out".into()));
                }
            }
        }
    }

    entries.sort_by(|a, b| a.path.cmp(&b.path));

    log::info!("Scanned {} images, skipped {}", entries.len(), skipped.len());

    Ok(ScanResult { entries, skipped })
}

fn try_entry(path: &Path, allowed_exts: &[String]) -> Option<ImageEntry> {
    let ext = path.extension()?.to_str()?;
    let fmt = ImageFormat::from_extension(ext)?;
    if !allowed_exts.contains(&ext.to_ascii_lowercase()) {
        return None;
    }
    let metadata = std::fs::metadata(path).ok()?;
    Some(ImageEntry {
        path: path.to_path_buf(),
        size_bytes: metadata.len(),
        format: fmt,
    })
}

fn scan_from_stdin() -> Result<ScanResult> {
    use std::io::{self, BufRead};
    let stdin = io::stdin();
    let mut entries = Vec::new();
    let mut skipped = Vec::new();

    for line in stdin.lock().lines() {
        let line = line.context("Failed to read from stdin")?;
        let path = PathBuf::from(line.trim());
        if let Some(entry) = try_entry(&path, &["png".into(), "jpg".into(), "jpeg".into(), "webp".into()]) {
            entries.push(entry);
        } else {
            skipped.push((path, "unsupported or missing".into()));
        }
    }

    Ok(ScanResult { entries, skipped })
}
