use assert_cmd::Command;
use predicates::prelude::*;
use std::fs;
use tempfile::TempDir;

fn create_test_image(dir: &std::path::Path, name: &str, w: u32, h: u32) -> std::path::PathBuf {
    let path = dir.join(name);
    let img = image::RgbImage::from_pixel(w, h, image::Rgb([200, 100, 50]));
    img.save(&path).unwrap();
    path
}

fn imgproc_bin() -> Command {
    Command::cargo_bin("imgproc").unwrap()
}

#[test]
fn test_help_flag() {
    imgproc_bin()
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("batch image compression"));
}

#[test]
fn test_version_flag() {
    imgproc_bin()
        .arg("--version")
        .assert()
        .success()
        .stdout(predicate::str::contains("imgproc"));
}

#[test]
fn test_missing_input() {
    imgproc_bin()
        .assert()
        .failure()
        .stderr(predicate::str::contains("required"));
}

#[test]
fn test_nonexistent_input() {
    imgproc_bin()
        .arg("/nonexistent/path/that/does/not/exist")
        .assert()
        .failure();
}

#[test]
fn test_dry_run_no_output_files() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    create_test_image(input_dir.path(), "photo1.png", 100, 100);
    create_test_image(input_dir.path(), "photo2.jpg", 200, 150);

    imgproc_bin()
        .arg(input_dir.path())
        .arg("--out")
        .arg(output_dir.path())
        .arg("--dry-run")
        .arg("--quality")
        .arg("80")
        .assert()
        .success();

    let output_files: Vec<_> = fs::read_dir(output_dir.path())
        .unwrap()
        .filter_map(|e| e.ok())
        .collect();
    assert!(output_files.is_empty(), "dry-run should not create output files");
}

#[test]
fn test_dry_run_json_output() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    create_test_image(input_dir.path(), "sample.png", 100, 100);

    imgproc_bin()
        .arg(input_dir.path())
        .arg("--out")
        .arg(output_dir.path())
        .arg("--dry-run")
        .arg("--format")
        .arg("json")
        .assert()
        .success()
        .stdout(predicate::str::contains("\"total_success\": 1"))
        .stdout(predicate::str::contains("\"status\": \"success\""));
}

#[test]
fn test_compress_jpeg_output() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    create_test_image(input_dir.path(), "test.png", 200, 200);

    imgproc_bin()
        .arg(input_dir.path())
        .arg("--out")
        .arg(output_dir.path())
        .arg("--jpeg")
        .arg("--quality")
        .arg("75")
        .assert()
        .success();

    let output_files: Vec<_> = fs::read_dir(output_dir.path())
        .unwrap()
        .filter_map(|e| e.ok())
        .collect();
    assert!(!output_files.is_empty(), "should create output files");
    let has_jpg = output_files
        .iter()
        .any(|f| f.path().extension().map(|e| e == "jpg").unwrap_or(false));
    assert!(has_jpg, "should produce .jpg files");
}

#[test]
fn test_compress_webp_output() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    create_test_image(input_dir.path(), "test.png", 100, 100);

    imgproc_bin()
        .arg(input_dir.path())
        .arg("--out")
        .arg(output_dir.path())
        .arg("--webp")
        .assert()
        .success();

    let output_files: Vec<_> = fs::read_dir(output_dir.path())
        .unwrap()
        .filter_map(|e| e.ok())
        .filter(|f| f.path().extension().map(|e| e == "webp").unwrap_or(false))
        .collect();
    assert!(!output_files.is_empty(), "should produce .webp files");
}

#[test]
fn test_resize_width() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    create_test_image(input_dir.path(), "big.png", 2000, 1000);

    imgproc_bin()
        .arg(input_dir.path())
        .arg("--out")
        .arg(output_dir.path())
        .arg("--width")
        .arg("500")
        .arg("--png")
        .arg("--format")
        .arg("json")
        .assert()
        .success()
        .stdout(predicate::str::contains("500").and(predicate::str::contains("250")));
}

#[test]
fn test_json_output_structure() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    create_test_image(input_dir.path(), "a.png", 50, 50);

    let output = imgproc_bin()
        .arg(input_dir.path())
        .arg("--out")
        .arg(output_dir.path())
        .arg("--format")
        .arg("json")
        .arg("--jpeg")
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();

    let json_str = String::from_utf8(output).unwrap();
    let json: serde_json::Value = serde_json::from_str(&json_str).unwrap();

    assert!(json["tool"].as_str().unwrap() == "imgproc");
    assert!(json["version"].is_string());
    assert!(json["timestamp"].is_string());
    assert!(json["total_success"].is_number());
    assert!(json["entries"].is_array());
}

#[test]
fn test_rename_pattern() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    create_test_image(input_dir.path(), "original.png", 100, 100);

    imgproc_bin()
        .arg(input_dir.path())
        .arg("--out")
        .arg(output_dir.path())
        .arg("--rename")
        .arg("img_{index:04}.{ext}")
        .arg("--jpeg")
        .assert()
        .success();

    let expected = output_dir.path().join("img_0001.jpg");
    assert!(expected.exists(), "renamed file should exist at {:?}", expected);
}

#[test]
fn test_rollback_manifest() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    create_test_image(input_dir.path(), "photo.png", 100, 100);

    imgproc_bin()
        .arg(input_dir.path())
        .arg("--out")
        .arg(output_dir.path())
        .arg("--rollback")
        .arg("--jpeg")
        .assert()
        .success();

    let manifest_path = output_dir.path().join("imgproc_rollback.json");
    assert!(manifest_path.exists(), "rollback manifest should be created");

    let manifest_data: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(&manifest_path).unwrap()).unwrap();
    assert!(manifest_data["operations"].is_array());
    assert_eq!(manifest_data["operations"].as_array().unwrap().len(), 1);
}

#[test]
fn test_filter_extensions() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    create_test_image(input_dir.path(), "a.png", 100, 100);
    create_test_image(input_dir.path(), "b.jpg", 100, 100);

    imgproc_bin()
        .arg(input_dir.path())
        .arg("--out")
        .arg(output_dir.path())
        .arg("--filter")
        .arg("png")
        .arg("--jpeg")
        .arg("--format")
        .arg("json")
        .assert()
        .success()
        .stdout(predicate::str::contains("\"total_success\": 1"));
}

#[test]
fn test_invalid_quality() {
    let input_dir = TempDir::new().unwrap();

    imgproc_bin()
        .arg(input_dir.path())
        .arg("--quality")
        .arg("999")
        .assert()
        .failure();
}

#[test]
fn test_single_file_input() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    let file_path = create_test_image(input_dir.path(), "single.png", 80, 80);

    imgproc_bin()
        .arg(file_path)
        .arg("--out")
        .arg(output_dir.path())
        .arg("--jpeg")
        .assert()
        .success();

    let output_files: Vec<_> = fs::read_dir(output_dir.path())
        .unwrap()
        .filter_map(|e| e.ok())
        .collect();
    assert_eq!(output_files.len(), 1);
}
