import json
import sys
from pathlib import Path
from typing import List, Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich import box

from i18n_checker import check_i18n, I18nReport, flatten_keys, load_json_file, suggest_fix

app = typer.Typer(
    name="i18n-checker",
    help="国际化缺失 key 检查 CLI 工具 - 面向前端团队的翻译质量检测",
    no_args_is_help=True,
)
console = Console()


def _render_locale_stats_table(report: I18nReport) -> None:
    table = Table(
        title="🌍 各语言翻译状态统计",
        box=box.ROUNDED,
        header_style="bold magenta",
    )
    table.add_column("语言 (Locale)", style="cyan", justify="center")
    table.add_column("已有翻译", style="green", justify="right")
    table.add_column("缺失 key", style="red", justify="right")
    table.add_column("占位符错误", style="yellow", justify="right")
    table.add_column("完成度", style="blue", justify="right")

    for locale, stats in report.locale_stats.items():
        total = stats["present"] + stats["missing"]
        completion = (stats["present"] / total * 100) if total > 0 else 0.0
        completion_str = f"{completion:.1f}%"
        missing_style = "bold red" if stats["missing"] > 0 else "green"
        ph_style = "bold yellow" if stats["placeholder_mismatches"] > 0 else "green"
        table.add_row(
            locale,
            str(stats["present"]),
            Text(str(stats["missing"]), style=missing_style),
            Text(str(stats["placeholder_mismatches"]), style=ph_style),
            completion_str,
        )

    console.print(table)


def _render_missing_keys_table(report: I18nReport, source_flat: dict) -> None:
    for locale, missing in report.missing_keys.items():
        if not missing:
            continue

        table = Table(
            title=f"❌ [{locale}] 缺失的翻译 Key ({len(missing)} 个)",
            box=box.ROUNDED,
            header_style="bold red",
            show_lines=True,
        )
        table.add_column("#", style="dim", justify="right", width=4)
        table.add_column("Key", style="cyan", overflow="fold")
        table.add_column("源语言参考值 (保留占位符)", style="green", overflow="fold")
        table.add_column("修复建议", style="yellow", overflow="fold")

        for idx, key in enumerate(missing[:50], 1):
            source_value = source_flat.get(key, "")
            suggestion = suggest_fix(key, source_value, locale)
            table.add_row(
                str(idx),
                key,
                source_value,
                suggestion["note"],
            )

        if len(missing) > 50:
            console.print(table)
            console.print(
                Panel(
                    f"[dim]还有 {len(missing) - 50} 个缺失 key 未显示，请使用 --json 查看完整列表[/dim]",
                    border_style="yellow",
                )
            )
        else:
            console.print(table)


def _render_placeholder_mismatches(report: I18nReport, source_flat: dict) -> None:
    if not report.placeholder_mismatches:
        return

    name_count = sum(1 for m in report.placeholder_mismatches if m.mismatch_type == "name")
    format_count = sum(1 for m in report.placeholder_mismatches if m.mismatch_type == "format")
    title_parts = [f"共 {len(report.placeholder_mismatches)} 处"]
    if name_count:
        title_parts.append(f"名称错误: {name_count}")
    if format_count:
        title_parts.append(f"格式错误: {format_count}")

    table = Table(
        title="⚠️  严重错误：占位符不一致 (" + "，".join(title_parts) + ")",
        box=box.ROUNDED,
        header_style="bold yellow",
        show_lines=True,
    )
    table.add_column("#", style="dim", justify="right", width=4)
    table.add_column("语言", style="cyan", justify="center")
    table.add_column("类型", style="yellow", justify="center")
    table.add_column("Key", style="magenta", overflow="fold")
    table.add_column("源占位符 (名称)\n源参考值", style="green", overflow="fold")
    table.add_column("目标占位符 (名称)\n目标值", style="red", overflow="fold")

    for idx, m in enumerate(report.placeholder_mismatches, 1):
        src_ph = ", ".join(m.source_placeholders) if m.source_placeholders else "(无)"
        tgt_ph = ", ".join(m.target_placeholders) if m.target_placeholders else "(无)"
        src_names = ", ".join(m.source_names) if m.source_names else "(无)"
        tgt_names = ", ".join(m.target_names) if m.target_names else "(无)"

        type_text = (
            Text("名称", style="bold red") if m.mismatch_type == "name"
            else Text("格式", style="bold orange3")
        )
        type_desc = (
            "(占位符变量名不同)" if m.mismatch_type == "name"
            else "(格式不同，如 :email vs {email})"
        )

        src_ref = source_flat.get(m.key, "")
        tgt_ref_display = ""

        src_cell = Text.assemble(
            (f"{src_ph}\n", "bold green"),
            (f"({src_names})\n", "dim"),
            (src_ref, "green"),
        )
        tgt_cell = Text.assemble(
            (f"{tgt_ph}\n", "bold red"),
            (f"({tgt_names})\n", "dim"),
            (tgt_ref_display, "red"),
        )

        table.add_row(
            str(idx),
            m.locale,
            Text.assemble(type_text, f"\n{type_desc}", style="dim"),
            m.key,
            src_cell,
            tgt_cell,
        )

    console.print(table)
    console.print(
        Panel(
            "[bold yellow]说明:[/bold yellow] 占位符不一致是严重错误，会导致运行时模板渲染失败。\n"
            "[yellow]修复时请严格保留源语言中的占位符名称和格式，仅翻译文案部分。[/yellow]",
            border_style="yellow",
        )
    )


