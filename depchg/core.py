"""核心业务逻辑模块。"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from .changelog_parser import apply_changelog_to_changes, read_changelog_file
from .config import AppConfig
from .comparator import compute_changes, group_changes
from .exceptions import DepChgError, LockfileParseError
from .formatter import create_report, render_report
from .logging_config import get_logger
from .models import Change, Report, RiskLevel
from .parsers import parse_lockfile
from .risk_assessor import assess_all_risks

logger = get_logger("depchg.core")


def generate_report(
    config: AppConfig,
) -> Report:
    """根据配置生成完整的变更报告。

    Args:
        config: 应用配置对象

    Returns:
        Report 对象

    Raises:
        DepChgError: 处理过程中出错时抛出
    """
    logger.info(
        "开始生成报告",
        before=config.before,
        after=config.after,
        only_direct=config.only_direct,
        minimal_risk_level=config.minimal_risk_level,
        changelog=config.changelog,
    )

    if not config.before:
        from .exceptions import ValidationError
        raise ValidationError(
            "缺少 --before 参数（变更前锁文件路径）",
            suggestion="请使用 --before 指定变更前的锁文件路径。示例: --before ./old/package-lock.json"
        )

    if not config.after:
        from .exceptions import ValidationError
        raise ValidationError(
            "缺少 --after 参数（变更后锁文件路径）",
            suggestion="请使用 --after 指定变更后的锁文件路径。示例: --after ./new/package-lock.json"
        )

    logger.debug("解析变更前锁文件", path=config.before)
    ecosystem_before, deps_before = parse_lockfile(config.before)

    logger.debug("解析变更后锁文件", path=config.after)
    ecosystem_after, deps_after = parse_lockfile(config.after)

    ecosystem = ecosystem_before
    if ecosystem_before != ecosystem_after:
        logger.warning(
            "两个锁文件的生态系统不一致",
            before=ecosystem_before,
            after=ecosystem_after,
        )
        ecosystem = f"{ecosystem_before}→{ecosystem_after}"

    if config.only_direct:
        deps_before = {k: v for k, v in deps_before.items() if v.direct}
        deps_after = {k: v for k, v in deps_after.items() if v.direct}
        logger.debug("已过滤为仅直接依赖", before_count=len(deps_before), after_count=len(deps_after))

    if config.ignored_packages:
        ignore_set = set(config.ignored_packages)
        deps_before = {k: v for k, v in deps_before.items() if k not in ignore_set}
        deps_after = {k: v for k, v in deps_after.items() if k not in ignore_set}
        logger.debug("已过滤忽略的包", ignored=list(ignore_set))

    changes: List[Change] = compute_changes(deps_before, deps_after)
    logger.info("计算得到变更数量", count=len(changes))

    assess_all_risks(changes)
    logger.debug("风险评估完成")

    changelog_source = None
    if config.changelog or config.changelog_text:
        if config.changelog_text:
            raw_text = config.changelog_text
            changelog_source = "<inline>"
        else:
            raw_text = read_changelog_file(config.changelog)
            changelog_source = config.changelog

        if config.include_changelog:
            apply_changelog_to_changes(
                changes=changes,
                changelog=raw_text,
                changelog_source=changelog_source,
            )

    if config.minimal_risk_level and config.minimal_risk_level.lower() != "none":
        level_order = [l.value for l in RiskLevel]
        try:
            min_index = level_order.index(config.minimal_risk_level.lower())
        except ValueError:
            from .exceptions import ValidationError
            raise ValidationError(
                f"无效的最小风险等级: {config.minimal_risk_level}",
                suggestion="有效的风险等级: none, low, medium, high, critical"
            )
        changes = [
            c for c in changes
            if level_order.index(c.risk.level.value) >= min_index
        ]
        logger.debug(
            "按风险等级过滤",
            minimal_level=config.minimal_risk_level,
            remaining=len(changes),
        )

    report = create_report(
        changes=changes,
        lockfile_before=config.before,
        lockfile_after=config.after,
        ecosystem=ecosystem,
    )
    report.changelog_source = changelog_source

    logger.info(
        "报告生成完成",
        total_changes=report.total_changes,
        summary=report.summary,
        changelog_summary=report.changelog_summary,
    )

    return report


def determine_exit_code(report: Report) -> int:
    """根据报告中的风险等级确定退出码。

    Args:
        report: 报告对象

    Returns:
        退出码 (0-255)
    """
    from . import exit_codes

    critical_count = report.risk_summary.get(RiskLevel.CRITICAL.value, 0)
    high_count = report.risk_summary.get(RiskLevel.HIGH.value, 0)

    if critical_count > 0:
        logger.warning("报告包含严重风险变更", count=critical_count)
        return exit_codes.CRITICAL_RISK_CHANGES
    elif high_count > 0:
        logger.warning("报告包含高风险变更", count=high_count)
        return exit_codes.HIGH_RISK_CHANGES

    return exit_codes.SUCCESS


def run_with_config(
    config: AppConfig,
) -> int:
    """根据配置执行完整的报告流程。

    Args:
        config: 应用配置对象

    Returns:
        退出码
    """
    from . import exit_codes

    try:
        report = generate_report(config)

        render_report(
            report=report,
            output_format=config.output_format,
            output_file=config.output_file,
            markdown=config.markdown,
            include_license=config.include_license,
            include_risk=config.include_risk,
            include_changelog=config.include_changelog,
        )

        return determine_exit_code(report)

    except DepChgError as e:
        logger.error(
            "处理失败",
            error_type=type(e).__name__,
            message=e.message,
            suggestion=e.suggestion,
            details=e.details,
        )
        return e.exit_code
    except KeyboardInterrupt:
        logger.warning("用户中断执行")
        return 130
    except Exception as e:
        logger.exception("发生未处理的异常", error_type=type(e).__name__)
        return exit_codes.GENERAL_ERROR
