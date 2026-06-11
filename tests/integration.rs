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
fn test_missing_input_without_undo() {
    imgproc_bin()
        .assert()
        .failure()
        .code(predicate::eq(2))
        .stderr(predicate::str::contains("Missing input path"));
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

#[test]
fn test_undo_without_input_path() {
    let manifest_dir = TempDir::new().unwrap();
    let manifest_path = manifest_dir.path().join("fake_manifest.json");
    fs::write(
        &manifest_path,
        r#"{
  "tool": "imgproc",
  "version": "0.1.0",
  "timestamp": "2024-01-01T00:00:00Z",
  "operations": []
}"#,
    )
    .unwrap();

    imgproc_bin()
        .arg("--undo")
        .arg(&manifest_path)
        .arg("--format")
        .arg("json")
        .assert()
        .success()
        .stdout(predicate::str::contains("\"reverted\": 0"));
}

#[test]
fn test_fatal_error_exit_code_2() {
    imgproc_bin()
        .arg("/definitely/does/not/exist/xyz")
        .assert()
        .failure()
        .code(predicate::eq(2));
}

#[test]
fn test_dry_run_real_dimensions_in_json() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    create_test_image(input_dir.path(), "large.png", 2048, 1024);

    let output = imgproc_bin()
        .arg(input_dir.path())
        .arg("--out")
        .arg(output_dir.path())
        .arg("--width")
        .arg("1024")
        .arg("--dry-run")
        .arg("--format")
        .arg("json")
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();

    let json_str = String::from_utf8(output).unwrap();
    let json: serde_json::Value = serde_json::from_str(&json_str).unwrap();
    let entry = &json["entries"][0];

    assert_eq!(entry["original_dimensions"][0].as_u64(), Some(2048));
    assert_eq!(entry["original_dimensions"][1].as_u64(), Some(1024));
    assert_eq!(entry["output_dimensions"][0].as_u64(), Some(1024));
    assert_eq!(entry["output_dimensions"][1].as_u64(), Some(512));
    assert!(entry["original_size"].as_u64().unwrap() > 0);

    let out_files: Vec<_> = fs::read_dir(output_dir.path()).unwrap().filter_map(|e| e.ok()).collect();
    assert!(out_files.is_empty(), "dry-run must not write files");
}

#[test]
fn test_rollback_new_output_deletes_file_no_copy() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    create_test_image(input_dir.path(), "src.png", 50, 50);

    imgproc_bin()
        .arg(input_dir.path())
        .arg("--out")
        .arg(output_dir.path())
        .arg("--rollback")
        .arg("--jpeg")
        .assert()
        .success();

    let output_jpg = output_dir.path().join("src.jpg");
    assert!(output_jpg.exists(), "output file should exist");

    let manifest_path = output_dir.path().join("imgproc_rollback.json");
    assert!(manifest_path.exists());

    let manifest_json: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(&manifest_path).unwrap()).unwrap();
    assert_eq!(
        manifest_json["operations"][0]["action"].as_str(),
        Some("DeleteOutput")
    );
    assert!(manifest_json["operations"][0]["backup_path"].is_null());

    let orig_input: Vec<_> = fs::read_dir(input_dir.path()).unwrap().filter_map(|e| e.ok()).collect();
    assert_eq!(orig_input.len(), 1);

    imgproc_bin()
        .arg("--undo")
        .arg(&manifest_path)
        .assert()
        .success();

    assert!(!output_jpg.exists(), "output should be deleted after rollback");
    assert!(!manifest_path.exists(), "manifest should be backed up (renamed)");

    let input_remaining: Vec<_> = fs::read_dir(input_dir.path()).unwrap().filter_map(|e| e.ok()).collect();
    assert_eq!(
        input_remaining.len(),
        1,
        "original input should not be touched or copied anywhere"
    );

    let out_dir_contents: Vec<_> = fs::read_dir(output_dir.path())
        .unwrap()
        .filter_map(|e| {
            let p = e.unwrap().path();
            if p.file_name().unwrap().to_str().unwrap().contains("src.jpg") {
                Some(p)
            } else {
                None
            }
        })
        .collect();
    assert!(
        out_dir_contents.is_empty(),
        "rollback must not copy original image to output dir"
    );
}

