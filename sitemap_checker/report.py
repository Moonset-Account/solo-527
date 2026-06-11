from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

from .models import (
    CheckResult,
    FixPlan,
    FixSuggestion,
    IssueType,
    LinkType,
    ScanReport,
    Severity,
)


def _severity_icon(severity: Severity) -> str:
    mapping = {
        Severity.CRITICAL: "🔴",
        Severity.WARNING: "🟡",
        Severity.INFO: "🔵",
    }
    return mapping.get(severity, "⚪")


def _link_type_label(lt: LinkType) -> str:
    mapping = {
        LinkType.INTERNAL: "内部链接",
        LinkType.EXTERNAL: "外部链接",
        LinkType.IMAGE: "图片资源",
        LinkType.SITEMAP: "Sitemap",
        LinkType.ASSET: "静态资源",
    }
    return mapping.get(lt, lt.value)


def _issue_type_label(it: IssueType) -> str:
    mapping = {
        IssueType.NOT_FOUND_404: "404 死链",
        IssueType.REDIRECT_CHAIN: "重定向链过长",
        IssueType.REDIRECT_LOOP: "重定向循环",
        IssueType.TITLE_MISSING: "标题缺失",
        IssueType.TITLE_EMPTY: "标题为空",
        IssueType.CANONICAL_CONFLICT: "Canonical 冲突",
        IssueType.CANONICAL_MISSING: "Canonical 缺失",
        IssueType.NETWORK_ERROR: "网络错误",
        IssueType.TIMEOUT: "请求超时",
        IssueType.SSL_ERROR: "SSL 证书错误",
        IssueType.DNS_ERROR: "DNS 解析失败",
        IssueType.SERVER_ERROR: "服务器错误",
        IssueType.INVALID_URL: "无效 URL",
    }
    return mapping.get(it, it.value)


def to_json(report: ScanReport, indent: int = 2) -> str:
    return json.dumps(
        report.model_dump(mode="json"),
        ensure_ascii=False,
        indent=indent,
        default=str,
    )


