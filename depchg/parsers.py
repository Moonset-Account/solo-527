"""锁文件解析模块。

支持解析:
- package-lock.json (npm)
- pnpm-lock.yaml (pnpm)
- requirements.txt / requirements.lock (pip)
"""

from __future__ import annotations

import json
import re
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import yaml

from .models import Dependency, LicenseInfo
from .exceptions import LockfileParseError


def detect_lockfile_type(filepath: str) -> str:
    """根据文件名检测锁文件类型。

    Args:
        filepath: 锁文件路径

    Returns:
        锁文件类型标识: 'npm', 'pnpm', 'pip', 或 'unknown'

    Raises:
        LockfileParseError: 文件不存在时抛出
    """
    path = Path(filepath)
    if not path.exists():
        raise LockfileParseError(
            f"锁文件不存在: {filepath}",
            suggestion=f"请确认路径是否正确，文件是否可读。当前工作目录: {os.getcwd()}"
        )

    name = path.name.lower()
    if name == "package-lock.json":
        return "npm"
    elif name == "pnpm-lock.yaml":
        return "pnpm"
    elif name in ("requirements.txt", "requirements.lock"):
        return "pip"
    elif name.endswith(".lock") and "requirements" in name:
        return "pip"
    else:
        suffix = path.suffix.lower()
        if suffix == ".json":
            content = path.read_text(encoding="utf-8")
            try:
                data = json.loads(content)
                if "packages" in data or "dependencies" in data:
                    return "npm"
            except json.JSONDecodeError:
                pass
        elif suffix in (".yaml", ".yml"):
            content = path.read_text(encoding="utf-8")
            try:
                data = yaml.safe_load(content)
                if isinstance(data, dict) and "packages" in data:
                    return "pnpm"
            except yaml.YAMLError:
                pass
        elif suffix == ".txt":
            content = path.read_text(encoding="utf-8")
            if re.search(r"^[A-Za-z0-9_.\-]+[<>=!~]", content, re.MULTILINE):
                return "pip"

    return "unknown"


def parse_lockfile(filepath: str) -> Tuple[str, Dict[str, Dependency]]:
    """解析锁文件，返回依赖字典。

    Args:
        filepath: 锁文件路径

    Returns:
        (ecosystem类型, {依赖名: Dependency对象})

    Raises:
        LockfileParseError: 解析失败时抛出
    """
    lockfile_type = detect_lockfile_type(filepath)

    parsers = {
        "npm": _parse_package_lock,
        "pnpm": _parse_pnpm_lock,
        "pip": _parse_requirements,
    }

    parser = parsers.get(lockfile_type)
    if parser is None:
        raise LockfileParseError(
            f"无法识别的锁文件类型: {filepath}",
            suggestion="支持的文件类型: package-lock.json, pnpm-lock.yaml, requirements.txt(.lock)。"
                       "请检查文件格式是否正确。"
        )

    try:
        deps = parser(filepath)
        ecosystem = lockfile_type
        return ecosystem, deps
    except (json.JSONDecodeError, yaml.YAMLError) as e:
        raise LockfileParseError(
            f"解析 {filepath} 时格式错误: {e}",
            suggestion="请检查锁文件内容是否完整、格式是否正确。可能是文件被截断或损坏。"
        ) from e
    except Exception as e:
        if isinstance(e, LockfileParseError):
            raise
        raise LockfileParseError(
            f"解析 {filepath} 时发生未知错误: {type(e).__name__}: {e}",
            suggestion="如果问题持续，请检查 Python 版本 (>=3.9) 和依赖是否完整安装。"
        ) from e


def _parse_license(license_data) -> LicenseInfo:
    """将各种格式的许可证数据转换为LicenseInfo对象。"""
    if license_data is None:
        return LicenseInfo()

    if isinstance(license_data, str):
        return LicenseInfo(name=license_data, identifier=license_data)

    if isinstance(license_data, dict):
        name = license_data.get("type") or license_data.get("name") or "UNKNOWN"
        identifier = license_data.get("identifier") or license_data.get("spdx")
        url = license_data.get("url")
        return LicenseInfo(name=name, identifier=identifier, url=url)

    if isinstance(license_data, list):
        names = []
        for item in license_data:
            if isinstance(item, str):
                names.append(item)
            elif isinstance(item, dict):
                names.append(item.get("type") or item.get("name") or "UNKNOWN")
        combined = " OR ".join(filter(None, names)) if names else "UNKNOWN"
        return LicenseInfo(name=combined, identifier=combined)

    return LicenseInfo(name=str(license_data))


def _parse_package_lock(filepath: str) -> Dict[str, Dependency]:
    """解析 package-lock.json。"""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    deps: Dict[str, Dependency] = {}

    if "packages" in data:
        for pkg_path, pkg_info in data["packages"].items():
            if not pkg_path:
                continue

            name = pkg_info.get("name")
            if name is None:
                match = re.search(r"node_modules/(.+)$", pkg_path)
                if match:
                    name = match.group(1)
                else:
                    continue

            version = pkg_info.get("version", "")
            if not version:
                continue

            license_info = _parse_license(pkg_info.get("license"))
            direct = pkg_info.get("dev", False) is False and pkg_info.get("peer", False) is False

            dep = Dependency(
                name=name,
                version=version,
                license=license_info,
                direct=direct,
                ecosystem="npm",
            )
            deps[name] = dep
    elif "dependencies" in data:
        for name, dep_info in data["dependencies"].items():
            version = dep_info.get("version", "")
            if not version:
                continue

            license_info = _parse_license(dep_info.get("license"))
            dep = Dependency(
                name=name,
                version=version,
                license=license_info,
                direct=True,
                ecosystem="npm",
            )
            deps[name] = dep

    if not deps:
        raise LockfileParseError(
            f"在 {filepath} 中未找到任何依赖项",
            suggestion="请确认这是有效的 npm package-lock.json 文件，并且项目已运行过 `npm install`。"
        )

    return deps