#[test]
fn test_rollback_inplace_creates_backup_and_restores() {
    let work_dir = TempDir::new().unwrap();
    let img_path = create_test_image(work_dir.path(), "photo.png", 100, 100);
    let original_bytes = fs::read(&img_path).unwrap();
    let original_size = original_bytes.len();

    imgproc_bin()
        .arg(&img_path)
        .arg("--out")
        .arg(work_dir.path())
        .arg("--rollback")
        .arg("--png")
        .assert()
        .success();

    let backup = work_dir.path().join("photo.png.imgproc-orig");
    assert!(backup.exists(), "backup file should be created next to original");

    let manifest_path = work_dir.path().join("imgproc_rollback.json");
    let manifest_json: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(&manifest_path).unwrap()).unwrap();
    assert_eq!(
        manifest_json["operations"][0]["action"].as_str(),
        Some("RestoreFromBackup")
    );

    let backup_bytes = fs::read(&backup).unwrap();
    assert_eq!(
        original_bytes, backup_bytes,
        "backup must be byte-identical to original"
    );

    let new_bytes = fs::read(&img_path).unwrap();
    assert_eq!(
        new_bytes.len(),
        original_size,
        "same format encode should produce roughly same size"
    );

    imgproc_bin()
        .arg("--undo")
        .arg(&manifest_path)
        .assert()
        .success();

    let restored_bytes = fs::read(&img_path).unwrap();
    assert_eq!(
        original_bytes, restored_bytes,
        "after rollback file should match original bytes exactly"
    );
    assert!(
        !backup.exists(),
        "backup file should be consumed (renamed into place)"
    );
}

#[test]
fn test_rollback_hard_link_same_inode_protects_original() {
    use std::os::unix::fs::MetadataExt;

    let work_dir = TempDir::new().unwrap();
    let original_path = create_test_image(work_dir.path(), "real.png", 80, 80);
    let original_bytes = fs::read(&original_path).unwrap();
    let original_ino = fs::metadata(&original_path).unwrap().ino();

    let link_path = work_dir.path().join("hardlink.png");
    fs::hard_link(&original_path, &link_path).unwrap();

    let link_ino = fs::metadata(&link_path).unwrap().ino();
    assert_eq!(original_ino, link_ino, "hard link must share inode");

    imgproc_bin()
        .arg(&original_path)
        .arg("--out")
        .arg(work_dir.path())
        .arg("--rename")
        .arg("hardlink.{ext}")
        .arg("--rollback")
        .arg("--png")
        .assert()
        .success();

    let original_after = fs::read(&original_path).unwrap();
    assert_eq!(
        original_bytes, original_after,
        "original file bytes must be untouched even when hard link is overwritten"
    );

    let backup = work_dir.path().join("hardlink.png.imgproc-orig");
    assert!(backup.exists(), "backup must exist because link and original share inode");

    let manifest_path = work_dir.path().join("imgproc_rollback.json");
    let manifest: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(&manifest_path).unwrap()).unwrap();
    assert_eq!(
        manifest["operations"][0]["action"].as_str(),
        Some("RestoreFromBackup")
    );

    imgproc_bin()
        .arg("--undo")
        .arg(&manifest_path)
        .assert()
        .success();

    assert!(!backup.exists(), "backup should be consumed after rollback");

    let restored = fs::read(&link_path).unwrap();
    assert_eq!(
        original_bytes, restored,
        "rollback must restore link_path content from backup"
    );
}

#[test]
fn test_rollback_symlink_to_original_protects_original() {
    use std::os::unix::fs as unix_fs;

    let work_dir = TempDir::new().unwrap();
    let original_path = create_test_image(work_dir.path(), "real.png", 80, 80);
    let original_bytes = fs::read(&original_path).unwrap();

    let symlink_path = work_dir.path().join("symlink.png");
    unix_fs::symlink(&original_path, &symlink_path).unwrap();

    imgproc_bin()
        .arg(&original_path)
        .arg("--out")
        .arg(work_dir.path())
        .arg("--rename")
        .arg("symlink.{ext}")
        .arg("--rollback")
        .arg("--png")
        .assert()
        .success();

    let original_after = fs::read(&original_path).unwrap();
    assert_eq!(
        original_bytes, original_after,
        "original file bytes must be untouched even when symlink target is same file"
    );

    let sym_meta = fs::symlink_metadata(&symlink_path).unwrap();
    assert!(!sym_meta.file_type().is_symlink(), "symlink should be replaced with regular file");

    let backup = work_dir.path().join("symlink.png.imgproc-orig");
    assert!(backup.exists(), "backup must exist because symlink pointed to original");

    let manifest_path = work_dir.path().join("imgproc_rollback.json");
    let manifest: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(&manifest_path).unwrap()).unwrap();
    assert_eq!(
        manifest["operations"][0]["action"].as_str(),
        Some("RestoreFromBackup")
    );

    imgproc_bin()
        .arg("--undo")
        .arg(&manifest_path)
        .assert()
        .success();

    let restored = fs::read(&symlink_path).unwrap();
    assert_eq!(
        original_bytes, restored,
        "rollback must restore symlink_path from backup"
    );
}

