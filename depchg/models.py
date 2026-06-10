"""数据模型定义。"""

from __future__ import annotations

import enum
from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, List, Any


class ChangeType(str, enum.Enum):
    """变更类型枚举。"""
    MAJOR = "major"
    MINOR = "minor"
    PATCH = "patch"
    PRERELEASE = "prerelease"
    BUILD = "build"
    UNKNOWN = "unknown"
    ADDED = "added"
    REMOVED = "removed"


class RiskLevel(str, enum.Enum):
    """风险等级枚举。"""
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class LicenseInfo:
    """许可证信息。"""
    name: str = "UNKNOWN"
    identifier: Optional[str] = None
    url: Optional[str] = None
    is_osi_approved: Optional[bool] = None
    is_copyleft: Optional[bool] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class RiskInfo:
    """风险信息。"""
    level: RiskLevel = RiskLevel.NONE
    reasons: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "level": self.level.value,
            "reasons": self.reasons,
            "suggestions": self.suggestions,
        }


@dataclass
class Dependency:
    """依赖项信息。"""
    name: str
    version: str
    license: LicenseInfo = field(default_factory=LicenseInfo)
    direct: bool = False
    extras: List[str] = field(default_factory=list)
    ecosystem: str = "unknown"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "version": self.version,
            "license": self.license.to_dict(),
            "direct": self.direct,
            "extras": self.extras,
            "ecosystem": self.ecosystem,
        }


@dataclass
class Change:
    """单个依赖的变更信息。"""
    name: str
    change_type: ChangeType
    before: Optional[Dependency] = None
    after: Optional[Dependency] = None
    license_changed: bool = False
    risk: RiskInfo = field(default_factory=RiskInfo)
    changelog_url: Optional[str] = None
    changelog_notes: Optional[List[str]] = None

    @property
    def version_before(self) -> str:
        return self.before.version if self.before else "-"

    @property
    def version_after(self) -> str:
        return self.after.version if self.after else "-"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "change_type": self.change_type.value,
            "version_before": self.version_before,
            "version_after": self.version_after,
            "before": self.before.to_dict() if self.before else None,
            "after": self.after.to_dict() if self.after else None,
            "license_changed": self.license_changed,
            "risk": self.risk.to_dict(),
            "changelog_url": self.changelog_url,
            "changelog_notes": self.changelog_notes,
        }


@dataclass
class Report:
    """完整的变更报告。"""
    generated_at: str
    lockfile_before: str
    lockfile_after: str
    ecosystem: str
    total_changes: int = 0
    changes: List[Change] = field(default_factory=list)
    summary: Dict[str, int] = field(default_factory=dict)
    license_summary: Dict[str, List[str]] = field(default_factory=dict)
    risk_summary: Dict[str, int] = field(default_factory=dict)
    changelog_source: Optional[str] = None
    changelog_summary: Dict[str, int] = field(default_factory=dict)

    def compute_summaries(self) -> None:
        """计算各类汇总数据。"""
        self.summary = {t.value: 0 for t in ChangeType}
        self.license_summary = {}
        self.risk_summary = {l.value: 0 for l in RiskLevel}
        self.changelog_summary = {"with_notes": 0, "without_notes": 0}

        for change in self.changes:
            self.summary[change.change_type.value] = (
                self.summary.get(change.change_type.value, 0) + 1
            )
            self.risk_summary[change.risk.level.value] = (
                self.risk_summary.get(change.risk.level.value, 0) + 1
            )

            dep = change.after or change.before
            if dep:
                lic_name = dep.license.name or "UNKNOWN"
                if lic_name not in self.license_summary:
                    self.license_summary[lic_name] = []
                if change.name not in self.license_summary[lic_name]:
                    self.license_summary[lic_name].append(change.name)

            if change.changelog_notes:
                self.changelog_summary["with_notes"] += 1
            else:
                self.changelog_summary["without_notes"] += 1

        self.total_changes = len(self.changes)

    def to_dict(self) -> Dict[str, Any]:
        self.compute_summaries()
        return {
            "generated_at": self.generated_at,
            "lockfile_before": self.lockfile_before,
            "lockfile_after": self.lockfile_after,
            "ecosystem": self.ecosystem,
            "total_changes": self.total_changes,
            "summary": self.summary,
            "license_summary": self.license_summary,
            "risk_summary": self.risk_summary,
            "changelog_source": self.changelog_source,
            "changelog_summary": self.changelog_summary,
            "changes": [c.to_dict() for c in self.changes],
        }
