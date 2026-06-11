"""Core business logic for backup integrity checking.

Provides functions for:
- Manifest parsing and validation
- File hash computation
- Integrity verification
- Missing file detection
- Expired backup detection
"""

from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml
from dateutil import parser as date_parser
from jsonschema import ValidationError as JSONSchemaValidationError
from jsonschema import validate as json_validate

from .config import MANIFEST_SCHEMA, SUPPORTED_HASH_ALGORITHMS, Config
from .exceptions import (
    ExitCode,
    HashAlgorithmError,
    ManifestError,
)


@dataclass
class FileEntry:
    """Represents a file entry in the manifest."""

    path: str
    hash: str
    size: int | None = None
    created_at: str | None = None
    modified_at: str | None = None
    permissions: str | None = None
    owner: str | None = None
    group: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> FileEntry:
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


@dataclass
class Manifest:
    """Represents a backup manifest file."""

    files: list[FileEntry]
    version: str | None = None
    created_at: str | None = None
    backup_id: str | None = None
    description: str | None = None
    hash_algorithm: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "version": self.version,
            "created_at": self.created_at,
            "backup_id": self.backup_id,
            "description": self.description,
            "hash_algorithm": self.hash_algorithm,
            "files": [f.to_dict() for f in self.files],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Manifest:
        return cls(
            version=data.get("version"),
            created_at=data.get("created_at"),
            backup_id=data.get("backup_id"),
            description=data.get("description"),
            hash_algorithm=data.get("hash_algorithm"),
            files=[FileEntry.from_dict(f) for f in data.get("files", [])],
        )


@dataclass
class CheckResult:
    """Result of an integrity check for a single file."""

    path: str
    status: str
    expected_hash: str
    actual_hash: str | None = None
    size: int | None = None
    error: str | None = None
    details: dict[str, Any] = field(default_factory=dict)

    @property
    def is_ok(self) -> bool:
        return self.status == "ok"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class CheckSummary:
    """Summary of all check results."""

    total: int = 0
    passed: int = 0
    failed: int = 0
    skipped: int = 0
    missing: int = 0
    expired: int = 0
    integrity_errors: int = 0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class CheckReport:
    """Complete check report."""

    manifest: Manifest | None = None
    summary: CheckSummary = field(default_factory=CheckSummary)
    integrity_results: list[CheckResult] = field(default_factory=list)
    missing_files: list[dict[str, Any]] = field(default_factory=list)
    expired_backups: list[dict[str, Any]] = field(default_factory=list)
    errors: list[dict[str, Any]] = field(default_factory=list)
    notification_results: list[dict[str, Any]] = field(default_factory=list)
    config: dict[str, Any] = field(default_factory=dict)
    started_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: str | None = None
    duration_seconds: float | None = None
    exit_code: int = 0
    dry_run: bool = False

    @property
    def has_errors(self) -> bool:
        return any([
            self.summary.failed > 0,
            self.summary.missing > 0,
            self.summary.expired > 0,
            self.errors,
        ])

    def to_dict(self) -> dict[str, Any]:
        return {
            "manifest": self.manifest.to_dict() if self.manifest else None,
            "summary": self.summary.to_dict(),
            "integrity_results": [r.to_dict() for r in self.integrity_results],
            "missing_files": self.missing_files,
            "expired_backups": self.expired_backups,
            "errors": self.errors,
            "notification_results": self.notification_results,
            "config": self.config,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "duration_seconds": self.duration_seconds,
            "exit_code": self.exit_code,
            "dry_run": self.dry_run,
        }

    def set_exit_code(self, config: Config) -> None:
        """Determine and set the exit code based on results and configuration."""
        integrity_failed = self.summary.integrity_errors > 0 and config.fail_on_integrity
        missing_files = self.summary.missing > 0 and config.fail_on_missing
        expired_backups = self.summary.expired > 0 and config.fail_on_expired
        manifest_error = any(e.get("type") == "ManifestError" for e in self.errors)
        config_error = any(e.get("type") == "ConfigError" for e in self.errors)
        notification_error = any(e.get("type") == "NotificationError" for e in self.errors)

        self.exit_code = int(ExitCode.from_errors(
            integrity_failed=integrity_failed,
            missing_files=missing_files,
            expired_backups=expired_backups,
            manifest_error=manifest_error,
            config_error=config_error,
            notification_error=notification_error,
        ))


