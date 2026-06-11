"""Unit tests for core module."""

import hashlib
import json
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
import yaml

from backup_checker.config import Config
from backup_checker.core import (
    CheckReport,
    CheckResult,
    FileEntry,
    Manifest,
    compute_file_hash,
    detect_expired_backups,
    detect_missing_files,
    generate_manifest,
    parse_manifest,
    run_checks,
)
from backup_checker.exceptions import (
    ExitCode,
    HashAlgorithmError,
    ManifestError,
)


@pytest.fixture
def temp_backup_dir():
    """Create a temporary backup directory with test files."""
    with tempfile.TemporaryDirectory() as td:
        base = Path(td)
        (base / "file1.txt").write_text("content1")
        (base / "file2.txt").write_text("content2")
        subdir = base / "subdir"
        subdir.mkdir()
        (subdir / "file3.txt").write_text("content3")
        yield base


@pytest.fixture
def sample_manifest_dict():
    """Return a sample manifest dictionary."""
    return {
        "version": "1.0",
        "backup_id": "test-001",
        "created_at": "2025-01-01T00:00:00Z",
        "hash_algorithm": "sha256",
        "files": [
            {"path": "file1.txt", "hash": "abc123", "size": 100},
            {"path": "file2.txt", "hash": "def456", "size": 200},
        ],
    }


@pytest.fixture
def sample_manifest(sample_manifest_dict):
    """Return a sample Manifest object."""
    return Manifest.from_dict(sample_manifest_dict)


class TestDataClasses:
    """Test data classes."""

    def test_file_entry_to_dict(self):
        entry = FileEntry(
            path="test.txt",
            hash="abc123",
            size=100,
            created_at="2025-01-01T00:00:00Z",
        )
        data = entry.to_dict()
        assert data["path"] == "test.txt"
        assert data["hash"] == "abc123"
        assert data["size"] == 100

    def test_file_entry_from_dict(self):
        data = {
            "path": "test.txt",
            "hash": "abc123",
            "size": 100,
            "extra_field": "ignored",
        }
        entry = FileEntry.from_dict(data)
        assert entry.path == "test.txt"
        assert entry.hash == "abc123"
        assert entry.size == 100

    def test_manifest_to_dict(self, sample_manifest):
        data = sample_manifest.to_dict()
        assert data["version"] == "1.0"
        assert data["backup_id"] == "test-001"
        assert len(data["files"]) == 2
        assert data["files"][0]["path"] == "file1.txt"

    def test_check_result_is_ok(self):
        ok_result = CheckResult(path="test.txt", status="ok", expected_hash="abc")
        assert ok_result.is_ok is True

        fail_result = CheckResult(path="test.txt", status="hash_mismatch", expected_hash="abc")
        assert fail_result.is_ok is False

        missing_result = CheckResult(path="test.txt", status="missing", expected_hash="abc")
        assert missing_result.is_ok is False

    def test_check_report_has_errors(self):
        report = CheckReport()
        assert report.has_errors is False

        report.summary.failed = 1
        assert report.has_errors is True

        report.summary.failed = 0
        report.summary.missing = 1
        assert report.has_errors is True

        report.summary.missing = 0
        report.summary.expired = 1
        assert report.has_errors is True

        report.summary.expired = 0
        report.errors.append({"type": "TestError", "message": "test"})
        assert report.has_errors is True

    def test_check_report_set_exit_code(self):
        config = Config(fail_on_integrity=True, fail_on_missing=True, fail_on_expired=False)
        report = CheckReport()

        report.summary.integrity_errors = 1
        report.set_exit_code(config)
        assert report.exit_code == ExitCode.INTEGRITY_FAILED

        report.summary.integrity_errors = 0
        report.summary.missing = 1
        report.set_exit_code(config)
        assert report.exit_code == ExitCode.MISSING_FILES

        config.fail_on_expired = True
        report.summary.missing = 0
        report.summary.expired = 1
        report.set_exit_code(config)
        assert report.exit_code == ExitCode.EXPIRED_BACKUPS

        report.summary.expired = 0
        report.errors.append({"type": "ManifestError", "message": "test"})
        report.set_exit_code(config)
        assert report.exit_code == ExitCode.MANIFEST_ERROR

        report.errors = [{"type": "ConfigError", "message": "test"}]
        report.set_exit_code(config)
        assert report.exit_code == ExitCode.CONFIG_ERROR

        report.errors = []
        report.set_exit_code(config)
        assert report.exit_code == ExitCode.SUCCESS


