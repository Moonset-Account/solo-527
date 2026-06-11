use anyhow::Result;
use std::path::Path;

use crate::scanner::ImageFormat;

pub fn apply_rename_pattern(
    original_path: &Path,
    pattern: &str,
    index: usize,
    output_format: &ImageFormat,
) -> Result<std::path::PathBuf> {
    let ext = output_format.extension();
    let stem = original_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("image");

    let mut result = pattern.to_string();
    result = result.replace("{name}", stem);
    result = result.replace("{ext}", ext);

    if let Some(idx_start) = result.find("{index") {
        if let Some(brace_end) = result[idx_start..].find('}') {
            let spec = &result[idx_start..idx_start + brace_end + 1];
            let replacement = if spec.contains(':') {
                let fmt_spec = spec.trim_start_matches("{index:").trim_end_matches('}');
                match fmt_spec {
                    "04" | "4" => format!("{:04}", index),
                    "03" | "3" => format!("{:03}", index),
                    "02" | "2" => format!("{:02}", index),
                    _ => format!("{}", index),
                }
            } else {
                format!("{}", index)
            };
            result = result.replace(spec, &replacement);
        }
    }

    if !result.ends_with('.') && !result.contains('.') {
        result = format!("{}.{}", result, ext);
    }

    Ok(std::path::PathBuf::from(result))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_pattern() {
        let path = Path::new("/tmp/photo.png");
        let result = apply_rename_pattern(path, "img_{index:04}.{ext}", 7, &ImageFormat::WebP).unwrap();
        assert_eq!(result, std::path::PathBuf::from("img_0007.webp"));
    }

    #[test]
    fn test_name_placeholder() {
        let path = Path::new("/tmp/my_photo.jpg");
        let result = apply_rename_pattern(path, "prefix_{name}.{ext}", 1, &ImageFormat::Jpeg).unwrap();
        assert_eq!(result, std::path::PathBuf::from("prefix_my_photo.jpg"));
    }

    #[test]
    fn test_no_index() {
        let path = Path::new("/tmp/test.png");
        let result = apply_rename_pattern(path, "{name}_compressed.{ext}", 0, &ImageFormat::Png).unwrap();
        assert_eq!(result, std::path::PathBuf::from("test_compressed.png"));
    }

    #[test]
    fn test_plain_index() {
        let path = Path::new("/tmp/a.png");
        let result = apply_rename_pattern(path, "file_{index}.{ext}", 42, &ImageFormat::WebP).unwrap();
        assert_eq!(result, std::path::PathBuf::from("file_42.webp"));
    }
}
