use anyhow::{Context, Result};
use image::ImageFormat as ImgFmt;
use std::path::Path;

use crate::scanner::ImageFormat;

pub struct CompressOptions {
    pub quality: u8,
    pub max_width: Option<u32>,
    pub output_format: ImageFormat,
}

pub struct CompressResult {
    pub output_path: std::path::PathBuf,
    pub original_size: u64,
    pub compressed_size: u64,
    pub original_dimensions: (u32, u32),
    pub output_dimensions: (u32, u32),
}

pub struct ProbeResult {
    pub original_size: u64,
    pub original_dimensions: (u32, u32),
    pub output_dimensions: (u32, u32),
}

pub fn probe_image(
    input_path: &Path,
    opts: &CompressOptions,
) -> Result<ProbeResult> {
    let original_metadata = std::fs::metadata(input_path)
        .with_context(|| format!("Cannot read metadata for {}", input_path.display()))?;
    let original_size = original_metadata.len();

    let dims = image::image_dimensions(input_path)
        .with_context(|| format!("Cannot read dimensions of {}", input_path.display()))?;
    let original_dimensions = dims;

    let output_dimensions = if let Some(max_w) = opts.max_width {
        if dims.0 > max_w {
            let ratio = max_w as f64 / dims.0 as f64;
            let new_h = (dims.1 as f64 * ratio).round() as u32;
            (max_w, new_h)
        } else {
            dims
        }
    } else {
        dims
    };

    Ok(ProbeResult {
        original_size,
        original_dimensions,
        output_dimensions,
    })
}

pub fn compress_image(
    input_path: &Path,
    output_path: &Path,
    opts: &CompressOptions,
) -> Result<CompressResult> {
    let original_metadata = std::fs::metadata(input_path)
        .with_context(|| format!("Cannot read metadata for {}", input_path.display()))?;
    let original_size = original_metadata.len();

    let mut img = image::open(input_path)
        .with_context(|| format!("Cannot open image {}", input_path.display()))?;

    let original_dimensions = (img.width(), img.height());

    if let Some(max_w) = opts.max_width {
        if img.width() > max_w {
            let ratio = max_w as f64 / img.width() as f64;
            let new_h = (img.height() as f64 * ratio).round() as u32;
            img = img.resize_exact(max_w, new_h, image::imageops::FilterType::Lanczos3);
            log::debug!(
                "Resized {} from {}x{} to {}x{}",
                input_path.display(),
                original_dimensions.0,
                original_dimensions.1,
                max_w,
                new_h
            );
        }
    }

    let output_dimensions = (img.width(), img.height());

    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent)
            .with_context(|| format!("Cannot create output directory {}", parent.display()))?;
    }

    let img_fmt = match opts.output_format {
        ImageFormat::Png => ImgFmt::Png,
        ImageFormat::Jpeg => ImgFmt::Jpeg,
        ImageFormat::WebP => ImgFmt::WebP,
    };

    let mut buf = std::io::BufWriter::new(std::fs::File::create(output_path)?);
    match opts.output_format {
        ImageFormat::Jpeg => {
            let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, opts.quality);
            img.write_with_encoder(encoder)
                .with_context(|| format!("Failed to encode JPEG for {}", input_path.display()))?;
        }
        ImageFormat::Png => {
            img.write_to(&mut buf, img_fmt)
                .with_context(|| format!("Failed to encode PNG for {}", input_path.display()))?;
        }
        ImageFormat::WebP => {
            img.write_to(&mut buf, img_fmt)
                .with_context(|| format!("Failed to encode WebP for {}", input_path.display()))?;
        }
    }

    drop(buf);

    let compressed_metadata = std::fs::metadata(output_path)
        .with_context(|| format!("Cannot read output metadata {}", output_path.display()))?;
    let compressed_size = compressed_metadata.len();

    log::debug!(
        "Compressed {} -> {} ({}B -> {}B, {:.1}%)",
        input_path.display(),
        output_path.display(),
        original_size,
        compressed_size,
        (compressed_size as f64 / original_size as f64) * 100.0
    );

    Ok(CompressResult {
        output_path: output_path.to_path_buf(),
        original_size,
        compressed_size,
        original_dimensions,
        output_dimensions,
    })
}