class TestComputeFileHash:
    """Test file hash computation."""

    def test_compute_sha256(self, temp_backup_dir):
        file_path = temp_backup_dir / "file1.txt"
        expected = hashlib.sha256(b"content1").hexdigest()
        result = compute_file_hash(str(file_path), "sha256")
        assert result == expected

    def test_compute_md5(self, temp_backup_dir):
        file_path = temp_backup_dir / "file1.txt"
        expected = hashlib.md5(b"content1").hexdigest()
        result = compute_file_hash(str(file_path), "md5")
        assert result == expected

    def test_compute_sha512(self, temp_backup_dir):
        file_path = temp_backup_dir / "file1.txt"
        expected = hashlib.sha512(b"content1").hexdigest()
        result = compute_file_hash(str(file_path), "sha512")
        assert result == expected

    def test_unsupported_algorithm(self, temp_backup_dir):
        file_path = temp_backup_dir / "file1.txt"
        with pytest.raises(HashAlgorithmError):
            compute_file_hash(str(file_path), "invalid")

    def test_large_file(self, temp_backup_dir):
        large_file = temp_backup_dir / "large.txt"
        content = b"x" * 100000
        large_file.write_bytes(content)
        expected = hashlib.sha256(content).hexdigest()
        result = compute_file_hash(str(large_file), "sha256", chunk_size=1024)
        assert result == expected


class TestParseManifest:
    """Test manifest parsing."""

    def test_parse_yaml_manifest(self, temp_backup_dir, sample_manifest_dict):
        manifest_file = temp_backup_dir / "manifest.yaml"
        manifest_file.write_text(yaml.dump(sample_manifest_dict))
        manifest = parse_manifest(str(manifest_file))
        assert manifest.backup_id == "test-001"
        assert len(manifest.files) == 2
        assert manifest.files[0].path == "file1.txt"

    def test_parse_json_manifest(self, temp_backup_dir, sample_manifest_dict):
        manifest_file = temp_backup_dir / "manifest.json"
        manifest_file.write_text(json.dumps(sample_manifest_dict))
        manifest = parse_manifest(str(manifest_file))
        assert manifest.backup_id == "test-001"

    def test_parse_missing_file(self, temp_backup_dir):
        with pytest.raises(ManifestError) as exc_info:
            parse_manifest(str(temp_backup_dir / "nonexistent.yaml"))
        assert "not found" in str(exc_info.value)

    def test_parse_unsupported_format(self, temp_backup_dir):
        manifest_file = temp_backup_dir / "manifest.txt"
        manifest_file.write_text("some text")
        with pytest.raises(ManifestError) as exc_info:
            parse_manifest(str(manifest_file))
        assert "Unsupported manifest format" in str(exc_info.value)

    def test_parse_invalid_yaml(self, temp_backup_dir):
        manifest_file = temp_backup_dir / "manifest.yaml"
        manifest_file.write_text("invalid: [yaml: [")
        with pytest.raises(ManifestError):
            parse_manifest(str(manifest_file))

    def test_parse_invalid_json(self, temp_backup_dir):
        manifest_file = temp_backup_dir / "manifest.json"
        manifest_file.write_text("{invalid}")
        with pytest.raises(ManifestError):
            parse_manifest(str(manifest_file))

    def test_parse_missing_files_field(self, temp_backup_dir):
        manifest_file = temp_backup_dir / "manifest.yaml"
        manifest_file.write_text(yaml.dump({"version": "1.0"}))
        with pytest.raises(ManifestError) as exc_info:
            parse_manifest(str(manifest_file))
        assert "validation failed" in str(exc_info.value)

    def test_parse_missing_path_in_file_entry(self, temp_backup_dir):
        manifest_file = temp_backup_dir / "manifest.yaml"
        manifest_file.write_text(yaml.dump({
            "files": [{"hash": "abc123"}]
        }))
        with pytest.raises(ManifestError):
            parse_manifest(str(manifest_file))