def parse_manifest(manifest_path: str, logger: logging.Logger | None = None) -> Manifest:
    """Parse and validate a manifest file.

    Args:
        manifest_path: Path to the manifest file (YAML or JSON)
        logger: Optional logger instance

    Returns:
        Parsed Manifest object

    Raises:
        ManifestError: If the manifest file cannot be parsed or is invalid
    """
    path = Path(manifest_path)

    if logger:
        logger.debug(f"Parsing manifest: {path}")

    if not path.exists():
        raise ManifestError(
            f"Manifest file not found: {path}",
            details={"manifest_path": str(path)},
        )

    try:
        with open(path, encoding="utf-8") as f:
            if path.suffix.lower() in (".yaml", ".yml"):
                data = yaml.safe_load(f)
            elif path.suffix.lower() == ".json":
                data = json.load(f)
            else:
                raise ManifestError(
                    f"Unsupported manifest format: {path.suffix}. Use .yaml, .yml, or .json",
                    details={"path": str(path), "supported": [".yaml", ".yml", ".json"]},
                )
    except yaml.YAMLError as e:
        raise ManifestError(
            f"Invalid YAML in manifest: {e}",
            details={"path": str(path)},
        ) from e
    except json.JSONDecodeError as e:
        raise ManifestError(
            f"Invalid JSON in manifest: {e}",
            details={"path": str(path)},
        ) from e
    except OSError as e:
        raise ManifestError(
            f"Cannot read manifest file: {e}",
            details={"path": str(path)},
        ) from e

    if not isinstance(data, dict):
        raise ManifestError(
            "Manifest must be a JSON/YAML object",
            details={"path": str(path)},
        )

    try:
        json_validate(instance=data, schema=MANIFEST_SCHEMA)
    except JSONSchemaValidationError as e:
        raise ManifestError(
            f"Manifest validation failed: {e.message}",
            details={"path": str(path), "schema_error": e.message, "path_in_schema": list(e.absolute_path)},
        ) from e

    if logger:
        logger.info(f"Manifest parsed successfully: {len(data.get('files', []))} files")

    return Manifest.from_dict(data)