def _parse_pnpm_lock(filepath: str) -> Dict[str, Dependency]:
    """解析 pnpm-lock.yaml。"""
    with open(filepath, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    if data is None or "packages" not in data:
        raise LockfileParseError(
            f"{filepath} 格式不正确: 缺少 'packages' 字段",
            suggestion="请确认这是有效的 pnpm-lock.yaml 文件 (lockfileVersion >= 5.0)。"
        )

    deps: Dict[str, Dependency] = {}
    direct_deps = set()

    for field in ("dependencies", "devDependencies", "optionalDependencies"):
        if field in data and isinstance(data[field], dict):
            direct_deps.update(data[field].keys())

    importers = data.get("importers", {})
    if "." in importers:
        for field in ("dependencies", "devDependencies", "optionalDependencies"):
            if field in importers["."]:
                direct_deps.update(importers["."][field].keys())

    for pkg_key, pkg_info in data["packages"].items():
        if pkg_info is None:
            continue

        key_str = pkg_key.lstrip("/")
        if not key_str:
            continue

        parts = key_str.split("/")

        name_raw: Optional[str] = None
        version: Optional[str] = None

        if key_str.startswith("@") and len(parts) >= 3:
            name_raw = parts[0] + "/" + parts[1]
            version = parts[2]
        elif not key_str.startswith("@") and len(parts) >= 2:
            name_raw = parts[0]
            version = parts[1]

        if not name_raw or not version:
            continue

        extras: List[str] = []
        if "_" in version:
            version_parts = version.split("_", 1)
            version = version_parts[0]
            extras_str = version_parts[1]
            if extras_str.endswith(")"):
                extras_str = extras_str[:-1]
            extras = [e for e in extras_str.split(")(") if e]
            if extras and not extras[-1]:
                extras = extras[:-1]

        version_match = re.match(r"([A-Za-z0-9_.\-+!]+)", version)
        if version_match:
            version = version_match.group(1)

        if not version:
            continue

        license_info = _parse_license(
            pkg_info.get("license") if isinstance(pkg_info, dict) else None
        )

        dep = Dependency(
            name=name_raw,
            version=version,
            license=license_info,
            direct=name_raw in direct_deps,
            extras=extras,
            ecosystem="pnpm",
        )
        deps[name_raw] = dep

    if not deps:
        raise LockfileParseError(
            f"在 {filepath} 中未找到任何依赖项",
            suggestion="请确认这是有效的 pnpm-lock.yaml 文件，并且项目已运行过 `pnpm install`。"
        )

    return deps


def _parse_requirements(filepath: str) -> Dict[str, Dependency]:
    """解析 requirements.txt / requirements.lock。"""
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    deps: Dict[str, Dependency] = {}
    pattern = re.compile(
        r"^\s*([A-Za-z0-9_.\-]+)\s*"
        r"(?:\[(.*?)\])?"
        r"\s*([<>=!~]+.*?)"
        r"\s*(?:;.*)?$"
    )
    pinned_pattern = re.compile(
        r"^\s*([A-Za-z0-9_.\-]+)\s*"
        r"(?:\[(.*?)\])?"
        r"\s*==\s*([A-Za-z0-9_.\-+!]+)"
        r"\s*(?:;.*)?(?:\s*#.*)?$"
    )

    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        if line.startswith("-r") or line.startswith("-c") or line.startswith("-e"):
            continue

        pinned_match = pinned_pattern.match(line)
        if pinned_match:
            name = pinned_match.group(1)
            extras_str = pinned_match.group(2)
            version = pinned_match.group(3)
        else:
            match = pattern.match(line)
            if not match:
                continue
            name = match.group(1)
            extras_str = match.group(2)
            version_spec = match.group(3).strip()
            exact_match = re.search(r"==\s*([A-Za-z0-9_.\-+!]+)", version_spec)
            if exact_match:
                version = exact_match.group(1)
            else:
                continue

        extras: List[str] = []
        if extras_str:
            extras = [e.strip() for e in extras_str.split(",") if e.strip()]

        normalized_name = name.lower().replace("_", "-").replace(".", "-")

        dep = Dependency(
            name=normalized_name,
            version=version,
            direct=True,
            extras=extras,
            ecosystem="pip",
        )
        deps[normalized_name] = dep

    if not deps:
        raise LockfileParseError(
            f"在 {filepath} 中未找到任何带精确版本号的依赖项",
            suggestion="requirements.txt 中需要至少包含一个带有 == 版本号的依赖。"
                       "您也可以使用 `pip freeze > requirements.lock` 生成锁定文件。"
        )

    return deps
