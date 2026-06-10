"""pytest 配置：共享测试夹具。"""
from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Callable, Optional

import pytest


# ---------------------------------------------------------------------------
# 工具函数
# ---------------------------------------------------------------------------

def _hash_bytes(data: bytes, algo: str = "sha256") -> str:
    return hashlib.new(algo, data).hexdigest()


def _write(path: Path, data: bytes | str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, str):
        path.write_text(data, encoding="utf-8")
    else:
        path.write_bytes(data)


# ---------------------------------------------------------------------------
# 夹具：临时备份目录（含真实文件）
# ---------------------------------------------------------------------------

@pytest.fixture
def backup_dir(tmp_path: Path) -> Path:
    """创建包含若干真实文件的备份目录结构。

    结构::

        tmp_path/
            data/
                database.sql.gz  (10 字节)
                users.json       (16 字节)
            config/
                app.yaml         (短文本)
            readme.txt           (短文本)
    """
    base = tmp_path / "backup-2026-06-01"
    _write(base / "data" / "database.sql.gz", b"\x1f\x8b\x08HELLO0000")
    _write(base / "data" / "users.json", '[{"id":1,"name":"A"}]')
    _write(base / "config" / "app.yaml", "app:\n  name: demo\n  port: 8080\n")
    _write(base / "readme.txt", "Backup created at 2026-06-01\n")
    return base


# ---------------------------------------------------------------------------
# 夹具：好的清单（与 backup_dir 完全一致）
# ---------------------------------------------------------------------------

@pytest.fixture
def good_manifest_path(backup_dir: Path, tmp_path: Path) -> Path:
    """生成与 backup_dir 匹配的有效清单（包含所有哈希、大小）。"""
    manifest_path = tmp_path / "manifest-good.json"
    files = []
    for p in sorted(backup_dir.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(backup_dir).as_posix()
        raw = p.read_bytes()
        st = p.stat()
        files.append({
            "path": rel,
            "size": st.st_size,
            "modified": datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat(),
            "hashes": {
                "md5": _hash_bytes(raw, "md5"),
                "sha1": _hash_bytes(raw, "sha1"),
                "sha256": _hash_bytes(raw, "sha256"),
                "sha512": _hash_bytes(raw, "sha512"),
            },
        })
    manifest = {
        "version": "1.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "retention_days": 30,
        "files": files,
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest_path


# ---------------------------------------------------------------------------
# 夹具：有问题的清单（缺文件、坏哈希、大小错）
# ---------------------------------------------------------------------------

@pytest.fixture
def bad_manifest_path(good_manifest_path: Path, backup_dir: Path, tmp_path: Path) -> Path:
    """构造故意包含问题的清单：

    * 多登记一个不存在的文件 -> MISSING_FILE
    * readme.txt 的 sha256 写错 -> HASH_MISMATCH
    * users.json 的 size 故意写错 -> SIZE_MISMATCH
    """
    manifest = json.loads(good_manifest_path.read_text(encoding="utf-8"))
    # 1. 多一个不存在的文件
    manifest["files"].append({
        "path": "data/ghost-file.bin",
        "size": 123,
        "modified": datetime.now(timezone.utc).isoformat(),
        "hashes": {"sha256": _hash_bytes(b"ghost", "sha256")},
    })
    # 2. 改坏 readme.txt 的 sha256
    for f in manifest["files"]:
        if f["path"] == "readme.txt":
            f["hashes"]["sha256"] = "deadbeef" * 8
            break
    # 3. 改坏 users.json 的 size
    for f in manifest["files"]:
        if f["path"] == "data/users.json":
            f["size"] = f["size"] + 999
            break
    path = tmp_path / "manifest-bad.json"
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


# ---------------------------------------------------------------------------
# 夹具：过期清单
# ---------------------------------------------------------------------------

@pytest.fixture
def expired_manifest_path(good_manifest_path: Path, tmp_path: Path) -> Path:
    """修改 created_at 为 90 天前，retention 30 天。"""
    manifest = json.loads(good_manifest_path.read_text(encoding="utf-8"))
    past = datetime.now(timezone.utc) - timedelta(days=90)
    manifest["created_at"] = past.isoformat()
    manifest["retention_days"] = 30
    path = tmp_path / "manifest-expired.json"
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


# ---------------------------------------------------------------------------
# 夹具：格式损坏的 JSON 清单
# ---------------------------------------------------------------------------

@pytest.fixture
def malformed_manifest_path(tmp_path: Path) -> Path:
    p = tmp_path / "manifest-malformed.json"
    p.write_text("{\"version\":\"1.0\", \"files\": [this is not valid json}", encoding="utf-8")
    return p


# ---------------------------------------------------------------------------
# 夹具：Windows 风格路径清单（用于跨平台测试）
# ---------------------------------------------------------------------------

@pytest.fixture
def windows_style_manifest_path(good_manifest_path: Path, tmp_path: Path) -> Path:
    """将清单中所有 path 的斜杠替换为反斜杠。"""
    manifest = json.loads(good_manifest_path.read_text(encoding="utf-8"))
    for f in manifest["files"]:
        f["path"] = f["path"].replace("/", "\\")
    path = tmp_path / "manifest-windows-paths.json"
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


# ---------------------------------------------------------------------------
# 夹具：未来创建时间清单（不会过期）
# ---------------------------------------------------------------------------

@pytest.fixture
def future_manifest_path(good_manifest_path: Path, tmp_path: Path) -> Path:
    manifest = json.loads(good_manifest_path.read_text(encoding="utf-8"))
    future = datetime.now(timezone.utc) + timedelta(days=1)
    manifest["created_at"] = future.isoformat()
    manifest["retention_days"] = 365
    path = tmp_path / "manifest-future.json"
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


# ---------------------------------------------------------------------------
# 辅助夹具：CLI 调用封装
# ---------------------------------------------------------------------------

@pytest.fixture
def run_cli(capsys):
    """封装 backup_checker.cli:main 的调用，返回 (exit_code, stdout, stderr)。"""

    from backup_checker.cli import main as _main

    def _run(*args: str) -> tuple[int, str, str]:
        try:
            code = _main(list(args))
        except SystemExit as exc:
            code = int(exc.code) if exc.code is not None else 0
        captured = capsys.readouterr()
        return code, captured.out, captured.err

    return _run


# ---------------------------------------------------------------------------
# 辅助夹具：确保 CWD 干净
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _clean_env(monkeypatch, tmp_path: Path):
    """隔离环境变量与 CWD。"""
    monkeypatch.chdir(tmp_path)
    # 去除可能干扰的 env
    for k in list(os.environ):
        if k.startswith("BACKUP_CHECKER"):
            monkeypatch.delenv(k, raising=False)
