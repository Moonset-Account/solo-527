"""版本对比和变更分组模块。"""

from __future__ import annotations

import re
from typing import Dict, List, Optional, Tuple

from packaging.version import Version, InvalidVersion

from .models import Change, ChangeType, Dependency
from .exceptions import VersionCompareError


def _normalize_version(v: str) -> str:
    """规范化版本字符串，去掉前缀 v。"""
    if isinstance(v, str) and v.startswith(("v", "V")):
        return v[1:]
    return str(v)


def _parse_version(v: str) -> Version:
    """解析版本字符串，尝试多种格式。"""
    normalized = _normalize_version(v)
    try:
        return Version(normalized)
    except InvalidVersion:
        cleaned = re.sub(r"[^0-9.]", ".", normalized)
        cleaned = re.sub(r"\.{2,}", ".", cleaned).strip(".")
        if cleaned:
            try:
                return Version(cleaned)
            except InvalidVersion:
                pass
        digits = re.findall(r"\d+", normalized)
        if digits:
            fallback = ".".join(digits[:3]) if len(digits) >= 3 else ".".join(
                digits + ["0"] * (3 - len(digits))
            )
            try:
                return Version(fallback)
            except InvalidVersion:
                pass
        return Version("0.0.0")


def classify_change(version_before: Optional[str], version_after: Optional[str]) -> ChangeType:
    """根据版本号变化分类变更类型。

    Args:
        version_before: 变更前版本 (None 表示新增)
        version_after: 变更后版本 (None 表示删除)

    Returns:
        ChangeType 枚举值
    """
    if version_before is None:
        return ChangeType.ADDED
    if version_after is None:
        return ChangeType.REMOVED

    try:
        v_before = _parse_version(version_before)
        v_after = _parse_version(version_after)
    except Exception as e:
        raise VersionCompareError(
            f"无法解析版本号: '{version_before}' -> '{version_after}': {e}",
            suggestion="请确保版本号符合 SemVer 或 PEP 440 规范。"
        )

    if v_before == v_after:
        before_norm = _normalize_version(version_before)
        after_norm = _normalize_version(version_after)
        if before_norm != after_norm:
            if any(x in after_norm.lower() for x in ("alpha", "beta", "rc", "pre", "dev")):
                return ChangeType.PRERELEASE
            if "+" in after_norm:
                return ChangeType.BUILD
        return ChangeType.UNKNOWN

    before_rel = v_before.release or (0, 0, 0)
    after_rel = v_after.release or (0, 0, 0)

    before_padded = before_rel + (0,) * max(0, 3 - len(before_rel))
    after_padded = after_rel + (0,) * max(0, 3 - len(after_rel))

    if before_padded[0] != after_padded[0]:
        return ChangeType.MAJOR
    elif before_padded[1] != after_padded[1]:
        return ChangeType.MINOR
    elif before_padded[2] != after_padded[2]:
        return ChangeType.PATCH

    if v_before.pre != v_after.pre or v_before.dev != v_after.dev:
        return ChangeType.PRERELEASE
    if v_before.local != v_after.local:
        return ChangeType.BUILD

    return ChangeType.UNKNOWN


def compute_changes(
    deps_before: Dict[str, Dependency],
    deps_after: Dict[str, Dependency],
) -> List[Change]:
    """计算两组依赖之间的差异。

    Args:
        deps_before: 变更前的依赖字典
        deps_after: 变更后的依赖字典

    Returns:
        Change 对象列表
    """
    changes: List[Change] = []
    all_names = set(deps_before.keys()) | set(deps_after.keys())

    for name in sorted(all_names):
        before = deps_before.get(name)
        after = deps_after.get(name)

        version_before = before.version if before else None
        version_after = after.version if after else None

        change_type = classify_change(version_before, version_after)

        if before and after and version_before == version_after:
            lic_before = before.license.name if before else None
            lic_after = after.license.name if after else None
            if lic_before == lic_after:
                continue

        license_changed = False
        if before and after:
            license_changed = before.license.name != after.license.name

        change = Change(
            name=name,
            change_type=change_type,
            before=before,
            after=after,
            license_changed=license_changed,
        )
        changes.append(change)

    return changes


def group_changes(changes: List[Change]) -> Dict[str, List[Change]]:
    """按变更类型分组。

    Args:
        changes: Change 对象列表

    Returns:
        按 ChangeType 值分组的字典
    """
    groups: Dict[str, List[Change]] = {t.value: [] for t in ChangeType}
    for change in changes:
        groups.setdefault(change.change_type.value, []).append(change)
    return {k: v for k, v in groups.items() if v}
