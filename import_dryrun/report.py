"""
报告生成器模块。

提供:
    - 人类可读的彩色终端输出 (Rich)
    - 详细模式 (verbose)
    - 机器可读的 JSON 输出
    - 报告写入文件
"""

from __future__ import annotations

import json
from datetime import datetime
from io import StringIO
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.syntax import Syntax
    from rich import box
    _HAS_RICH = True
except ImportError:  # pragma: no cover
    _HAS_RICH = False

from .config import AppConfig
from .errors import ErrorGrouper, RepairAdvisor
from .models import ErrorGroup, ImportResult, ImportRecord, ErrorCategory


class ReportGenerator:
    """报告生成器。"""

    def __init__(
        self,
        config: AppConfig,
        sample_errors: int = 5,
    ) -> None:
        self._config = config
        self._sample_errors = sample_errors
        self._use_color = config.color and _HAS_RICH
        self._verbose = config.verbose

        if self._use_color:
            self._console = Console(
                color_system="auto",
                force_terminal=True,
            )
            self._stringio = StringIO()
            self._capture_console = Console(
                file=self._stringio,
                color_system=None,
                force_terminal=False,
            )
        else:
            self._console = None
            self._capture_console = None
            self._stringio = None

    # ------------------------------------------------------------------
    #  对外入口
    # ------------------------------------------------------------------
    def generate(self, result: ImportResult) -> str:
        """根据配置生成对应格式的报告。"""
        if self._config.machine_output:
            return self._generate_machine(result)

        groups = ErrorGrouper(sample_count=self._sample_errors).group_result(result)
        advisor = RepairAdvisor()

        if self._use_color:
            return self._generate_rich(result, groups, advisor)
        else:
            return self._generate_plain(result, groups, advisor)

    def write_to_file(self, result: ImportResult, path: str) -> None:
        """将报告写入文件。"""
        report = self.generate(result)
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(report)

    # ------------------------------------------------------------------
    #  机器可读 (JSON)
    # ------------------------------------------------------------------
    def _generate_machine(self, result: ImportResult) -> str:
        groups = ErrorGrouper(sample_count=self._sample_errors).group_result(result)
        advisor = RepairAdvisor()

        data: Dict[str, Any] = {
            "summary": {
                "target_table": result.target_table,
                "input_file": result.input_file,
                "total_records": result.total_records,
                "processed_count": result.processed_count,
                "skipped_count": result.skipped_count,
                "failed_count": result.failed_count,
                "duration_seconds": round(result.duration_seconds, 4),
                "is_dry_run": result.is_dry_run,
                "limit_applied": result.limit_applied,
                "started_at": result.started_at.isoformat(),
                "finished_at": result.finished_at.isoformat()
                if result.finished_at
                else None,
            },
            "error_groups": [
                {
                    "category": g.category.value,
                    "category_label": g.category.label,
                    "target_field": g.target_field,
                    "count": g.count,
                    "suggestion": g.suggestion,
                    "samples": [
                        {
                            "row_number": e.row_number,
                            "source_field": e.source_field,
                            "target_field": e.target_field,
                            "message": e.message,
                            "actual_value": e.actual_value,
                            "expected_value": e.expected_value,
                            "suggestion": e.suggestion,
                        }
                        for e in g.sample_errors
                    ],
                }
                for g in groups
            ],
            "repair_summary": advisor.generate_summary(groups),
            "field_actions": advisor.list_field_actions(groups),
        }

        if self._verbose:
            data["records"] = self._records_to_json(result)

        return json.dumps(data, ensure_ascii=False, indent=2, default=str)

    @staticmethod
    def _records_to_json(result: ImportResult) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        for rec in result.records:
            out.append(
                {
                    "row_number": rec.row_number,
                    "is_valid": rec.is_valid,
                    "skipped": rec.skipped,
                    "skip_reason": rec.skip_reason,
                    "source_data": rec.source_data,
                    "target_data": rec.target_data,
                    "errors": [
                        {
                            "category": e.category.value,
                            "target_field": e.target_field,
                            "source_field": e.source_field,
                            "message": e.message,
                            "actual_value": e.actual_value,
                            "expected_value": e.expected_value,
                            "suggestion": e.suggestion,
                        }
                        for e in rec.errors
                    ],
                }
            )
        return out

    # ------------------------------------------------------------------
    #  Rich 彩色输出
    # ------------------------------------------------------------------
    def _generate_rich(
        self,
        result: ImportResult,
        groups: List[ErrorGroup],
        advisor: RepairAdvisor,
    ) -> str:
        assert self._console is not None
        c = self._capture_console
        assert c is not None

        c.print()
        self._print_title_rich(c, result)
        c.print()
        self._print_summary_rich(c, result)
        c.print()

        if groups:
            self._print_errors_rich(c, groups)
            c.print()
            self._print_advisor_rich(c, advisor, groups)
            c.print()

        if self._verbose:
            self._print_records_rich(c, result)

        return self._stringio.getvalue()

    def _print_title_rich(self, c, result: ImportResult) -> None:
        mode = "[bold green]DRY-RUN[/bold green]" if result.is_dry_run else "[bold yellow]正式导入[/bold yellow]"
        title_parts = [
            f"[bold]数据导入模拟报告[/bold]",
            f"目标表: [cyan]{result.target_table}[/cyan]",
            f"模式: {mode}",
        ]
        if result.input_file:
            title_parts.append(f"输入文件: [dim]{result.input_file}[/dim]")
        c.print(Panel("  |  ".join(title_parts), border_style="blue"))

    def _print_summary_rich(self, c, result: ImportResult) -> None:
        table = Table(
            title="📊 执行摘要",
            show_header=True,
            header_style="bold magenta",
            box=box.ROUNDED,
        )
        table.add_column("指标", style="bold")
        table.add_column("数值", justify="right")
        table.add_column("说明", style="dim")

        table.add_row("总记录数", str(result.total_records), "输入数据总行数")
        table.add_row(
            "[green]✓ 处理成功[/green]",
            f"[bold green]{result.processed_count}[/bold green]",
            "无错误的记录数",
        )
        table.add_row(
            "[yellow]⏭  已跳过[/yellow]",
            f"[bold yellow]{result.skipped_count}[/bold yellow]",
            "空行等自动跳过",
        )
        table.add_row(
            "[red]✗ 失败[/red]",
            f"[bold red]{result.failed_count}[/bold red]",
            "存在错误需修复",
        )
        table.add_row(
            "耗时",
            f"{result.duration_seconds:.2f}s",
            "模拟执行耗时",
        )
        if result.limit_applied is not None:
            table.add_row(
                "Limit 限制",
                str(result.limit_applied),
                "[dim]仅处理前 N 条[/dim]",
            )

        c.print(table)

        success_rate = 0
        if result.total_records > 0:
            success_rate = result.processed_count / result.total_records * 100
        bar_len = 30
        filled = int(bar_len * (success_rate / 100))
        bar = "█" * filled + "░" * (bar_len - filled)
        c.print(
            f"成功率: [bold]{success_rate:5.1f}%[/bold]  [{bar}]"
        )

    def _print_errors_rich(self, c, groups: List[ErrorGroup]) -> None:
        table = Table(
            title="❌ 错误分组统计",
            show_header=True,
            header_style="bold red",
            box=box.ROUNDED,
        )
        table.add_column("#", style="dim", justify="right")
        table.add_column("错误类型", style="bold")
        table.add_column("字段", style="cyan")
        table.add_column("数量", justify="right", style="bold red")

        for i, g in enumerate(groups, 1):
            table.add_row(
                str(i),
                g.category.label,
                g.target_field or "-",
                str(g.count),
            )
        c.print(table)
        c.print()

        for idx, g in enumerate(groups, 1):
            field_label = f" / [cyan]{g.target_field}[/cyan]" if g.target_field else ""
            c.print(
                f"[bold red]{idx}. {g.category.label}{field_label}[/bold red] "
                f"[dim]({g.count} 条)[/dim]"
            )

            sample_table = Table(
                show_header=True,
                header_style="bold dim",
                box=box.SIMPLE,
                expand=False,
            )
            sample_table.add_column("行号", justify="right")
            sample_table.add_column("错误信息", style="red")
            sample_table.add_column("实际值", style="yellow")

            for e in g.sample_errors:
                sample_table.add_row(
                    str(e.row_number or "-"),
                    e.message,
                    e.actual_value or "-",
                )
            c.print(sample_table)

            if g.suggestion:
                c.print(
                    Panel(
                        g.suggestion,
                        title="[bold green]💡 修复建议[/bold green]",
                        border_style="green",
                    )
                )
            c.print()

    def _print_advisor_rich(
        self, c, advisor: RepairAdvisor, groups: List[ErrorGroup]
    ) -> None:
        summary = advisor.generate_summary(groups)
        lines = summary.splitlines()
        c.print(
            Panel(
                "\n".join(lines),
                title="[bold]🛠  修复顾问[/bold]",
                border_style="magenta",
            )
        )

        actions = advisor.list_field_actions(groups)
        if actions:
            c.print()
            c.print("[bold]按字段修复动作清单:[/bold]")
            tbl = Table(
                show_header=True,
                header_style="bold cyan",
                box=box.SIMPLE,
            )
            tbl.add_column("字段", style="cyan")
            tbl.add_column("类型")
            tbl.add_column("数量", justify="right")
            tbl.add_column("建议动作")
            for a in actions:
                tbl.add_row(
                    str(a["field"]),
                    str(a["category"]),
                    str(a["count"]),
                    str(a["action"]),
                )
            c.print(tbl)

    def _print_records_rich(self, c, result: ImportResult) -> None:
        c.print()
        title = f"📋 详细记录 ({len(result.records)} 条)"
        c.print(f"[bold]{title}[/bold]")
        for rec in result.records:
            status_icon = (
                "[green]✓[/green]" if rec.is_valid
                else "[yellow]⏭[/yellow]" if rec.skipped
                else "[red]✗[/red]"
            )
            c.print(
                f"  {status_icon} 行 #{rec.row_number}: "
                f"[dim]源={self._truncate_dict(rec.source_data)}[/dim]"
            )
            if rec.errors:
                for e in rec.errors:
                    c.print(f"      [red]• {e.category.label}: {e.message}[/red]")
            if rec.target_data and rec.is_valid:
                c.print(
                    f"      [green]→ 目标={self._truncate_dict(rec.target_data)}[/green]"
                )

    @staticmethod
    def _truncate_dict(d: Dict[str, Any], max_chars: int = 120) -> str:
        items = []
        total = 0
        for k, v in d.items():
            s = f"{k}={v!r}"
            if total + len(s) > max_chars:
                items.append("...")
                break
            items.append(s)
            total += len(s) + 2
        return "{" + ", ".join(items) + "}"

    # ------------------------------------------------------------------
    #  纯文本输出 (无 Rich)
    # ------------------------------------------------------------------
    def _generate_plain(
        self,
        result: ImportResult,
        groups: List[ErrorGroup],
        advisor: RepairAdvisor,
    ) -> str:
        lines: List[str] = []
        lines.append("=" * 72)
        lines.append("数据导入模拟报告")
        mode = "DRY-RUN" if result.is_dry_run else "正式导入"
        lines.append(f"目标表: {result.target_table}  |  模式: {mode}")
        if result.input_file:
            lines.append(f"输入文件: {result.input_file}")
        lines.append("=" * 72)
        lines.append("")

        lines.append("---- 执行摘要 ----")
        lines.append(f"  总记录数: {result.total_records}")
        lines.append(f"  ✓ 处理成功: {result.processed_count}")
        lines.append(f"  ⏭  已跳过: {result.skipped_count}")
        lines.append(f"  ✗ 失败: {result.failed_count}")
        lines.append(f"  耗时: {result.duration_seconds:.2f}s")
        if result.limit_applied is not None:
            lines.append(f"  Limit 限制: {result.limit_applied}")
        success_rate = 0
        if result.total_records > 0:
            success_rate = result.processed_count / result.total_records * 100
        lines.append(f"  成功率: {success_rate:5.1f}%")
        lines.append("")

        if groups:
            lines.append("---- 错误分组统计 ----")
            lines.append(
                f"  {'#':>2}  {'错误类型':<14}  {'字段':<16}  {'数量':>6}"
            )
            lines.append(f"  {'-'*2}  {'-'*14}  {'-'*16}  {'-'*6}")
            for i, g in enumerate(groups, 1):
                lines.append(
                    f"  {i:>2}  {g.category.label:<14}  "
                    f"{(g.target_field or '-'):<16}  {g.count:>6}"
                )
            lines.append("")

            for idx, g in enumerate(groups, 1):
                field_label = f" / {g.target_field}" if g.target_field else ""
                lines.append(
                    f"[{idx}] {g.category.label}{field_label} ({g.count} 条)"
                )
                lines.append(f"  样例:")
                lines.append(f"    {'行号':>6}  错误信息")
                lines.append(f"    {'-'*6}  {'-'*40}")
                for e in g.sample_errors:
                    msg = e.message
                    if len(msg) > 60:
                        msg = msg[:57] + "..."
                    lines.append(
                        f"    {str(e.row_number or '-'):>6}  {msg}"
                    )
                if g.suggestion:
                    lines.append("")
                    lines.append(f"  修复建议:")
                    for sub in g.suggestion.splitlines():
                        lines.append(f"    {sub}")
                lines.append("")

        lines.append("---- 修复顾问 ----")
        for sub in advisor.generate_summary(groups).splitlines():
            lines.append(f"  {sub}")
        lines.append("")

        actions = advisor.list_field_actions(groups)
        if actions:
            lines.append("---- 按字段修复动作 ----")
            for a in actions:
                lines.append(
                    f"  - {a['field']}: {a['action']} (共 {a['count']} 处 {a['category']})"
                )
            lines.append("")

        if self._verbose:
            lines.append("---- 详细记录 ----")
            for rec in result.records:
                status = "✓" if rec.is_valid else "⏭" if rec.skipped else "✗"
                lines.append(
                    f"  {status} 行 #{rec.row_number}: 源={rec.source_data}"
                )
                if rec.errors:
                    for e in rec.errors:
                        lines.append(f"    - {e.category.label}: {e.message}")
                if rec.target_data and rec.is_valid:
                    lines.append(f"    → 目标={rec.target_data}")

        return "\n".join(lines)