def compute_file_hash(file_path: str, algorithm: str = "sha256", chunk_size: int = 65536) -> str:
    """Compute the hash of a file.

    Args:
        file_path: Path to the file
        algorithm: Hash algorithm to use (sha256, sha512, md5, etc.)
        chunk_size: Chunk size for reading large files

    Returns:
        Hexadecimal hash string

    Raises:
        HashAlgorithmError: If the algorithm is not supported
        IOError: If the file cannot be read
    """
    if algorithm not in SUPPORTED_HASH_ALGORITHMS:
        raise HashAlgorithmError(
            f"Unsupported hash algorithm: {algorithm}",
            details={"algorithm": algorithm, "supported": sorted(SUPPORTED_HASH_ALGORITHMS)},
        )

    hasher = hashlib.new(algorithm)
    with open(file_path, "rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            hasher.update(chunk)
    return hasher.hexdigest()


def _resolve_file_path(manifest_path: str, backup_dir: str | None, file_entry_path: str) -> Path:
    """Resolve the actual file path from manifest and backup directory."""
    entry_path = Path(file_entry_path)
    if backup_dir:
        backup_path = Path(backup_dir)
        if entry_path.is_absolute():
            relative = entry_path.relative_to(entry_path.root)
            return backup_path / relative
        return backup_path / entry_path
    else:
        manifest_parent = Path(manifest_path).parent
        if entry_path.is_absolute():
            return entry_path
        return manifest_parent / entry_path


def check_file_integrity(
    file_entry: FileEntry,
    resolved_path: Path,
    algorithm: str,
    logger: logging.Logger | None = None,
) -> CheckResult:
    """Check the integrity of a single file.

    Args:
        file_entry: File entry from manifest
        resolved_path: Actual path to the file on disk
        algorithm: Hash algorithm to use
        logger: Optional logger instance

    Returns:
        CheckResult with status, hashes, and any errors
    """
    result = CheckResult(
        path=file_entry.path,
        status="pending",
        expected_hash=file_entry.hash,
    )

    if not resolved_path.exists():
        result.status = "missing"
        result.error = "File not found"
        if logger:
            logger.warning(f"File missing: {resolved_path}", extra={"file": file_entry.path})
        return result

    if not resolved_path.is_file():
        result.status = "error"
        result.error = "Not a regular file"
        if logger:
            logger.warning(f"Not a file: {resolved_path}", extra={"file": file_entry.path})
        return result

    try:
        actual_hash = compute_file_hash(str(resolved_path), algorithm)
        result.actual_hash = actual_hash
        result.size = resolved_path.stat().st_size

        if actual_hash.lower() == file_entry.hash.lower():
            result.status = "ok"
            if logger:
                logger.debug(f"Integrity OK: {file_entry.path}", extra={"hash": actual_hash})
        else:
            result.status = "hash_mismatch"
            result.error = f"Hash mismatch: expected {file_entry.hash}, got {actual_hash}"
            result.details = {
                "expected_hash": file_entry.hash,
                "actual_hash": actual_hash,
                "size": result.size,
            }
            if logger:
                logger.error(
                    f"Hash mismatch: {file_entry.path}",
                    extra={
                        "expected": file_entry.hash,
                        "actual": actual_hash,
                    },
                )
    except OSError as e:
        result.status = "error"
        result.error = f"Cannot read file: {e}"
        if logger:
            logger.error(
                f"Cannot read file: {file_entry.path}",
                extra={"error": str(e)},
            )
    except HashAlgorithmError as e:
        result.status = "error"
        result.error = str(e)
        if logger:
            logger.error(
                f"Hash algorithm error: {file_entry.path}",
                extra={"error": str(e)},
            )

    return result


def check_integrity(
    manifest: Manifest,
    manifest_path: str,
    config: Config,
    logger: logging.Logger | None = None,
) -> list[CheckResult]:
    """Check integrity of all files in the manifest.

    Args:
        manifest: Parsed manifest object
        manifest_path: Path to the manifest file (for resolving relative paths)
        config: Configuration object
        logger: Optional logger instance

    Returns:
        List of CheckResult objects for each file
    """
    if logger:
        logger.info("Starting integrity check...")

    algorithm = manifest.hash_algorithm or config.hash_algorithm
    results = []

    for i, file_entry in enumerate(manifest.files, 1):
        if logger:
            logger.debug(f"Checking file {i}/{len(manifest.files)}: {file_entry.path}")

        resolved_path = _resolve_file_path(manifest_path, config.backup_dir, file_entry.path)
        result = check_file_integrity(file_entry, resolved_path, algorithm, logger)
        results.append(result)

    if logger:
        passed = sum(1 for r in results if r.is_ok)
        logger.info(f"Integrity check complete: {passed}/{len(results)} files passed")

    return results


def detect_missing_files(
    manifest: Manifest,
    integrity_results: list[CheckResult],
    logger: logging.Logger | None = None,
) -> list[dict[str, Any]]:
    """Detect missing files from integrity check results.

    Args:
        manifest: Parsed manifest object
        integrity_results: Results from integrity check
        logger: Optional logger instance

    Returns:
        List of missing file details
    """
    missing = []
    for result in integrity_results:
        if result.status == "missing":
            missing.append({
                "path": result.path,
                "error": result.error or "File not found",
                "expected_hash": result.expected_hash,
            })

    if logger and missing:
        logger.warning(f"Detected {len(missing)} missing files")

    return missing


def _parse_date(date_str: str) -> datetime | None:
    """Parse a date string in various formats."""
    try:
        return date_parser.parse(date_str)
    except (ValueError, TypeError):
        return None


def detect_expired_backups(
    manifest: Manifest,
    manifest_path: str,
    retention_days: int,
    logger: logging.Logger | None = None,
) -> list[dict[str, Any]]:
    """Detect expired backups based on retention policy.

    Args:
        manifest: Parsed manifest object
        manifest_path: Path to the manifest file
        retention_days: Number of days to retain backups
        logger: Optional logger instance

    Returns:
        List of expired backup details
    """
    if logger:
        logger.info(f"Checking for expired backups (retention: {retention_days} days)")

    expired = []
    now = datetime.now(timezone.utc)

    manifest_dates = []
    if manifest.created_at:
        manifest_dates.append(("manifest", manifest.created_at))

    manifest_stat = Path(manifest_path).stat()
    manifest_dates.append(("manifest_mtime", datetime.fromtimestamp(manifest_stat.st_mtime, tz=timezone.utc).isoformat()))

    entry_dates = []
    for file_entry in manifest.files:
        if file_entry.created_at:
            entry_dates.append((file_entry.path, file_entry.created_at))
        if file_entry.modified_at:
            entry_dates.append((file_entry.path, file_entry.modified_at))

    all_dates = manifest_dates + entry_dates

    for source, date_str in all_dates:
        parsed = _parse_date(date_str if isinstance(date_str, str) else date_str.isoformat())
        if parsed is None:
            continue
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)

        age_days = (now - parsed).days
        if age_days > retention_days:
            expired.append({
                "source": source,
                "date": date_str if isinstance(date_str, str) else date_str.isoformat(),
                "age_days": age_days,
                "retention_days": retention_days,
                "expired_by_days": age_days - retention_days,
            })

    expired = list({e["source"] + e["date"]: e for e in expired}.values())

    if logger:
        if expired:
            logger.warning(f"Detected {len(expired)} expired items")
        else:
            logger.info("No expired backups detected")

    return expired