def write_json(report: ScanReport, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(to_json(report), encoding="utf-8")


def _write_fix_suggestions(lines: List[str], title: str, suggestions: List[FixSuggestion]) -> None:
    if not suggestions:
        return
    lines.append(f"### {title} ({len(suggestions)})")
    lines.append("")
    lines.append("| 操作 | 原始 URL | 建议替换为 | 原因 | 置信度 |")
    lines.append("|------|----------|------------|------|--------|")
    for s in suggestions:
        to_url = s.to_url if s.to_url else "_(需人工确认)_"
        lines.append(
            f"| {s.action} | `{s.from_url}` | `{to_url}` | {s.reason} | {s.confidence:.0%} |"
        )
    lines.append("")


def to_markdown(report: ScanReport, *, include_fix_plan: bool = True) -> str:
    lines: List[str] = []
    lines.append("# 站点死链检查报告")
    lines.append("")

    if report.finished_at and report.started_at:
        duration = (report.finished_at - report.started_at).total_seconds()
        lines.append(f"- **扫描时间**: {report.started_at.strftime('%Y-%m-%d %H:%M:%S')} ~ {report.finished_at.strftime('%Y-%m-%d %H:%M:%S')} (耗时 {duration:.1f}s)")
    else:
        lines.append(f"- **扫描时间**: {report.started_at.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"- **目标域名**: `{report.base_domain or 'N/A'}`")
    lines.append(f"- **检查页面数**: {report.pages_checked}")
    lines.append(f"- **检查链接总数**: {report.links_checked}")
    lines.append("")

    critical = report.get_critical_issues()
    warnings = report.get_warning_issues()
    manual = report.get_manual_review()

    lines.append("## 概览")
    lines.append("")
    lines.append(f"- 🔴 **严重问题**: {len(critical)}")
    lines.append(f"- 🟡 **警告**: {len(warnings)}")
    lines.append(f"- ⚠️  **需人工确认** (网络错误/超时/SSL): {len(manual)}")
    lines.append("")

    def _result_to_rows(results: List[CheckResult]) -> List[str]:
        rows = []
        for r in results:
            if not r.issues:
                continue
            issues_text = "<br>".join(
                f"{_severity_icon(i.severity)} {_issue_type_label(i.issue_type)}: {i.message}"
                for i in r.issues
            )
            final_url = r.page_meta.final_url if r.page_meta and r.page_meta.final_url else "-"
            status = r.page_meta.status_code if r.page_meta and r.page_meta.status_code else "-"
            rows.append(
                f"| {_link_type_label(r.link_type)} | `{r.url}` | {status} | `{final_url}` | {issues_text} |"
            )
        return rows

    if critical:
        lines.append("## 🔴 严重问题")
        lines.append("")
        lines.append("| 类型 | URL | 状态码 | 最终地址 | 问题详情 |")
        lines.append("|------|-----|--------|----------|----------|")
        lines.extend(_result_to_rows(critical))
        lines.append("")

    if warnings:
        lines.append("## 🟡 警告")
        lines.append("")
        lines.append("| 类型 | URL | 状态码 | 最终地址 | 问题详情 |")
        lines.append("|------|-----|--------|----------|----------|")
        lines.extend(_result_to_rows(warnings))
        lines.append("")

    if manual:
        lines.append("## ⚠️ 需人工确认 (非真实死链)")
        lines.append("")
        lines.append("以下链接由于网络原因无法验证，**请勿直接删除页面**，请内容运营人员手动确认：")
        lines.append("")
        lines.append("| 类型 | URL | 错误类型 | 说明 |")
        lines.append("|------|-----|----------|------|")
        for r in manual:
            for i in r.issues:
                if i.details.get("needs_manual_review"):
                    lines.append(
                        f"| {_link_type_label(r.link_type)} | `{r.url}` | {_issue_type_label(i.issue_type)} | {i.message} |"
                    )
        lines.append("")

    whitelisted = [r for r in report.results if r.is_whitelisted]
    if whitelisted:
        lines.append(f"## ✅ 白名单跳过 ({len(whitelisted)})")
        lines.append("")
        for r in whitelisted:
            lines.append(f"- `{r.url}`")
        lines.append("")

    if include_fix_plan:
        lines.append("## 🔧 修复建议")
        lines.append("")
        if report.fix_plan.requires_confirmation:
            lines.append("> ⚠️ **重要**: 以下修复建议需要内容运营人员确认后再执行。替换操作可能影响页面完整性。")
            lines.append("")

        _write_fix_suggestions(lines, "内部链接修复", report.fix_plan.internal_links)
        _write_fix_suggestions(lines, "外部链接修复", report.fix_plan.external_links)
        _write_fix_suggestions(lines, "图片资源修复", report.fix_plan.images)

        fp = report.fix_plan
        total_suggestions = len(fp.internal_links) + len(fp.external_links) + len(fp.images)
        if total_suggestions == 0:
            lines.append("_暂无修复建议，所有链接状态良好。_")
            lines.append("")

    return "\n".join(lines)


def write_markdown(report: ScanReport, output_path: Path, *, include_fix_plan: bool = True) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(to_markdown(report, include_fix_plan=include_fix_plan), encoding="utf-8")


def write_replacement_script(
    report: ScanReport,
    output_path: Path,
    *,
    confirmed: bool = False,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    lines: List[str] = []
    lines.append("#!/usr/bin/env bash")
    lines.append("#")
    lines.append("# 链接批量替换脚本")
    lines.append("#")
    if not confirmed:
        lines.append("# ⚠️ 警告: 此脚本由 sitemap-checker 自动生成，执行前请内容运营确认")
        lines.append("#   设置 CONFIRMED=1 后再运行以执行实际替换")
        lines.append("#")
    lines.append("")
    lines.append('set -euo pipefail')
    lines.append("")
    lines.append('CONFIRMED="${CONFIRMED:-0}"')
    lines.append('if [[ "$CONFIRMED" != "1" ]]; then')
    lines.append('  echo "[DRY RUN] 未设置 CONFIRMED=1，仅显示将执行的操作"')
    lines.append('  DRY_RUN=1')
    lines.append('else')
    lines.append('  DRY_RUN=0')
    lines.append('fi')
    lines.append("")

    all_suggestions = (
        report.fix_plan.internal_links
        + report.fix_plan.external_links
        + report.fix_plan.images
    )

    replacable = [s for s in all_suggestions if s.to_url and s.action == "UPDATE_TO_FINAL"]
    if not replacable:
        lines.append("echo '无可执行的自动替换建议，所有问题需人工处理。'")
        lines.append("")
    else:
        lines.append('SEARCH_ROOT="${SEARCH_ROOT:-.}"')
        lines.append("")
        for s in replacable:
            escaped_from = s.from_url.replace("/", "\\/").replace("&", "\\&")
            escaped_to = s.to_url.replace("/", "\\/").replace("&", "\\&") if s.to_url else ""
            lines.append(f"# {s.reason}")
            lines.append(f'echo "替换: {s.from_url} -> {s.to_url}"')
            lines.append(f'if [[ "$DRY_RUN" == "1" ]]; then')
            lines.append(f'  grep -rl "{s.from_url}" "$SEARCH_ROOT" || true')
            lines.append(f'else')
            lines.append(
                f'  find "$SEARCH_ROOT" -type f \\( -name "*.html" -o -name "*.md" -o -name "*.htm" \\) '
                f'-exec sed -i "" "s/{escaped_from}/{escaped_to}/g" {{}} +'
            )
            lines.append(f'fi')
            lines.append("")

    output_path.write_text("\n".join(lines), encoding="utf-8")
    output_path.chmod(0o755)
