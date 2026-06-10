"""manifest.py 单元测试：清单解析、错误定位。"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from backup_checker.manifest import load_manifest
from backup_checker.models import IssueSeverity, IssueType


class TestLoadManifest:
    def test_load_good(self, good_manifest_path: Path):
        manifest, issues = load_manifest(good_manifest_path)
        assert manifest is not None
        assert manifest.version == "1.0"
        assert manifest.retention_days == 30
        assert manifest.created_datetime is not None
        # 4 个文件
        assert len(manifest.files) == 4
        for f in manifest.files:
            assert f.size is not None
            assert "sha256" in f.hashes
        # 解析问题应当为空
        assert not any(i.severity in (IssueSeverity.ERROR, IssueSeverity.CRITICAL)
                       for i in issues)

    def test_load_not_found(self, tmp_path: Path):
        manifest, issues = load_manifest(tmp_path / "nope.json")
        assert manifest is None
        assert any(i.type == IssueType.MANIFEST_ERROR
                   and i.severity == IssueSeverity.CRITICAL
                   for i in issues)

    def test_load_malformed_json(self, malformed_manifest_path: Path):
        manifest, issues = load_manifest(malformed_manifest_path)
        assert manifest is None
        assert len(issues) == 1
        assert issues[0].type == IssueType.MANIFEST_ERROR
        assert issues[0].severity == IssueSeverity.CRITICAL
        # 错误消息中应该给出位置信息（JSONDecodeError 的行号等）
        assert "第" in issues[0].message or "line" in issues[0].message.lower() or "解析 JSON" in issues[0].message

    def test_load_not_object(self, tmp_path: Path):
        p = tmp_path / "arr.json"
        p.write_text(json.dumps([1, 2, 3]), encoding="utf-8")
        manifest, issues = load_manifest(p)
        assert manifest is None
        assert any(i.type == IssueType.MANIFEST_ERROR for i in issues)

    def test_load_files_not_list(self, tmp_path: Path):
        p = tmp_path / "x.json"
        p.write_text(json.dumps({"version": "1.0", "files": "not a list"}), encoding="utf-8")
        manifest, issues = load_manifest(p)
        assert manifest is not None
        assert any(i.type == IssueType.MANIFEST_ERROR for i in issues)
        assert len(manifest.files) == 0

    def test_load_files_entry_missing_path(self, tmp_path: Path):
        p = tmp_path / "x.json"
        p.write_text(json.dumps({
            "version": "1.0",
            "files": [
                {"size": 10},           # 没有 path
                {"path": "a.txt", "size": 1},
                {"path": "", "size": 2},  # 空 path
                "not a dict",           # 不是对象
            ],
        }), encoding="utf-8")
        manifest, issues = load_manifest(p)
        assert manifest is not None
        # 有效条目只有 1 个
        assert len(manifest.files) == 1
        assert manifest.files[0].path == "a.txt"
        # 应该有 3 个错误
        criticals = [i for i in issues if i.severity in (IssueSeverity.ERROR, IssueSeverity.CRITICAL)]
        assert len(criticals) == 3
        # 每个错误都带有 location 定位
        for c in criticals:
            assert c.location is not None

    def test_load_bad_hashes_warn(self, tmp_path: Path):
        p = tmp_path / "x.json"
        p.write_text(json.dumps({
            "version": "1.0",
            "files": [{
                "path": "a.bin",
                "size": 0,
                "hashes": ["not", "a", "dict"],
            }],
        }), encoding="utf-8")
        manifest, issues = load_manifest(p)
        assert manifest is not None
        assert len(manifest.files) == 1
        assert manifest.files[0].hashes == {}
        assert any(i.severity == IssueSeverity.WARNING for i in issues)