def run_checks(
    config: Config,
    logger: logging.Logger | None = None,
) -> CheckReport:
    """Run all configured checks and generate a report.

    Args:
        config: Configuration object
        logger: Optional logger instance

    Returns:
        Complete CheckReport with all results
    """
    if not config.manifest_path:
        raise ManifestError("Manifest path is required", details={})

    report = CheckReport()
    report.config = config.to_dict()
    start_time = datetime.now(timezone.utc)

    try:
        manifest = parse_manifest(config.manifest_path, logger)
        report.manifest = manifest

        algorithm = manifest.hash_algorithm or config.hash_algorithm
        if logger:
            logger.info(f"Using hash algorithm: {algorithm}")

        integrity_results = []
        if config.check_integrity:
            integrity_results = check_integrity(manifest, config.manifest_path, config, logger)
            report.integrity_results = integrity_results

            passed = sum(1 for r in integrity_results if r.is_ok)
            failed = sum(1 for r in integrity_results if not r.is_ok and r.status != "missing")
            missing = sum(1 for r in integrity_results if r.status == "missing")
            skipped = sum(1 for r in integrity_results if r.status == "skipped")

            report.summary.total = len(integrity_results)
            report.summary.passed = passed
            report.summary.failed = failed
            report.summary.skipped = skipped
            report.summary.missing = missing
            report.summary.integrity_errors = failed

            if config.check_missing:
                report.missing_files = detect_missing_files(manifest, integrity_results, logger)
        else:
            if logger:
                logger.info("Integrity check skipped by configuration")
            report.summary.total = len(manifest.files)
            report.summary.skipped = len(manifest.files)

        if config.check_missing and not config.check_integrity:
            if logger:
                logger.info("Checking for missing files without integrity check")
            missing_files = []
            for file_entry in manifest.files:
                resolved_path = _resolve_file_path(config.manifest_path, config.backup_dir, file_entry.path)
                if not resolved_path.exists():
                    missing_files.append({
                        "path": file_entry.path,
                        "error": "File not found",
                        "expected_hash": file_entry.hash,
                    })
            report.missing_files = missing_files
            report.summary.missing = len(missing_files)

        if config.check_expired:
            report.expired_backups = detect_expired_backups(
                manifest, config.manifest_path, config.retention_days, logger
            )
            report.summary.expired = len(report.expired_backups)

    except ManifestError as e:
        report.errors.append(e.to_dict())
        if logger:
            logger.error(f"Manifest error: {e}")
    except Exception as e:
        error_dict = {
            "type": type(e).__name__,
            "message": str(e),
            "exit_code": getattr(e, "exit_code", 1),
        }
        report.errors.append(error_dict)
        if logger:
            logger.exception(f"Unexpected error during checks: {e}")

    end_time = datetime.now(timezone.utc)
    report.completed_at = end_time.isoformat()
    report.duration_seconds = (end_time - start_time).total_seconds()

    report.set_exit_code(config)

    if logger:
        logger.info(
            "Check summary",
            extra={
                "total": report.summary.total,
                "passed": report.summary.passed,
                "failed": report.summary.failed,
                "missing": report.summary.missing,
                "expired": report.summary.expired,
                "skipped": report.summary.skipped,
                "exit_code": report.exit_code,
            },
        )

    return report