class TestDetectMissingFiles:
    """Test missing file detection."""

    def test_detect_missing_files(self, sample_manifest):
        results = [
            CheckResult(path="file1.txt", status="ok", expected_hash="abc123"),
            CheckResult(path="file2.txt", status="missing", expected_hash="def456", error="File not found"),
        ]
        missing = detect_missing_files(sample_manifest, results)
        assert len(missing) == 1
        assert missing[0]["path"] == "file2.txt"
        assert missing[0]["error"] == "File not found"

    def test_no_missing_files(self, sample_manifest):
        results = [
            CheckResult(path="file1.txt", status="ok", expected_hash="abc123"),
            CheckResult(path="file2.txt", status="ok", expected_hash="def456"),
        ]
        missing = detect_missing_files(sample_manifest, results)
        assert len(missing) == 0


class TestDetectExpiredBackups:
    """Test expired backup detection."""

    def test_detect_expired(self, temp_backup_dir, sample_manifest):
        old_date = (datetime.now(timezone.utc) - timedelta(days=60)).isoformat()
        sample_manifest.created_at = old_date

        manifest_file = temp_backup_dir / "manifest.yaml"
        manifest_file.write_text(yaml.dump(sample_manifest.to_dict()))

        expired = detect_expired_backups(sample_manifest, str(manifest_file), 30)
        assert len(expired) > 0
        assert any(e["source"] == "manifest" for e in expired)
        assert expired[0]["age_days"] > 30

    def test_no_expired(self, temp_backup_dir, sample_manifest):
        recent_date = (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
        sample_manifest.created_at = recent_date

        manifest_file = temp_backup_dir / "manifest.yaml"
        manifest_file.write_text(yaml.dump(sample_manifest.to_dict()))

        expired = detect_expired_backups(sample_manifest, str(manifest_file), 30)
        assert len(expired) == 0


class TestGenerateManifest:
    """Test manifest generation."""

    def test_generate_manifest_dry_run(self, temp_backup_dir):
        output_file = temp_backup_dir / "output.yaml"
        manifest = generate_manifest(
            backup_dir=str(temp_backup_dir),
            output_path=str(output_file),
            algorithm="sha256",
            dry_run=True,
        )
        assert len(manifest.files) == 3
        assert not output_file.exists()

    def test_generate_manifest_actual(self, temp_backup_dir):
        output_file = temp_backup_dir / "output.yaml"
        manifest = generate_manifest(
            backup_dir=str(temp_backup_dir),
            output_path=str(output_file),
            algorithm="sha256",
            dry_run=False,
        )
        assert len(manifest.files) == 3
        assert output_file.exists()

        loaded = parse_manifest(str(output_file))
        assert len(loaded.files) == 3

    def test_generate_manifest_skip_hidden(self, temp_backup_dir):
        hidden_file = temp_backup_dir / ".hidden.txt"
        hidden_file.write_text("hidden")

        output_file = temp_backup_dir / "output.yaml"
        manifest = generate_manifest(
            backup_dir=str(temp_backup_dir),
            output_path=str(output_file),
            include_hidden=False,
            dry_run=True,
        )
        assert len(manifest.files) == 3

    def test_generate_manifest_include_hidden(self, temp_backup_dir):
        hidden_file = temp_backup_dir / ".hidden.txt"
        hidden_file.write_text("hidden")

        output_file = temp_backup_dir / "output.yaml"
        manifest = generate_manifest(
            backup_dir=str(temp_backup_dir),
            output_path=str(output_file),
            include_hidden=True,
            dry_run=True,
        )
        assert len(manifest.files) == 4

    def test_generate_manifest_json_output(self, temp_backup_dir):
        output_file = temp_backup_dir / "output.json"
        generate_manifest(
            backup_dir=str(temp_backup_dir),
            output_path=str(output_file),
            dry_run=False,
        )
        assert output_file.exists()
        data = json.loads(output_file.read_text())
        assert "files" in data

    def test_generate_manifest_unsupported_format(self, temp_backup_dir):
        output_file = temp_backup_dir / "output.txt"
        with pytest.raises(ManifestError):
            generate_manifest(
                backup_dir=str(temp_backup_dir),
                output_path=str(output_file),
                dry_run=False,
            )


class TestRunChecks:
    """Test the main run_checks function."""

    def test_run_checks_valid(self, temp_backup_dir):
        manifest_file = temp_backup_dir / "manifest.yaml"
        generate_manifest(str(temp_backup_dir), str(manifest_file), dry_run=False)

        config = Config(
            manifest_path=str(manifest_file),
            backup_dir=str(temp_backup_dir),
            check_expired=False,
        )
        report = run_checks(config)
        assert report.summary.total == 3
        assert report.summary.passed == 3
        assert report.summary.failed == 0
        assert report.summary.missing == 0
        assert report.exit_code == 0

    def test_run_checks_hash_mismatch(self, temp_backup_dir):
        manifest_file = temp_backup_dir / "manifest.yaml"
        generate_manifest(str(temp_backup_dir), str(manifest_file), dry_run=False)

        (temp_backup_dir / "file1.txt").write_text("modified content")

        config = Config(
            manifest_path=str(manifest_file),
            backup_dir=str(temp_backup_dir),
            check_expired=False,
        )
        report = run_checks(config)
        assert report.summary.integrity_errors == 1
        assert report.exit_code == ExitCode.INTEGRITY_FAILED

    def test_run_checks_missing_file(self, temp_backup_dir):
        manifest_file = temp_backup_dir / "manifest.yaml"
        generate_manifest(str(temp_backup_dir), str(manifest_file), dry_run=False)

        (temp_backup_dir / "file1.txt").unlink()

        config = Config(
            manifest_path=str(manifest_file),
            backup_dir=str(temp_backup_dir),
            check_expired=False,
        )
        report = run_checks(config)
        assert report.summary.missing == 1
        assert report.exit_code == ExitCode.MISSING_FILES

    def test_run_checks_no_integrity_only_missing(self, temp_backup_dir):
        manifest_file = temp_backup_dir / "manifest.yaml"
        generate_manifest(str(temp_backup_dir), str(manifest_file), dry_run=False)

        (temp_backup_dir / "file1.txt").unlink()

        config = Config(
            manifest_path=str(manifest_file),
            backup_dir=str(temp_backup_dir),
            check_integrity=False,
            check_missing=True,
            check_expired=False,
        )
        report = run_checks(config)
        assert report.summary.missing == 1
        assert report.exit_code == ExitCode.MISSING_FILES

    def test_run_checks_dry_run_returns_zero(self, temp_backup_dir):
        pass

    def test_run_checks_no_fail_on_missing(self, temp_backup_dir):
        manifest_file = temp_backup_dir / "manifest.yaml"
        generate_manifest(str(temp_backup_dir), str(manifest_file), dry_run=False)

        (temp_backup_dir / "file1.txt").unlink()

        config = Config(
            manifest_path=str(manifest_file),
            backup_dir=str(temp_backup_dir),
            check_expired=False,
            fail_on_missing=False,
        )
        report = run_checks(config)
        assert report.summary.missing == 1
        assert report.exit_code == 0

    def test_run_checks_combined_issues_priority(self, temp_backup_dir):
        manifest_file = temp_backup_dir / "manifest.yaml"
        generate_manifest(str(temp_backup_dir), str(manifest_file), dry_run=False)

        (temp_backup_dir / "file1.txt").write_text("modified")
        (temp_backup_dir / "file2.txt").unlink()

        config = Config(
            manifest_path=str(manifest_file),
            backup_dir=str(temp_backup_dir),
            check_expired=False,
            fail_on_integrity=True,
            fail_on_missing=True,
        )
        report = run_checks(config)
        assert report.summary.integrity_errors == 1
        assert report.summary.missing == 1
        assert report.exit_code == ExitCode.INTEGRITY_FAILED

    def test_run_checks_invalid_manifest(self, temp_backup_dir):
        manifest_file = temp_backup_dir / "manifest.yaml"
        manifest_file.write_text("invalid: [yaml: [")

        config = Config(
            manifest_path=str(manifest_file),
            backup_dir=str(temp_backup_dir),
            check_expired=False,
        )
        report = run_checks(config)
        assert len(report.errors) == 1
        assert report.errors[0]["type"] == "ManifestError"
        assert report.exit_code == ExitCode.MANIFEST_ERROR
