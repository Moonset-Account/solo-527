"""utils.py 单元测试：跨平台路径、哈希、保留周期、格式化。"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path, PurePosixPath
from tempfile import TemporaryDirectory

import pytest

from backup_checker.utils import (
    compute_file_hash,
    compute_string_hash,
    format_datetime,
    format_retention,
    format_size,
    format_timedelta,
    is_backup_expired,
    is_supported_hash,
    manifest_to_native_path,
    native_to_manifest_path,
    normalize_path,
    parse_retention,
    make_location_hint,
)


# ---------------------------------------------------------------------------
# 哈希
# ---------------------------------------------------------------------------

class TestHash:
    def test_supported_algorithms(self):
        for a in ("md5", "sha1", "sha256", "sha512"):
            assert is_supported_hash(a)
            assert is_supported_hash(a.upper())
        assert not is_supported_hash("crc32")
        assert not is_supported_hash("blake3")

    def test_compute_string_hash_known_values(self):
        # sha256("") 已知
        assert (compute_string_hash("", "sha256")
                == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")
        # md5("hello")
        assert compute_string_hash("hello", "md5") == "5d41402abc4b2a76b9719d911017c592"

    def test_compute_file_hash(self, tmp_path: Path):
        f = tmp_path / "sample.bin"
        f.write_bytes(b"A" * (1024 * 1024 + 17))  # 比默认块大一些
        expected_sha256 = compute_string_hash("A" * (1024 * 1024 + 17), "sha256")
        assert compute_file_hash(f, "sha256") == expected_sha256
        expected_md5 = compute_string_hash("A" * (1024 * 1024 + 17), "md5")
        assert compute_file_hash(f, "md5") == expected_md5

    def test_compute_file_hash_missing(self, tmp_path: Path):
        with pytest.raises(FileNotFoundError):
            compute_file_hash(tmp_path / "nope.bin", "sha256")

    def test_compute_file_hash_unsupported(self, tmp_path: Path):
        f = tmp_path / "x"
        f.write_text("x")
        with pytest.raises(ValueError, match="不支持的哈希算法"):
            compute_file_hash(f, "crc32")


# ---------------------------------------------------------------------------
# 保留周期解析
# ---------------------------------------------------------------------------

class TestRetention:
    @pytest.mark.parametrize("raw,expected", [
        (None, None),
        ("7d", 7),
        ("7D", 7),
        ("14", 14),
        ("  30d  ", 30),
        ("2w", 14),
        ("1m", 30),
        ("1y", 365),
        ("365d", 365),
        (30, 30),
        (90, 90),
    ])
    def test_parse_valid(self, raw, expected):
        assert parse_retention(raw) == expected

    @pytest.mark.parametrize("raw", [
        "",
        "abc",
        "-1d",
        "0d",
        "7x",
        "d7",
        "1.5d",
    ])
    def test_parse_invalid(self, raw):
        with pytest.raises(ValueError):
            parse_retention(raw)

    def test_parse_type_error(self):
        with pytest.raises(TypeError):
            parse_retention(["7d"])  # type: ignore[arg-type]

    @pytest.mark.parametrize("days,expected", [
        (0, "0d"),
        (1, "1d"),
        (7, "1w"),
        (30, "1m"),
        (60, "2m"),
        (365, "1y"),
        (730, "2y"),
        (400, "400d"),  # 不整除
    ])
    def test_format_retention(self, days, expected):
        assert format_retention(days) == expected


# ---------------------------------------------------------------------------
# 过期判断
# ---------------------------------------------------------------------------

class TestExpired:
    def test_not_expired_when_missing_args(self):
        assert is_backup_expired(None, 30)[0] is False
        assert is_backup_expired(datetime.now(timezone.utc), None)[0] is False

    def test_not_expired(self):
        now = datetime.now(timezone.utc)
        created = now - timedelta(days=10)
        expired, delta = is_backup_expired(created, 30, now=now)
        assert expired is False
        assert delta is not None
        assert delta.days == 20

    def test_expired(self):
        now = datetime.now(timezone.utc)
        created = now - timedelta(days=60)
        expired, delta = is_backup_expired(created, 30, now=now)
        assert expired is True
        assert delta is not None
        assert delta.days == 30

    def test_naive_datetime_is_assumed_utc(self):
        # 不带时区的 created_at 视为 UTC
        now = datetime.now(timezone.utc)
        created_naive = (now - timedelta(days=10)).replace(tzinfo=None)
        expired, _ = is_backup_expired(created_naive, 30, now=now)
        assert expired is False


# ---------------------------------------------------------------------------
# 跨平台路径
# ---------------------------------------------------------------------------

class TestPaths:
    def test_normalize_path_url_encoded(self):
        with TemporaryDirectory() as td:
            raw_name = "my backup dir"
            target = Path(td) / raw_name
            target.mkdir()
            # URL 编码 => %20
            p = normalize_path(os.path.join(td, "my%20backup%20dir"))
            assert p.exists()
            assert p == target

    def test_normalize_path_windows_backslash_on_unix(self):
        # 在非 Windows 平台上，将反斜杠视为斜杠
        if os.name != "nt":
            p = normalize_path("data\\config\\app.yaml")
            assert p.parts == ("data", "config", "app.yaml")

    def test_manifest_to_native_relative(self, tmp_path: Path):
        backup_dir = tmp_path / "backup"
        backup_dir.mkdir()
        (backup_dir / "a" / "b.txt").mkdir(parents=True)
        native = manifest_to_native_path("a/b.txt", backup_dir)
        assert native == backup_dir / "a" / "b.txt"

    def test_manifest_to_native_absolute_windows_on_unix(self):
        # 当清单里记录的是 C:/foo/bar 且当前不是 Windows 时，按普通绝对路径处理
        if os.name != "nt":
            backup_dir = Path("/backups/x")
            native = manifest_to_native_path("C:/Windows/System32/drivers/etc/hosts", backup_dir)
            # 预期是一个 Path("C:/Windows/...")
            assert "C:" in str(native) or native.is_absolute()

    def test_manifest_backslash_converted(self, tmp_path: Path):
        backup_dir = tmp_path / "backup"
        backup_dir.mkdir()
        native = manifest_to_native_path("data\\config\\app.yaml", backup_dir)
        # 应当被转换为 data/config/app.yaml
        rel = native.relative_to(backup_dir).as_posix()
        assert rel == "data/config/app.yaml"

    def test_native_to_manifest_relative(self, tmp_path: Path):
        backup_dir = tmp_path / "backup"
        f = backup_dir / "a" / "b" / "c.txt"
        result = native_to_manifest_path(f, backup_dir)
        assert result == "a/b/c.txt"

    def test_native_to_manifest_outside(self, tmp_path: Path):
        backup_dir = tmp_path / "backup"
        outside = tmp_path / "other.txt"
        result = native_to_manifest_path(outside, backup_dir)
        # 绝对路径的 POSIX 形式
        assert result.endswith("other.txt")
        assert "/" in result

    def test_make_location_hint(self, tmp_path: Path):
        f = tmp_path / "x" / "y.txt"
        f.parent.mkdir()
        f.write_text("z")
        hint = make_location_hint(f)
        assert str(f.resolve()) in hint


# ---------------------------------------------------------------------------
# 格式化
# ---------------------------------------------------------------------------

class TestFormat:
    @pytest.mark.parametrize("n,expected", [
        (0, "0 B"),
        (1023, "1023 B"),
        (1024, "1.00 KiB"),
        (1536, "1.50 KiB"),
        (1048576, "1.00 MiB"),
        (1073741824, "1.00 GiB"),
        (None, "-"),
    ])
    def test_format_size(self, n, expected):
        assert format_size(n) == expected

    def test_format_timedelta(self):
        assert format_timedelta(None) == "-"
        assert format_timedelta(timedelta(seconds=0)) == "0s"
        assert format_timedelta(timedelta(seconds=90)) == "1m 30s"
        assert format_timedelta(timedelta(days=2, hours=3, minutes=4, seconds=5)) == "2d 3h 4m 5s"
        # 负数 => 带符号
        s = format_timedelta(timedelta(days=-1))
        assert s.startswith("-")

    def test_format_datetime(self):
        assert format_datetime(None) == "-"
        dt = datetime(2026, 6, 1, 2, 0, 0, tzinfo=timezone.utc)
        s = format_datetime(dt)
        assert "2026" in s and "06-01" in s
