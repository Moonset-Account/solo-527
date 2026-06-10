"""清单文件解析与加载，支持 JSON（YAML 可选）。"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional

from .models import Manifest, ManifestFile, CheckIssue, IssueType, IssueSeverity
from .utils import make_location_hint


def _parse_manifest_file_entry(entry: dict[str, Any], index: int) -> tuple[Optional[ManifestFile], list[CheckIssue]]:
    """解析清单 files 中的单个条目，返回 (条目或None, 问题列表)。"""
    issues: list[CheckIssue] = []
    if not isinstance(entry, dict):
        issues.append(CheckIssue(
            type=IssueType.MANIFEST_ERROR,
            severity=IssueSeverity.ERROR,
            message=f"清单 files[{index}] 不是对象（实际类型：{type(entry).__name__}）",
            location=f"files[{index}]",
        ))
        return None, issues

    path_val = entry.get("path")
    if not isinstance(path_val, str) or not path_val.strip():
        issues.append(CheckIssue(
            type=IssueType.MANIFEST_ERROR,
            severity=IssueSeverity.ERROR,
            message=f"清单 files[{index}] 缺少有效的 'path' 字段",
            location=f"files[{index}].path",
            expected="非空字符串",
            actual=str(path_val),
        ))
        return None, issues

    hashes_raw = entry.get("hashes") or {}
    if not isinstance(hashes_raw, dict):
        issues.append(CheckIssue(
            type=IssueType.MANIFEST_ERROR,
            severity=IssueSeverity.WARNING,
            message=f"清单 files[{index}].hashes 不是对象，已忽略",
            location=f"files[{index}].hashes",
        ))
        hashes_raw = {}

    normalized_hashes: dict[str, str] = {}
    for k, v in hashes_raw.items():
        if isinstance(k, str) and isinstance(v, str):
            normalized_hashes[k.lower()] = v.strip().lower()

    size_val = entry.get("size")
    size: Optional[int] = None
    if isinstance(size_val, int) and size_val >= 0:
        size = size_val
    elif isinstance(size_val, str) and size_val.isdigit():
        size = int(size_val)

    modified = entry.get("modified")
    if modified is not None and not isinstance(modified, str):
        modified = str(modified)

    mf = ManifestFile(
        path=path_val.strip(),
        size=size,
        modified=modified,
        hashes=normalized_hashes,
    )
    return mf, issues


def load_manifest(path: Path) -> tuple[Optional[Manifest], list[CheckIssue]]:
    """加载并解析清单文件。

    返回 (manifest 对象, 解析过程中的问题列表)。
    manifest 可能为 None（文件不存在/完全无法解析）。
    """
    issues: list[CheckIssue] = []
    location = make_location_hint(path)

    if not path.exists():
        issues.append(CheckIssue(
            type=IssueType.MANIFEST_ERROR,
            severity=IssueSeverity.CRITICAL,
            message=f"清单文件不存在：{path}",
            location=location,
        ))
        return None, issues
    if not path.is_file():
        issues.append(CheckIssue(
            type=IssueType.MANIFEST_ERROR,
            severity=IssueSeverity.CRITICAL,
            message=f"清单路径不是常规文件：{path}",
            location=location,
        ))
        return None, issues

    # YAML 支持（可选依赖）
    suffix = path.suffix.lower()
    try:
        raw_text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        issues.append(CheckIssue(
            type=IssueType.MANIFEST_ERROR,
            severity=IssueSeverity.CRITICAL,
            message=f"清单文件不是 UTF-8 编码：{exc}",
            location=location,
        ))
        return None, issues
    except OSError as exc:
        issues.append(CheckIssue(
            type=IssueType.MANIFEST_ERROR,
            severity=IssueSeverity.CRITICAL,
            message=f"读取清单文件失败：{exc}",
            location=location,
        ))
        return None, issues

    raw: Any
    if suffix in (".yaml", ".yml"):
        try:
            import yaml  # type: ignore
        except ImportError:
            issues.append(CheckIssue(
                type=IssueType.MANIFEST_ERROR,
                severity=IssueSeverity.ERROR,
                message="解析 YAML 清单需要 PyYAML，请先 'pip install pyyaml'，或改用 JSON 格式",
                location=location,
            ))
            return None, issues
        try:
            raw = yaml.safe_load(raw_text)
        except yaml.YAMLError as exc:  # type: ignore
            issues.append(CheckIssue(
                type=IssueType.MANIFEST_ERROR,
                severity=IssueSeverity.CRITICAL,
                message=f"解析 YAML 清单失败：{exc}",
                location=location,
            ))
            return None, issues
    else:
        try:
            raw = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            # 给出行号定位
            line_info = f"第 {exc.lineno} 行第 {exc.colno} 列（字符 {exc.pos}）"
            issues.append(CheckIssue(
                type=IssueType.MANIFEST_ERROR,
                severity=IssueSeverity.CRITICAL,
                message=f"解析 JSON 清单失败：{exc.msg}（{line_info}）",
                location=location,
            ))
            return None, issues

    if not isinstance(raw, dict):
        issues.append(CheckIssue(
            type=IssueType.MANIFEST_ERROR,
            severity=IssueSeverity.CRITICAL,
            message=f"清单根节点必须是对象，实际为 {type(raw).__name__}",
            location=location,
        ))
        return None, issues

    manifest = Manifest(
        version=str(raw.get("version", "1.0")),
        created_at=_as_str_or_none(raw.get("created_at")),
        retention_days=_as_int_or_none(raw.get("retention_days")),
        raw=raw,
    )

    files_raw = raw.get("files", [])
    if not isinstance(files_raw, list):
        issues.append(CheckIssue(
            type=IssueType.MANIFEST_ERROR,
            severity=IssueSeverity.CRITICAL,
            message=f"'files' 字段必须是数组，实际为 {type(files_raw).__name__}",
            location="files",
        ))
        files_raw = []

    for idx, entry in enumerate(files_raw):
        mf, entry_issues = _parse_manifest_file_entry(entry, idx)
        issues.extend(entry_issues)
        if mf is not None:
            manifest.files.append(mf)

    return manifest, issues


# ---------------------------------------------------------------------------
# 辅助函数
# ---------------------------------------------------------------------------

def _as_str_or_none(v: Any) -> Optional[str]:
    if v is None:
        return None
    if isinstance(v, str):
        return v if v.strip() else None
    return str(v)


def _as_int_or_none(v: Any) -> Optional[int]:
    if v is None:
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, int):
        return v if v >= 0 else None
    if isinstance(v, str) and v.strip().isdigit():
        return int(v.strip())
    return None
