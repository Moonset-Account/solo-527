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
        return scan_from_stdin(filter);
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

fn scan_from_stdin(filter: Option<&str>) -> Result<ScanResult> {
    use std::io::{self, Read};

    let allowed_exts: Vec<String> = filter
        .map(|f| {
            f.split(',')
                .map(|s| s.trim().to_ascii_lowercase())
                .collect()
        })
        .unwrap_or_else(|| vec!["png".into(), "jpg".into(), "jpeg".into(), "webp".into()]);

    let mut buf = String::new();
    io::stdin()
        .read_to_string(&mut buf)
        .context("Failed to read stdin")?;

    let trimmed = buf.trim();
    if trimmed.is_empty() {
        return Ok(ScanResult {
            entries: vec![],
            skipped: vec![],
        });
    }

    let first_char = trimmed.chars().next().unwrap_or(' ');
    let looks_like_json = first_char == '{' || first_char == '[';

    let (paths, json_parse_error) = if looks_like_json {
        match try_parse_json_paths(trimmed) {
            Some(paths) => (paths, None),
            None => (
                vec![],
                Some("invalid JSON input".to_string()),
            ),
        }
    } else {
        let lines: Vec<String> = trimmed
            .lines()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty())
            .collect();
        (lines, None)
    };

    let mut entries = Vec::new();
    let mut skipped = Vec::new();

    if let Some(err_msg) = json_parse_error {
        skipped.push((PathBuf::from("<stdin>"), err_msg));
    }

    for path_str in paths {
        let path = PathBuf::from(&path_str);
        if path_str.is_empty() {
            continue;
        }
        if let Some(entry) = try_entry(&path, &allowed_exts) {
            entries.push(entry);
        } else if !path.exists() {
            skipped.push((path, "file not found".into()));
        } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            if ImageFormat::from_extension(ext).is_some() {
                if !allowed_exts.contains(&ext.to_ascii_lowercase()) {
                    skipped.push((path, "filtered out".into()));
                } else {
                    skipped.push((path, "unsupported format".into()));
                }
            } else {
                skipped.push((path, "unsupported format".into()));
            }
        } else {
            skipped.push((path, "no image extension".into()));
        }
    }

    entries.sort_by(|a, b| a.path.cmp(&b.path));

    log::info!(
        "Stdin scan: {} images, {} skipped",
        entries.len(),
        skipped.len()
    );

    Ok(ScanResult { entries, skipped })
}

fn try_parse_json_paths(input: &str) -> Option<Vec<String>> {
    let first_char = input.trim_start().chars().next()?;
    if first_char != '{' && first_char != '[' {
        return None;
    }

    if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(input) {
        if let Some(arr) = json_val.as_array() {
            return Some(arr
                .iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect());
        }
        if let Some(obj) = json_val.as_object() {
            if let Some(files_val) = obj.get("files") {
                if let Some(arr) = files_val.as_array() {
                    return Some(arr
                        .iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect());
                }
            }
            if let Some(paths_val) = obj.get("paths") {
                if let Some(arr) = paths_val.as_array() {
                    return Some(arr
                        .iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect());
                }
            }
        }
    }

    None
}