#[test]
fn test_rollback_different_output_only_deletes_no_copy() {
    let input_dir = TempDir::new().unwrap();
    let output_dir = TempDir::new().unwrap();

    let input_path = create_test_image(input_dir.path(), "src.png", 50, 50);
    let input_bytes = fs::read(&input_path).unwrap();
    let input_size = input_bytes.len();

    imgproc_bin()
        .arg(input_dir.path())
        .arg("--out")
        .arg(output_dir.path())
        .arg("--rollback")
        .arg("--jpeg")
        .arg("--quality")
        .arg("50")
        .assert()
        .success();

    let output_path = output_dir.path().join("src.jpg");
    assert!(output_path.exists());

    let manifest_path = output_dir.path().join("imgproc_rollback.json");
    let manifest: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(&manifest_path).unwrap()).unwrap();
    assert_eq!(
        manifest["operations"][0]["action"].as_str(),
        Some("DeleteOutput"),
        "different output path must use DeleteOutput action"
    );
    assert!(manifest["operations"][0]["backup_path"].is_null());

    let input_bytes_after = fs::read(&input_path).unwrap();
    assert_eq!(
        input_bytes, input_bytes_after,
        "input file must be completely untouched"
    );
    assert_eq!(
        input_bytes_after.len(),
        input_size,
        "input file size unchanged"
    );

    imgproc_bin()
        .arg("--undo")
        .arg(&manifest_path)
        .assert()
        .success();

    assert!(!output_path.exists(), "output must be deleted after rollback");

    let output_dir_files: Vec<_> = fs::read_dir(output_dir.path())
        .unwrap()
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| {
            let name = p.file_name().unwrap().to_str().unwrap();
            name.ends_with(".jpg") || name.ends_with(".png")
        })
        .collect();
    assert!(
        output_dir_files.is_empty(),
        "rollback must not copy any images into output directory. Found: {:?}",
        output_dir_files
    );

    let input_bytes_final = fs::read(&input_path).unwrap();
    assert_eq!(
        input_bytes, input_bytes_final,
        "input file must remain untouched after rollback"
    );
}

#[test]
fn test_rollback_different_paths_same_file_not_delete_output() {
    use std::path::PathBuf;

    let work_dir = TempDir::new().unwrap();
    let abs_path = create_test_image(work_dir.path(), "photo.png", 60, 60);
    let abs_bytes = fs::read(&abs_path).unwrap();

    let dot_slash_path: PathBuf = work_dir.path().join("./photo.png");
    let canonical_dot = fs::canonicalize(&dot_slash_path).unwrap();
    let canonical_abs = fs::canonicalize(&abs_path).unwrap();
    assert_eq!(canonical_dot, canonical_abs);

    imgproc_bin()
        .arg(&dot_slash_path)
        .arg("--out")
        .arg(work_dir.path())
        .arg("--rename")
        .arg("photo.{ext}")
        .arg("--rollback")
        .arg("--jpeg")
        .arg("--quality")
        .arg("40")
        .assert()
        .success();

    let output_jpg = work_dir.path().join("photo.jpg");
    assert!(output_jpg.exists(), "output jpg should exist");
    assert!(abs_path.exists(), "original png must still exist");

    let manifest_path = work_dir.path().join("imgproc_rollback.json");
    let manifest: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(&manifest_path).unwrap()).unwrap();

    let action = manifest["operations"][0]["action"].as_str();
    let original_path = manifest["operations"][0]["original_path"].as_str().unwrap();
    let output_path = manifest["operations"][0]["output_path"].as_str().unwrap();

    assert_ne!(original_path, output_path, "path strings differ (png vs jpg)");
    assert_eq!(
        action,
        Some("DeleteOutput"),
        "different actual files must use DeleteOutput, not RestoreFromBackup"
    );

    let original_bytes_after = fs::read(&abs_path).unwrap();
    assert_eq!(
        abs_bytes, original_bytes_after,
        "original png file must be untouched"
    );

    imgproc_bin()
        .arg("--undo")
        .arg(&manifest_path)
        .assert()
        .success();

    assert!(!output_jpg.exists(), "output jpg must be deleted after rollback");

    let original_bytes_final = fs::read(&abs_path).unwrap();
    assert_eq!(
        abs_bytes, original_bytes_final,
        "original png must remain untouched after rollback"
    );
}
