"""输出格式化模块，支持 Markdown 表格和 JSON。"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, TextIO

from rich.console import Console
from rich.table import Table as RichTable

from .models import Change, ChangeType, Report, RiskLevel
from .exceptions import OutputError


CHANGE_TYPE_LABELS = {
    ChangeType.MAJOR: "主版本 ⬆",
    ChangeType.MINOR: "次版本 ⬆",
    ChangeType.PATCH: "补丁 ⬆",
    ChangeType.PRERELEASE: "预发布",
    ChangeType.BUILD: "构建号",
    ChangeType.UNKNOWN: "未分类",
    ChangeType.ADDED: "新增 ➕",
    ChangeType.REMOVED: "移除 ➖",
}

CHANGE_TYPE_LABELS_MD = {
    ChangeType.MAJOR: "主版本 ⬆️",
    ChangeType.MINOR: "次版本 ⬆️",
    ChangeType.PATCH: "补丁 ⬆️",
    ChangeType.PRERELEASE: "预发布",
    ChangeType.BUILD: "构建号",
    ChangeType.UNKNOWN: "未分类",
    ChangeType.ADDED: "新增 ➕",
    ChangeType.REMOVED: "移除 ➖",
}

RISK_STYLES = {
    RiskLevel.NONE: "",
    RiskLevel.LOW: "green",
    RiskLevel.MEDIUM: "yellow",
    RiskLevel.HIGH: "red",
    RiskLevel.CRITICAL: "bold red",
}

RISK_LABELS = {
    RiskLevel.NONE: "无",
    RiskLevel.LOW: "低",
    RiskLevel.MEDIUM: "中",
    RiskLevel.HIGH: "高",
    RiskLevel.CRITICAL: "严重",
}


def format_markdown(
    report: Report,
    include_license: bool = True,
    include_risk: bool = True,
    include_changelog: bool = True,
) -> str:
    """将报告格式化为 Markdown。

    Args:
        report: 报告对象
        include_license: 是否包含许可证信息
        include_risk: 是否包含风险信息
        include_changelog: 是否包含更新记录内容

    Returns:
        Markdown 格式的字符串
    """
    try:
        lines = []
        lines.append("# 依赖版本变更报告")
        lines.append("")
        lines.append(f"- **生成时间**: {report.generated_at}")
        lines.append(f"- **锁文件(前)**: `{report.lockfile_before}`")
        lines.append(f"- **锁文件(后)**: `{report.lockfile_after}`")
        lines.append(f"- **生态系统**: `{report.ecosystem}`")
        lines.append(f"- **总变更数**: {report.total_changes}")
        if report.changelog_source:
            lines.append(f"- **更新记录来源**: `{report.changelog_source}`")
            lines.append(
                f"- **更新记录匹配**: {report.changelog_summary.get('with_notes', 0)} 个包有记录, "
                f"{report.changelog_summary.get('without_notes', 0)} 个包无记录"
            )
        lines.append("")

        lines.append("## 变更概览")
        lines.append("")
        lines.append("| 类型 | 数量 |")
        lines.append("| --- | ---: |")
        for ct in ChangeType:
            count = report.summary.get(ct.value, 0)
            if count > 0:
                lines.append(f"| {CHANGE_TYPE_LABELS_MD.get(ct, ct.value)} | {count} |")
        lines.append("")

        if include_license and report.license_summary:
            lines.append("## 许可证摘要")
            lines.append("")
            lines.append("| 许可证 | 包数量 | 包列表 |")
            lines.append("| --- | ---: | --- |")
            for lic_name in sorted(report.license_summary.keys()):
                packages = report.license_summary[lic_name]
                lines.append(
                    f"| {lic_name} | {len(packages)} | {', '.join(packages)} |"
                )
            lines.append("")

        if include_risk and report.risk_summary:
            lines.append("## 风险摘要")
            lines.append("")
            lines.append("| 风险等级 | 数量 |")
            lines.append("| --- | ---: |")
            for rl in RiskLevel:
                count = report.risk_summary.get(rl.value, 0)
                if count > 0:
                    lines.append(f"| {RISK_LABELS.get(rl, rl.value)} | {count} |")
            lines.append("")

        if report.changes:
            lines.append("## 详细变更")
            lines.append("")
            header_parts = ["| 包名", "变更类型", "版本(前)", "版本(后)"]
            if include_license:
                header_parts.append("许可证(前)")
                header_parts.append("许可证(后)")
            if include_risk:
                header_parts.append("风险")
                header_parts.append("风险原因")
            if include_changelog and report.changelog_source:
                header_parts.append("更新记录")
            header_parts.append("|")
            lines.append(" ".join(header_parts))

            sep_parts = ["| ---", "| ---", "| ---:", "| ---:"]
            if include_license:
                sep_parts.append("| ---")
                sep_parts.append("| ---")
            if include_risk:
                sep_parts.append("| ---")
                sep_parts.append("| ---")
            if include_changelog and report.changelog_source:
                sep_parts.append("| ---")
            sep_parts.append("|")
            lines.append(" ".join(sep_parts))

            for change in report.changes:
                row = [f"| {change.name}"]
                row.append(CHANGE_TYPE_LABELS_MD.get(change.change_type, change.change_type.value))
                row.append(change.version_before)
                row.append(change.version_after)

                if include_license:
                    lic_before = change.before.license.name if change.before else "-"
                    lic_after = change.after.license.name if change.after else "-"
                    if change.license_changed:
                        lic_after = f"**{lic_after}** ⚠️"
                    row.append(lic_before)
                    row.append(lic_after)

                if include_risk:
                    row.append(RISK_LABELS.get(change.risk.level, change.risk.level.value))
                    risk_reasons = "; ".join(change.risk.reasons) if change.risk.reasons else "-"
                    row.append(risk_reasons)

                if include_changelog and report.changelog_source:
                    if change.changelog_notes:
                        display_notes = change.changelog_notes[:3]
                        note_items = []
                        for i, note in enumerate(display_notes, 1):
                            clean = note.replace("|", "\\|")
                            if len(clean) > 80:
                                clean = clean[:77] + "..."
                            note_items.append(f"{i}. {clean}")
                        extra = ""
                        if len(change.changelog_notes) > 3:
                            extra = f" (+{len(change.changelog_notes) - 3}条)"
                        row.append("<br>".join(note_items) + extra)
                    else:
                        row.append("—")

                row.append("|")
                lines.append(" | ".join(row))

            lines.append("")

            if include_changelog and report.changelog_source:
                with_notes = [c for c in report.changes if c.changelog_notes]
                if with_notes:
                    lines.append("## 📝 更新记录详情")
                    lines.append("")
                    for change in with_notes:
                        lines.append(f"### {change.name}")
                        lines.append("")
                        lines.append(f"- **版本变化**: `{change.version_before}` → `{change.version_after}`")
                        lines.append(f"- **变更类型**: {CHANGE_TYPE_LABELS_MD.get(change.change_type, change.change_type.value)}")
                        lines.append("")
                        lines.append("**变更内容:**")
                        for note in change.changelog_notes:
                            lines.append(f"- {note}")
                        lines.append("")

            if include_risk:
                high_risk = [c for c in report.changes if c.risk.level in (RiskLevel.HIGH, RiskLevel.CRITICAL)]
                if high_risk:
                    lines.append("## ⚠️ 高风险变更详情")
                    lines.append("")
                    for change in high_risk:
                        lines.append(f"### {change.name} ({RISK_LABELS[change.risk.level]}风险)")
                        lines.append("")
                        lines.append(f"- **版本变化**: `{change.version_before}` → `{change.version_after}`")
                        lines.append(f"- **变更类型**: {CHANGE_TYPE_LABELS_MD.get(change.change_type, change.change_type.value)}")
                        lines.append("")
                        if change.risk.reasons:
                            lines.append("**风险原因:**")
                            for reason in change.risk.reasons:
                                lines.append(f"- {reason}")
                            lines.append("")
                        if change.risk.suggestions:
                            lines.append("**建议动作:**")
                            for suggestion in change.risk.suggestions:
                                lines.append(f"- {suggestion}")
                            lines.append("")

        return "\n".join(lines)
    except Exception as e:
        raise OutputError(
            f"格式化 Markdown 输出时出错: {type(e).__name__}: {e}",
            suggestion="这是一个内部错误，请检查报告数据是否完整。"
        ) from e


def format_json(report: Report, indent: int = 2) -> str:
    """将报告格式化为 JSON。

    Args:
        report: 报告对象
        indent: 缩进空格数

    Returns:
        JSON 格式的字符串
    """
    try:
        report_dict = report.to_dict()
        return json.dumps(report_dict, ensure_ascii=False, indent=indent)
    except (TypeError, ValueError) as e:
        raise OutputError(
            f"序列化 JSON 输出时出错: {e}",
            suggestion="报告中可能包含无法序列化的数据类型。"
        ) from e


def format_console_table(
    report: Report,
    include_license: bool = True,
    include_risk: bool = True,
    include_changelog: bool = True,
) -> str:
    """将报告格式化为终端表格（使用 Rich）。

    Args:
        report: 报告对象
        include_license: 是否包含许可证信息
        include_risk: 是否包含风险信息
        include_changelog: 是否包含更新记录内容

    Returns:
        格式化后的字符串
    """
    try:
        console = Console(record=True, force_terminal=False)

        report.compute_summaries()

        console.print()
        console.print("[bold cyan]📦 依赖版本变更报告[/bold cyan]")
        console.print()
        console.print(f"  [dim]生成时间:[/dim] {report.generated_at}")
        console.print(f"  [dim]锁文件(前):[/dim] {report.lockfile_before}")
        console.print(f"  [dim]锁文件(后):[/dim] {report.lockfile_after}")
        console.print(f"  [dim]生态系统:[/dim] {report.ecosystem}")
        console.print(f"  [dim]总变更数:[/dim] [bold]{report.total_changes}[/bold]")
        if report.changelog_source:
            console.print(f"  [dim]更新记录来源:[/dim] {report.changelog_source}")
            console.print(
                f"  [dim]更新记录匹配:[/dim] "
                f"[green]{report.changelog_summary.get('with_notes', 0)}[/green] 个包有记录, "
                f"[dim]{report.changelog_summary.get('without_notes', 0)}[/dim] 个包无记录"
            )
        console.print()

        summary_table = RichTable(title="📊 变更概览", show_header=True, header_style="bold magenta")
        summary_table.add_column("类型", style="cyan")
        summary_table.add_column("数量", justify="right", style="bold")
        for ct in ChangeType:
            count = report.summary.get(ct.value, 0)
            if count > 0:
                summary_table.add_row(CHANGE_TYPE_LABELS.get(ct, ct.value), str(count))
        console.print(summary_table)
        console.print()

        if include_license and report.license_summary:
            lic_table = RichTable(title="📜 许可证摘要", show_header=True, header_style="bold magenta")
            lic_table.add_column("许可证", style="green")
            lic_table.add_column("数量", justify="right")
            lic_table.add_column("包列表", style="dim")
            for lic_name in sorted(report.license_summary.keys()):
                packages = report.license_summary[lic_name]
                lic_table.add_row(lic_name, str(len(packages)), ", ".join(packages))
            console.print(lic_table)
            console.print()

        if include_risk and report.risk_summary:
            risk_table = RichTable(title="⚠️ 风险摘要", show_header=True, header_style="bold magenta")
            risk_table.add_column("等级", style="bold")
            risk_table.add_column("数量", justify="right")
            for rl in RiskLevel:
                count = report.risk_summary.get(rl.value, 0)
                if count > 0:
                    style = RISK_STYLES.get(rl, "")
                    risk_table.add_row(
                        f"[{style}]{RISK_LABELS.get(rl, rl.value)}[/{style}]",
                        str(count),
                    )
            console.print(risk_table)
            console.print()

        if report.changes:
            detail_table = RichTable(
                title="📝 详细变更",
                show_header=True,
                header_style="bold magenta",
                expand=True,
            )
            detail_table.add_column("包名", style="bold cyan", no_wrap=True)
            detail_table.add_column("类型", no_wrap=True)
            detail_table.add_column("版本(前)", justify="right", style="dim")
            detail_table.add_column("版本(后)", justify="right", style="bold")
            if include_license:
                detail_table.add_column("许可证(前)", style="dim")
                detail_table.add_column("许可证(后)")
            if include_risk:
                detail_table.add_column("风险")
                detail_table.add_column("原因", overflow="fold")
            if include_changelog and report.changelog_source:
                detail_table.add_column("更新记录", overflow="fold", max_width=40)

            for change in report.changes:
                ct_style = ""
                if change.change_type == ChangeType.MAJOR:
                    ct_style = "bold red"
                elif change.change_type == ChangeType.MINOR:
                    ct_style = "yellow"
                elif change.change_type == ChangeType.PATCH:
                    ct_style = "green"
                elif change.change_type == ChangeType.ADDED:
                    ct_style = "bold blue"
                elif change.change_type == ChangeType.REMOVED:
                    ct_style = "strike dim"

                row = [
                    change.name,
                    f"[{ct_style}]{CHANGE_TYPE_LABELS.get(change.change_type, change.change_type.value)}[/{ct_style}]",
                    change.version_before,
                    change.version_after,
                ]

                if include_license:
                    lic_before = change.before.license.name if change.before else "-"
                    lic_after = change.after.license.name if change.after else "-"
                    if change.license_changed:
                        lic_after = f"[bold red]{lic_after} ⚠️[/bold red]"
                    row.extend([lic_before, lic_after])

                if include_risk:
                    risk_style = RISK_STYLES.get(change.risk.level, "")
                    risk_text = f"[{risk_style}]{RISK_LABELS.get(change.risk.level, change.risk.level.value)}[/{risk_style}]" if risk_style else RISK_LABELS.get(change.risk.level, change.risk.level.value)
                    risk_reasons = "\n".join(change.risk.reasons) if change.risk.reasons else "-"
                    row.extend([risk_text, risk_reasons])

                if include_changelog and report.changelog_source:
                    if change.changelog_notes:
                        display_notes = change.changelog_notes[:3]
                        note_lines = []
                        for i, note in enumerate(display_notes, 1):
                            if len(note) > 60:
                                note = note[:57] + "..."
                            note_lines.append(f"{i}. {note}")
                        extra = ""
                        if len(change.changelog_notes) > 3:
                            extra = f"\n[dim](+{len(change.changelog_notes) - 3}条)[/dim]"
                        row.append("\n".join(note_lines) + extra)
                    else:
                        row.append("[dim]—[/dim]")

                detail_table.add_row(*row)

            console.print(detail_table)
            console.print()

            if include_changelog and report.changelog_source:
                with_notes = [c for c in report.changes if c.changelog_notes]
                if with_notes:
                    console.print("[bold blue]📝 更新记录详情[/bold blue]")
                    console.print()
                    for change in with_notes:
                        console.print(
                            f"  [bold cyan]{change.name}[/bold cyan] "
                            f"[dim]{change.version_before}[/dim] → "
                            f"[bold]{change.version_after}[/bold]"
                        )
                        for note in change.changelog_notes:
                            if len(note) > 120:
                                note = note[:117] + "..."
                            console.print(f"    • {note}")
                        console.print()

            high_risk = [c for c in report.changes if c.risk.level in (RiskLevel.HIGH, RiskLevel.CRITICAL)]
            if high_risk and include_risk:
                console.print("[bold red]🚨 高风险变更详情[/bold red]")
                console.print()
                for change in high_risk:
                    console.print(
                        f"  [bold]{change.name}[/bold] "
                        f"[bold {RISK_STYLES.get(change.risk.level, 'red')}]"
                        f"({RISK_LABELS[change.risk.level]}风险)"
                        f"[/bold {RISK_STYLES.get(change.risk.level, 'red')}]"
                    )
                    console.print(
                        f"    版本: [dim]{change.version_before}[/dim] → "
                        f"[bold]{change.version_after}[/bold]"
                    )
                    if change.risk.reasons:
                        console.print("    [yellow]风险原因:[/yellow]")
                        for reason in change.risk.reasons:
                            console.print(f"      • {reason}")
                    if change.risk.suggestions:
                        console.print("    [green]建议动作:[/green]")
                        for suggestion in change.risk.suggestions:
                            console.print(f"      → {suggestion}")
                    console.print()

        return console.export_text()
    except Exception as e:
        raise OutputError(
            f"格式化终端输出时出错: {type(e).__name__}: {e}",
            suggestion="这是一个内部错误，请检查报告数据是否完整。"
        ) from e


def write_output(
    content: str,
    output_file: Optional[str] = None,
    stream: Optional[TextIO] = None,
) -> None:
    """将输出内容写入文件或流。

    Args:
        content: 要写入的内容
        output_file: 输出文件路径，None 表示写入 stream
        stream: 输出流，默认 stdout

    Raises:
        OutputError: 写入失败时抛出
    """
    if output_file:
        try:
            path = Path(output_file)
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
                if not content.endswith("\n"):
                    f.write("\n")
        except OSError as e:
            raise OutputError(
                f"写入输出文件 {output_file} 失败: {e}",
                suggestion=f"请确认目录 {path.parent} 是否存在且可写，磁盘空间是否充足。"
            ) from e
    else:
        target = stream or sys.stdout
        try:
            target.write(content)
            if not content.endswith("\n"):
                target.write("\n")
            target.flush()
        except OSError as e:
            raise OutputError(
                f"写入输出流失败: {e}",
                suggestion="请确认输出流是否可用，没有被关闭。"
            ) from e


def render_report(
    report: Report,
    output_format: str = "table",
    output_file: Optional[str] = None,
    markdown: bool = False,
    include_license: bool = True,
    include_risk: bool = True,
    include_changelog: bool = True,
) -> str:
    """渲染报告到指定格式。

    Args:
        report: 报告对象
        output_format: 'table', 'markdown', 'json'
        output_file: 输出文件路径
        markdown: 如果为 True，使用 markdown 格式（与 output_format 兼容）
        include_license: 是否包含许可证信息
        include_risk: 是否包含风险信息
        include_changelog: 是否包含更新记录内容

    Returns:
        渲染后的字符串内容
    """
    fmt = output_format.lower()
    if markdown:
        fmt = "markdown"

    if fmt in ("table", "console", "text"):
        content = format_console_table(report, include_license, include_risk, include_changelog)
    elif fmt in ("md", "markdown"):
        content = format_markdown(report, include_license, include_risk, include_changelog)
    elif fmt == "json":
        content = format_json(report)
    else:
        raise OutputError(
            f"未知的输出格式: {output_format}",
            suggestion="支持的输出格式: table, markdown, json。请使用 --output-format 指定。"
        )

    write_output(content, output_file)
    return content


def create_report(
    changes,
    lockfile_before: str,
    lockfile_after: str,
    ecosystem: str,
) -> Report:
    """创建报告对象并计算汇总数据。"""
    report = Report(
        generated_at=datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        lockfile_before=lockfile_before,
        lockfile_after=lockfile_after,
        ecosystem=ecosystem,
        changes=list(changes),
    )
    report.compute_summaries()
    return report
