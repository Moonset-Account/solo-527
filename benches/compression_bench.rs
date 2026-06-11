use criterion::{black_box, criterion_group, criterion_main, Criterion};
use image::{Rgb, RgbImage};
use std::path::PathBuf;
use tempfile::TempDir;

fn bench_jpeg_compress(c: &mut Criterion) {
    let dir = TempDir::new().unwrap();
    let path = dir.path().join("bench.jpg");
    let img = RgbImage::from_pixel(2000, 2000, Rgb([128, 64, 32]));
    img.save(&path).unwrap();

    c.bench_function("jpeg_compress_2000x2000_q80", |b| {
        b.iter(|| {
            let loaded = image::open(black_box(&path)).unwrap();
            let out = dir.path().join("bench_out.jpg");
            let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(
                std::fs::File::create(&out).unwrap(),
                80,
            );
            loaded.write_with_encoder(encoder).unwrap();
            std::fs::remove_file(&out).ok();
        })
    });
}

fn bench_png_compress(c: &mut Criterion) {
    let dir = TempDir::new().unwrap();
    let path = dir.path().join("bench.png");
    let img = RgbImage::from_pixel(2000, 2000, Rgb([128, 64, 32]));
    img.save(&path).unwrap();

    c.bench_function("png_compress_2000x2000", |b| {
        b.iter(|| {
            let loaded = image::open(black_box(&path)).unwrap();
            let out = dir.path().join("bench_out.png");
            loaded.save(&out).unwrap();
            std::fs::remove_file(&out).ok();
        })
    });
}

fn bench_resize(c: &mut Criterion) {
    let img = RgbImage::from_pixel(4000, 3000, Rgb([100, 150, 200]));
    let dynamic = image::DynamicImage::ImageRgb8(img);

    c.bench_function("resize_4000x3000_to_1920", |b| {
        b.iter(|| {
            let ratio = 1920.0 / black_box(4000) as f64;
            let new_h = (3000.0 * ratio).round() as u32;
            black_box(&dynamic).resize_exact(1920, new_h, image::imageops::FilterType::Lanczos3);
        })
    });
}

criterion_group!(benches, bench_jpeg_compress, bench_png_compress, bench_resize);
criterion_main!(benches);