def _render_unused_keys(report: I18nReport) -> None:
    if not report.unused_keys:
        return

    table = Table(
        title=f"💡 建议清单：可能未使用的 Key ({len(report.unused_keys)} 个)",
        box=box.ROUNDED,
        header_style="bold blue",
    )
    table.add_column("#", style="dim", justify="right", width=4)
    table.add_column("Key", style="blue", overflow="fold")
    table.add_column("建议", style="yellow")

    for idx, key in enumerate(report.unused_keys[:30], 1):
        table.add_row(str(idx), key, "确认代码中是否真的未使用，可考虑删除")

    console.print(table)
    if len(report.unused_keys) > 30:
        console.print(
            Panel(
                f"[dim]还有 {len(report.unused_keys) - 30} 个未使用 key 未显示，请使用 --json 查看完整列表[/dim]",
                border_style="blue",
            )
        )


def _render_duplicates(report: I18nReport) -> None:
    if not report.duplicate_values:
        return

    table = Table(
        title=f"🔁 重复文案检测 ({len(report.duplicate_values)} 组)",
        box=box.ROUNDED,
        header_style="bold magenta",
        show_lines=True,
    )
    table.add_column("#", style="dim", justify="right", width=4)
    table.add_column("重复的 Key 列表", style="cyan", overflow="fold")
    table.add_column("相同文案值", style="green", overflow="fold")

    for idx, (value, keys) in enumerate(report.duplicate_values.items(), 1):
        table.add_row(
            str(idx),
            "\n".join(keys),
            value,
        )

    console.print(table)


def _render_summary(report: I18nReport, fail_on_missing: bool) -> None:
    total_missing = sum(len(v) for v in report.missing_keys.values())
    has_errors = report.has_errors(fail_on_missing=fail_on_missing)

    status_text = Text()
    if has_errors:
        status_text.append("❌ 检测到严重错误\n", style="bold red")
        if report.placeholder_mismatches:
            status_text.append(
                f"   • 占位符不一致: {len(report.placeholder_mismatches)} 处 (必须修复)\n",
                style="red",
            )
        if fail_on_missing and total_missing > 0:
            status_text.append(f"   • 缺失翻译: {total_missing} 个 (已启用 --fail-on-missing)\n", style="red")
    else:
        status_text.append("✅ 所有检查通过", style="bold green")

    if report.unused_keys:
        status_text.append(f"\n💡 未使用 key: {len(report.unused_keys)} 个 (建议清理)", style="blue")

    if report.duplicate_values:
        status_text.append(f"\n🔁 重复文案: {len(report.duplicate_values)} 组 (建议合并)", style="magenta")

    console.print(Panel(status_text, title="📊 检查结果汇总", border_style="green" if not has_errors else "red"))


def _auto_detect_targets(source_file: str) -> dict:
    source_path = Path(source_file)
    parent = source_path.parent
    locale_dir = parent if parent.name in ("locales", "i18n", "lang", "translations") else parent

    targets = {}
    source_name = source_path.stem

    for f in sorted(locale_dir.glob("*.json")):
        if f.resolve() == source_path.resolve():
            continue
        locale = f.stem
        if locale != source_name:
            targets[locale] = str(f)

    return targets


