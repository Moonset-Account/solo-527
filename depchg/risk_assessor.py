"""许可证检查和风险评估模块。"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Set

from .models import Change, ChangeType, RiskInfo, RiskLevel


@dataclass(frozen=True)
class LicenseCategory:
    """许可证分类信息。"""
    names: Set[str]
    risk_level: RiskLevel
    description: str
    copyleft: bool


OSI_APPROVED_PERMISSIVE: Set[str] = {
    "MIT",
    "MIT License",
    "Apache-2.0",
    "Apache 2.0",
    "Apache License 2.0",
    "BSD-2-Clause",
    "BSD 2-Clause",
    "BSD-3-Clause",
    "BSD 3-Clause",
    "ISC",
    "Python-2.0",
    "Python Software Foundation License",
    "Unlicense",
    "CC0-1.0",
    "WTFPL",
    "Zlib",
    "PSF",
    "PSF-2.0",
}

OSI_APPROVED_WEAK_COPYLEFT: Set[str] = {
    "LGPL-2.0",
    "LGPL-2.1",
    "LGPL-3.0",
    "LGPLv2.1",
    "LGPLv3",
    "MPL-1.1",
    "MPL-2.0",
    "CDDL-1.0",
    "EPL-1.0",
    "EPL-2.0",
}

OSI_APPROVED_STRONG_COPYLEFT: Set[str] = {
    "GPL-2.0",
    "GPL-2.0-only",
    "GPL-2.0-or-later",
    "GPL-3.0",
    "GPL-3.0-only",
    "GPL-3.0-or-later",
    "AGPL-3.0",
    "AGPL-3.0-only",
    "AGPL-3.0-or-later",
}

COMMERCIAL_RESTRICTED: Set[str] = {
    "PROPRIETARY",
    "COMMERCIAL",
    "UNLICENSED",
    "All Rights Reserved",
}

UNKNOWN_LICENSE: Set[str] = {
    "UNKNOWN",
    "",
    "None",
    "null",
}


def categorize_license(license_name: str) -> LicenseCategory:
    """将许可证名称分类并评估风险等级。"""
    if not license_name or license_name.upper() in {u.upper() for u in UNKNOWN_LICENSE}:
        return LicenseCategory(
            names=UNKNOWN_LICENSE,
            risk_level=RiskLevel.HIGH,
            description="许可证信息缺失或未知，存在法律风险",
            copyleft=False,
        )

    name_upper = license_name.strip().upper()

    if any(upper(name) in name_upper for name in COMMERCIAL_RESTRICTED):
        return LicenseCategory(
            names=COMMERCIAL_RESTRICTED,
            risk_level=RiskLevel.CRITICAL,
            description="专有或商业许可证，可能限制使用和分发",
            copyleft=False,
        )

    normalized = {upper(n): n for n in OSI_APPROVED_PERMISSIVE}
    for key, orig in normalized.items():
        if key in name_upper or name_upper.startswith(key.split("-")[0]):
            return LicenseCategory(
                names=OSI_APPROVED_PERMISSIVE,
                risk_level=RiskLevel.LOW,
                description=f"宽松许可证 ({orig})，兼容性良好",
                copyleft=False,
            )

    normalized = {upper(n): n for n in OSI_APPROVED_WEAK_COPYLEFT}
    for key, orig in normalized.items():
        if key in name_upper:
            return LicenseCategory(
                names=OSI_APPROVED_WEAK_COPYLEFT,
                risk_level=RiskLevel.MEDIUM,
                description=f"弱Copyleft许可证 ({orig})，修改后的代码需开源",
                copyleft=True,
            )

    normalized = {upper(n): n for n in OSI_APPROVED_STRONG_COPYLEFT}
    for key, orig in normalized.items():
        if key in name_upper:
            return LicenseCategory(
                names=OSI_APPROVED_STRONG_COPYLEFT,
                risk_level=RiskLevel.HIGH,
                description=f"强Copyleft许可证 ({orig})，衍生作品必须以相同许可证发布",
                copyleft=True,
            )

    return LicenseCategory(
        names={license_name},
        risk_level=RiskLevel.MEDIUM,
        description="无法识别的许可证，请手动核查兼容性",
        copyleft=False,
    )


def upper(s: str) -> str:
    return s.upper()


def assess_license_change(change: Change) -> Optional[RiskInfo]:
    """评估许可证变更带来的风险。"""
    if not change.license_changed:
        return None

    lic_before = change.before.license.name if change.before else "UNKNOWN"
    lic_after = change.after.license.name if change.after else "UNKNOWN"

    cat_before = categorize_license(lic_before)
    cat_after = categorize_license(lic_after)

    reasons: List[str] = []
    suggestions: List[str] = []

    if cat_before.risk_level.value != cat_after.risk_level.value:
        level_order = [l.value for l in RiskLevel]
        if level_order.index(cat_after.risk_level.value) > level_order.index(
            cat_before.risk_level.value
        ):
            reasons.append(
                f"许可证风险等级从 {cat_before.risk_level.value.upper()} "
                f"上升到 {cat_after.risk_level.value.upper()}"
            )
            suggestions.append("请仔细阅读新许可证条款，确认与项目许可证兼容")

    if cat_after.copyleft and not cat_before.copyleft:
        reasons.append(f"从非Copyleft许可证变为Copyleft许可证: {lic_after}")
        suggestions.append(
            "Copyleft许可证可能要求您的衍生作品开源，请评估对项目分发的影响"
        )

    if not reasons:
        reasons.append(f"许可证从 {lic_before} 变更为 {lic_after}")
        suggestions.append("请确认许可证变更是有意为之，并检查兼容性")

    level = max(cat_before.risk_level, cat_after.risk_level, key=lambda l: level_order.index(l.value))
    return RiskInfo(level=level, reasons=reasons, suggestions=suggestions)


def assess_version_risk(change: Change) -> Optional[RiskInfo]:
    """评估版本变更的风险。"""
    risks: List[RiskInfo] = []

    if change.change_type == ChangeType.MAJOR:
        risks.append(RiskInfo(
            level=RiskLevel.HIGH,
            reasons=[f"主版本升级: {change.version_before} → {change.version_after}"],
            suggestions=[
                "主版本升级可能包含不兼容变更，请仔细阅读发布说明",
                "建议在隔离环境中运行完整测试套件",
                "检查是否有废弃API的调用",
            ],
        ))
    elif change.change_type == ChangeType.MINOR:
        risks.append(RiskInfo(
            level=RiskLevel.MEDIUM,
            reasons=[f"次版本升级: {change.version_before} → {change.version_after}"],
            suggestions=[
                "次版本升级通常包含新功能，但应验证向后兼容性",
                "建议运行相关模块的测试",
            ],
        ))
    elif change.change_type == ChangeType.PATCH:
        risks.append(RiskInfo(
            level=RiskLevel.LOW,
            reasons=[f"补丁版本升级: {change.version_before} → {change.version_after}"],
            suggestions=[
                "补丁版本主要是Bug修复，通常安全，建议快速升级",
            ],
        ))
    elif change.change_type == ChangeType.PRERELEASE:
        risks.append(RiskInfo(
            level=RiskLevel.HIGH,
            reasons=[f"使用预发布版本: {change.version_before} → {change.version_after}"],
            suggestions=[
                "预发布版本不建议在生产环境使用",
                "可能存在未发现的Bug和不兼容变更",
            ],
        ))
    elif change.change_type == ChangeType.ADDED:
        lic = change.after.license.name if change.after else "UNKNOWN"
        cat = categorize_license(lic)
        if cat.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            risks.append(RiskInfo(
                level=cat.risk_level,
                reasons=[f"新增依赖使用 {lic} 许可证"],
                suggestions=cat.description.split("。"),
            ))

    if not risks:
        return None

    combined_reasons: List[str] = []
    combined_suggestions: List[str] = []
    highest_level = RiskLevel.NONE
    level_order = [l.value for l in RiskLevel]

    for r in risks:
        combined_reasons.extend(r.reasons)
        combined_suggestions.extend(r.suggestions)
        if level_order.index(r.level.value) > level_order.index(highest_level.value):
            highest_level = r.level

    return RiskInfo(
        level=highest_level,
        reasons=combined_reasons,
        suggestions=combined_suggestions,
    )


def assess_all_risks(changes: List[Change]) -> None:
    """对所有变更执行风险评估并更新到Change对象中。"""
    for change in changes:
        risk_infos = []

        lic_risk = assess_license_change(change)
        if lic_risk:
            risk_infos.append(lic_risk)

        ver_risk = assess_version_risk(change)
        if ver_risk:
            risk_infos.append(ver_risk)

        if risk_infos:
            combined_reasons: List[str] = []
            combined_suggestions: List[str] = []
            highest_level = RiskLevel.NONE
            level_order = [l.value for l in RiskLevel]

            for r in risk_infos:
                combined_reasons.extend(r.reasons)
                combined_suggestions.extend(r.suggestions)
                if level_order.index(r.level.value) > level_order.index(highest_level.value):
                    highest_level = r.level

            change.risk = RiskInfo(
                level=highest_level,
                reasons=combined_reasons,
                suggestions=combined_suggestions,
            )