def generate_manifest(
    backup_dir: str,
    output_path: str,
    algorithm: str = "sha256",
    include_hidden: bool = False,
    dry_run: bool = False,
    logger: logging.Logger | None = None,
) -> Manifest:
    """Generate a manifest file for a backup directory.

    Args:
        backup_dir: Directory to scan
        output_path: Path to write the manifest
        algorithm: Hash algorithm to use
        include_hidden: Include hidden files
        dry_run: Don't write the manifest file
        logger: Optional logger instance

    Returns:
        Generated Manifest object
    """
    backup_path = Path(backup_dir)
    if not backup_path.is_dir():
        raise ManifestError(f"Backup directory not found: {backup_dir}")

    if logger:
        logger.info(f"Generating manifest for: {backup_dir}")

    files: list[FileEntry] = []
    pattern = "**/*" if include_hidden else "**/[!.]*"

    for file_path in sorted(backup_path.glob(pattern)):
        if file_path.is_file():
            try:
                relative_path = str(file_path.relative_to(backup_path))
                file_hash = compute_file_hash(str(file_path), algorithm)
                stat = file_path.stat()

                entry = FileEntry(
                    path=relative_path,
                    hash=file_hash,
                    size=stat.st_size,
                    created_at=datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat(),
                    modified_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                )
                files.append(entry)

                if logger:
                    logger.debug(f"Added to manifest: {relative_path}", extra={"hash": file_hash, "size": stat.st_size})
            except OSError as e:
                if logger:
                    logger.warning(f"Cannot process file {file_path}: {e}")

    manifest = Manifest(
        version="1.0",
        created_at=datetime.now(timezone.utc).isoformat(),
        hash_algorithm=algorithm,
        files=files,
    )

    if not dry_run:
        output = Path(output_path)
        if output.suffix.lower() in (".yaml", ".yml"):
            with open(output, "w", encoding="utf-8") as f:
                yaml.dump(manifest.to_dict(), f, default_flow_style=False, sort_keys=False)
        elif output.suffix.lower() == ".json":
            with open(output, "w", encoding="utf-8") as f:
                json.dump(manifest.to_dict(), f, indent=2, default=str)
        else:
            raise ManifestError(
                f"Unsupported manifest output format: {output.suffix}",
                details={"supported": [".yaml", ".yml", ".json"]},
            )

        if logger:
            logger.info(f"Manifest written to: {output_path} ({len(files)} files)")
    else:
        if logger:
            logger.info(f"Dry run: would write {len(files)} entries to {output_path}")

    return manifest