@app.command("check")
def check(
    source: str = typer.Argument(..., help="源语言 JSON 文件路径 (例如: locales/en.json)"),
    targets: Optional[List[str]] = typer.Option(
        None,
        "--target",
        "-t",
        help="目标语言文件，格式如 -t locales/zh-CN.json -t locales/ja.json。不指定则自动扫描同目录 JSON",
    ),
    code_dir: Optional[List[str]] = typer.Option(
        None,
        "--code-dir",
        "-c",
        help="源代码目录，用于检测未使用的 key (可多次指定)",
    ),
    locale_filter: Optional[List[str]] = typer.Option(
        None,
        "--locale",
        "-l",
        help="只检查指定语言 (可多次指定，如 -l zh-CN -l ja)",
    ),
    fail_on_missing: bool = typer.Option(
        False,
        "--fail-on-missing",
        help="存在缺失翻译时返回非零退出码 (占位符不一致始终返回非零)",
    ),
    output_json: bool = typer.Option(
        False,
        "--json",
        help="以 JSON 格式输出报告，便于 CI/CD 集成",
    ),
    output_file: Optional[str] = typer.Option(
        None,
        "--output",
        "-o",
        help="将报告写入文件 (配合 --json 使用)",
    ),
):
    """
    检查国际化翻译文件的完整性、一致性和质量。

    检测内容：缺失翻译、未使用 key、占位符不一致、重复文案。
    """
    try:
        source_path = Path(source)
        if not source_path.exists():
            console.print(f"[bold red]错误:[/bold red] 源文件不存在: {source}", )
            raise typer.Exit(code=2)

        target_map: dict = {}
        if targets:
            for t in targets:
                t_path = Path(t)
                if not t_path.exists():
                    console.print(f"[bold yellow]警告:[/bold yellow] 目标文件不存在: {t}")
                    continue
                target_map[t_path.stem] = t
        else:
            target_map = _auto_detect_targets(source)
            if not target_map:
                console.print(
                    "[bold yellow]警告:[/bold yellow] 未自动检测到目标语言文件，请使用 --target 指定"
                )

        source_data = load_json_file(source)
        source_flat = flatten_keys(source_data)

        report = check_i18n(
            source_file=source,
            target_files=target_map,
            code_dirs=code_dir,
            specific_locales=locale_filter if locale_filter else None,
        )

        if output_json:
            report_dict = report.to_dict()
            json_str = json.dumps(report_dict, ensure_ascii=False, indent=2)
            if output_file:
                Path(output_file).write_text(json_str, encoding="utf-8")
                console.print(f"[green]JSON 报告已写入:[/green] {output_file}")
            else:
                sys.stdout.write(json_str + "\n")
        else:
            console.print(
                Panel.fit(
                    "[bold cyan]i18n-checker[/bold cyan] - 国际化翻译质量检测工具",
                    border_style="cyan",
                )
            )
            console.print(f"[dim]源文件: {source} | 总 Key 数: {report.total_source_keys}[/dim]\n")

            _render_locale_stats_table(report)
            _render_missing_keys_table(report, source_flat)
            _render_placeholder_mismatches(report, source_flat)
            _render_unused_keys(report)
            _render_duplicates(report)
            _render_summary(report, fail_on_missing)

        if report.has_errors(fail_on_missing=fail_on_missing):
            raise typer.Exit(code=1)

    except FileNotFoundError as e:
        console.print(f"[bold red]错误:[/bold red] {e}")
        raise typer.Exit(code=2)
    except json.JSONDecodeError as e:
        console.print(f"[bold red]JSON 解析错误:[/bold red] {e}")
        raise typer.Exit(code=2)


@app.command("list-locales")
def list_locales(
    source: str = typer.Argument(..., help="源语言 JSON 文件路径"),
):
    """列出源文件同目录下检测到的所有可用语言文件"""
    targets = _auto_detect_targets(source)
    if not targets:
        console.print("[yellow]未检测到其他语言文件[/yellow]")
        return

    table = Table(box=box.ROUNDED, header_style="bold cyan")
    table.add_column("语言 (Locale)", style="magenta")
    table.add_column("文件路径", style="green")

    for locale, path in sorted(targets.items()):
        table.add_row(locale, path)

    console.print(table)


if __name__ == "__main__":
    app()
