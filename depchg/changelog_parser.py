"""更新记录（Changelog）解析模块。

支持读取以下格式的更新记录，并关联到对应的变更包：
  - Markdown / 文本格式的 CHANGELOG.md
  - git log 输出 (支持 --oneline 格式)
  - 自定义的按包分组的更新记录
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Dict, List, Optional

from .exceptions import ConfigError
from .logging_config import get_logger
from .models import Change

logger = get_logger("depchg.changelog")


HEADING_PATTERNS = [
    re.compile(r"^#\s+(.+)$"),
    re.compile(r"^##\s+(.+)$"),
    re.compile(r"^###\s+(.+)$"),
    re.compile(r"^\*\*(.+)\*\*\s*$"),
    re.compile(r"^__([^_]+)__\s*$"),
    re.compile(r"^\[(.+)\]\s*[:：]?$"),
    re.compile(r"^(.+)\s*[-:：]\s*v?\d"),
]

BULLET_PATTERNS = [
    re.compile(r"^\s*[-*•]\s+(.+)$"),
    re.compile(r"^\s*\d+[.)]\s+(.+)$"),
    re.compile(r"^\s*[>+]\s+(.+)$"),
]

GIT_LOG_PATTERN = re.compile(
    r"^([a-f0-9]{7,40})\s+(.+)$", re.IGNORECASE
)


def read_changelog_file(path: str) -> str:
    """读取更新记录文件。"""
    p = Path(path)
    if not p.exists():
        raise ConfigError(
            f"更新记录文件不存在: {path}",
            suggestion=f"请确认路径是否正确，当前工作目录: {os.getcwd()}"
        )
    if not p.is_file():
        raise ConfigError(
            f"更新记录路径不是文件: {path}",
            suggestion="--changelog 参数需要指向 CHANGELOG.md 等文本文件。"
        )
    try:
        return p.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return p.read_text(encoding="utf-8", errors="replace")


def _match_package_name(line: str, candidate_names: List[str]) -> Optional[str]:
    """从一行文本中匹配包名。"""
    line_lower = line.lower().strip()
    normalized_candidates = {}
    for name in candidate_names:
        key = name.lower().replace("_", "-").replace(".", "-")
        normalized_candidates[key] = name

    tokens = re.split(r"[\s\[\](){}<>|/\\,:;\"'`]+", line_lower)
    for tok in tokens:
        tok_clean = tok.strip(" -_")
        if not tok_clean:
            continue
        if tok_clean in normalized_candidates:
            return normalized_candidates[tok_clean]

    for key, name in normalized_candidates.items():
        if key in line_lower or re.sub(r"[^a-z0-9]", "", key) in re.sub(r"[^a-z0-9]", "", line_lower):
            return name

    return None


def parse_changelog_text(
    content: str,
    change_names: List[str],
) -> Dict[str, List[str]]:
    """解析更新记录文本，返回 {包名: [更新条目列表]}。"""
    notes: Dict[str, List[str]] = {}
    if not content or not content.strip():
        return notes

    name_set = set(change_names)
    current_package: Optional[str] = None
    in_fenced_code = False

    lines = content.splitlines()

    for raw_line in lines:
        line = raw_line.rstrip()
        stripped = line.strip()

        if not stripped:
            current_package = None
            continue

        if stripped.startswith("```"):
            in_fenced_code = not in_fenced_code
            continue
        if in_fenced_code:
            continue

        heading_match = None
        for pat in HEADING_PATTERNS:
            m = pat.match(stripped)
            if m:
                heading_match = m.group(1).strip(" -:*")
                break

        if heading_match:
            pkg = _match_package_name(heading_match, list(name_set))
            if pkg:
                current_package = pkg
                notes.setdefault(pkg, [])
                continue

        bullet_match = None
        for pat in BULLET_PATTERNS:
            m = pat.match(line)
            if m:
                bullet_match = m.group(1).strip()
                break

        git_match = GIT_LOG_PATTERN.match(stripped)
        if git_match and not bullet_match:
            commit = git_match.group(1)
            msg = git_match.group(2).strip()
            bullet_match = f"[{commit[:7]}] {msg}"

        if bullet_match:
            pkg_in_line = _match_package_name(bullet_match, list(name_set))
            target_pkg = pkg_in_line or current_package

            if target_pkg and target_pkg in name_set:
                notes.setdefault(target_pkg, [])
                if len(notes[target_pkg]) < 50:
                    clean_note = bullet_match
                    clean_note = re.sub(r"\s+", " ", clean_note).strip()
                    if len(clean_note) > 500:
                        clean_note = clean_note[:497] + "..."
                    notes[target_pkg].append(clean_note)
            continue

        if current_package and current_package in name_set and len(stripped) > 3:
            notes.setdefault(current_package, [])
            if len(notes[current_package]) < 50:
                notes[current_package].append(stripped)

    return notes


def apply_changelog_to_changes(
    changes: List[Change],
    changelog: Optional[str],
    changelog_source: Optional[str],
) -> Dict[str, List[str]]:
    """将解析到的更新记录关联到 Change 对象列表。

    Args:
        changes: 变更列表（会被原地修改，添加 changelog_notes）
        changelog: 更新记录文本内容（None 表示不处理）
        changelog_source: 更新记录的来源描述（用于报告）

    Returns:
        解析得到的 {包名: [更新条目]} 字典
    """
    if not changelog:
        return {}

    change_names = [c.name for c in changes]
    notes_map = parse_changelog_text(changelog, change_names)

    matched_count = 0
    for change in changes:
        if change.name in notes_map and notes_map[change.name]:
            change.changelog_notes = notes_map[change.name]
            matched_count += 1

    logger.info(
        "更新记录匹配完成",
        source=changelog_source,
        total_packages=len(changes),
        matched_packages=matched_count,
        total_notes=sum(len(v) for v in notes_map.values()),
    )

    return notes_map
