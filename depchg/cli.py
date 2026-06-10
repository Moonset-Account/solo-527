"""DepChg CLI 主程序入口。

基于 Typer 的命令行界面，支持子命令结构、参数校验和详细帮助信息。
"""

from __future__ import annotations

import enum
import json
import sys
from typing import List, Optional

import click
import typer
from rich.console import Console
from rich.panel import Panel

from . import __version__, exit_codes
from .config import build_config, AppConfig
from .core import generate_report, run_with_config, determine_exit_code
from .exceptions import DepChgError, ValidationError
from .formatter import format_json, format_markdown, render_report, write_output
from .logging_config import get_logger, setup_logging
from .models import RiskLevel, Report

app = typer.Typer(
    name="depchg",
    help=(
        "📦 依赖版本变更报告工具\n\n"
        "面向开源维护者的日常工作流，支持：\n"
        "• 对比 package-lock.json / pnpm-lock.yaml / requirements.txt\n"
        "• 版本分组（主/次/补丁/新增/移除）\n"
        "• 许可证摘要和变更检测\n"
        "• 风险评估和建议动作\n"
        "• 输出 Markdown 表格或 JSON\n"
    ),
    epilog=(
        "示例:\n"
        "  # 对比两个 npm 锁文件，输出 Markdown 表格\n"
        "  depchg diff --before ./v1/package-lock.json --after ./v2/package-lock.json --markdown\n\n"
        "  # 对比 Python requirements，仅输出高风险变更为 JSON\n"
        "  depchg diff --before old.txt --after new.txt --format json --min-risk high\n\n"
        "  # 检查当前配置\n"
        "  depchg config show\n"
    ),
    no_args_is_help=True,
    rich_markup_mode="rich",
)

console = Console()
logger = get_logger("depchg.cli")


class OutputFormat(str, enum.Enum):
    TABLE = "table"
    MARKDOWN = "markdown"
    MD = "md"
    JSON = "json"


class RiskFilter(str, enum.Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CheckLicenseFormat(str, enum.Enum):
    TABLE = "table"
    JSON = "json"


def _version_callback(value: bool) -> None:
    """显示版本信息并退出。"""
    if value:
        console.print(f"depchg version: [bold cyan]{__version__}[/bold cyan]")
        console.print(f"Python: {sys.version.split()[0]}")
        raise typer.Exit(code=0)


@app.callback()
def main(
    version: Optional[bool] = typer.Option(
        None,
        "--version",
        "-V",
        help="显示版本信息并退出",
        is_eager=True,
        callback=_version_callback,
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="详细输出 (设置日志级别为 INFO)",
    ),
    debug: bool = typer.Option(
        False,
        "--debug",
        help="调试输出 (设置日志级别为 DEBUG)",
    ),
    log_json: bool = typer.Option(
        False,
        "--log-json",
        envvar="DEPCHG_LOG_JSON",
        help="以 JSON 格式输出日志",
    ),
    config_file: Optional[str] = typer.Option(
        None,
        "--config",
        "-c",
        help="指定配置文件路径 (默认自动搜索 .depchg.yaml/.yml/.json 或 pyproject.toml)",
        exists=True,
        dir_okay=False,
        readable=True,
    ),
) -> None:
    """📦 依赖版本变更报告工具。

    使用子命令执行具体操作。运行 `depchg COMMAND --help` 查看子命令详情。
    """
    log_level = "WARNING"
    if verbose:
        log_level = "INFO"
    if debug:
        log_level = "DEBUG"

    setup_logging(level=log_level, json_output=log_json)
    logger.debug(
        "CLI 初始化完成",
        verbose=verbose,
        debug=debug,
        log_json=log_json,
        config_file=config_file,
    )


diff_examples = """
使用示例:

  [bold]# 1. 基本用法 - 对比两个 npm 锁文件[/bold]
  depchg diff --before ./old/package-lock.json --after ./new/package-lock.json

  [bold]# 2. 输出 Markdown 表格 (粘贴到 PR/Issue)[/bold]
  depchg diff -b v1/pnpm-lock.yaml -a v2/pnpm-lock.yaml --markdown -o report.md

  [bold]# 3. 只看许可证相关变更，输出 JSON[/bold]
  depchg diff -b req-old.lock -a req-new.lock --format json --license

  [bold]# 4. 仅检查直接依赖，且只显示高风险[/bold]
  depchg diff -b a.json -a b.json --only-direct --min-risk high

  [bold]# 5. 通过管道传给 jq 处理[/bold]
  depchg diff -b x.json -a y.json -f json | jq '.changes[] | select(.risk.level=="high")'
"""


@app.command("diff", epilog=diff_examples, rich_help_panel="核心命令")
def cmd_diff(
    before: Optional[str] = typer.Option(
        None,
        "--before",
        "-b",
        help="变更前的锁文件路径 (package-lock.json / pnpm-lock.yaml / requirements.txt)",
        dir_okay=False,
    ),
    after: Optional[str] = typer.Option(
        None,
        "--after",
        "-a",
        help="变更后的锁文件路径",
        dir_okay=False,
    ),
    output_format: OutputFormat = typer.Option(
        OutputFormat.TABLE,
        "--output-format",
        "-f",
        help="输出格式: table / markdown / json",
    ),
    output_file: Optional[str] = typer.Option(
        None,
        "--output",
        "-o",
        help="输出文件路径 (默认输出到标准输出)",
        dir_okay=False,
        writable=True,
    ),
    markdown: bool = typer.Option(
        False,
        "--markdown",
        "--md",
        help="输出 Markdown 格式 (等价于 -f markdown)",
    ),
    include_license: bool = typer.Option(
        True,
        "--license/--no-license",
        help="是否在报告中包含许可证信息",
    ),
    include_risk: bool = typer.Option(
        True,
        "--risk/--no-risk",
        help="是否在报告中包含风险评估",
    ),
    only_direct: bool = typer.Option(
        False,
        "--only-direct",
        "--direct",
        help="仅检查直接依赖 (排除传递依赖)",
    ),
    minimal_risk_level: RiskFilter = typer.Option(
        RiskFilter.NONE,
        "--min-risk",
        "--minimal-risk",
        help="仅显示高于等于此风险等级的变更: none/low/medium/high/critical",
    ),
    ignore: List[str] = typer.Option(
        [],
        "--ignore",
        "-i",
        help="忽略的包名 (可多次指定)",
    ),
    strict: bool = typer.Option(
        False,
        "--strict",
        help="严格模式: 发现高/严重风险时返回非零退出码 (默认行为)",
    ),
    config_file: Optional[str] = typer.Option(
        None,
        "--config",
        "-c",
        help="指定配置文件路径",
        exists=True,
        dir_okay=False,
        readable=True,
    ),
) -> None:
    """对比两个锁文件并生成变更报告。

    ✨ 这是最常用的子命令，用于生成完整的依赖变更报告。

    支持的锁文件格式:
      • package-lock.json  (npm v5+)
      • pnpm-lock.yaml     (pnpm v5+)
      • requirements.txt / requirements.lock  (pip)
    """
    try:
        cli_overrides = {
            "before": before,
            "after": after,
            "output_format": output_format.value,
            "output_file": output_file,
            "markdown": markdown,
            "include_license": include_license,
            "include_risk": include_risk,
            "only_direct": only_direct,
            "minimal_risk_level": minimal_risk_level.value,
            "ignored_packages": ignore if ignore else None,
        }
        config = build_config(config_file=config_file, cli_overrides=cli_overrides)

        if not config.before:
            raise ValidationError(
                "缺少变更前锁文件路径",
                suggestion="请使用 --before <PATH> 指定变更前的锁文件。"
                           "\n  示例: depchg diff --before ./v1/package-lock.json --after ./v2/package-lock.json"
            )
        if not config.after:
            raise ValidationError(
                "缺少变更后锁文件路径",
                suggestion="请使用 --after <PATH> 指定变更后的锁文件。"
                           "\n  示例: depchg diff --before ./v1/package-lock.json --after ./v2/package-lock.json"
            )

        from pathlib import Path
        if not Path(config.before).exists():
            raise ValidationError(
                f"变更前锁文件不存在: {config.before}",
                suggestion=f"请确认文件路径是否正确。当前工作目录: {Path.cwd()}"
            )
        if not Path(config.after).exists():
            raise ValidationError(
                f"变更后锁文件不存在: {config.after}",
                suggestion=f"请确认文件路径是否正确。当前工作目录: {Path.cwd()}"
            )

        exit_code = run_with_config(config)
        raise typer.Exit(code=exit_code)

    except DepChgError as e:
        console.print()
        console.print(
            Panel.fit(
                f"[bold red]❌ {e.message}[/bold red]\n\n"
                f"[yellow]💡 建议:[/yellow] {e.suggestion}" +
                (f"\n[dim]详情: {e.details}[/dim]" if e.details else ""),
                title="[bold]命令执行失败[/bold]",
                border_style="red",
            )
        )
        console.print()
        raise typer.Exit(code=e.exit_code)
    except typer.Exit:
        raise
    except Exception as e:
        logger.exception("diff 命令发生未处理的异常")
        console.print()
        console.print(
            Panel.fit(
                f"[bold red]❌ 未知错误: {type(e).__name__}: {e}[/bold red]\n\n"
                f"[yellow]💡 建议:[/yellow] 请使用 --debug 查看详细日志，或检查 Python 版本 (>=3.9)。",
                title="[bold]命令执行失败[/bold]",
                border_style="red",
            )
        )
        console.print()
        raise typer.Exit(code=exit_codes.GENERAL_ERROR)


@app.command("summary", rich_help_panel="核心命令")
def cmd_summary(
    before: Optional[str] = typer.Option(None, "--before", "-b", help="变更前锁文件"),
    after: Optional[str] = typer.Option(None, "--after", "-a", help="变更后锁文件"),
    by_type: bool = typer.Option(True, "--by-type/--no-by-type", help="按变更类型分组"),
    by_license: bool = typer.Option(True, "--by-license/--no-license", help="显示许可证摘要"),
    by_risk: bool = typer.Option(True, "--by-risk/--no-risk", help="显示风险摘要"),
    config_file: Optional[str] = typer.Option(None, "--config", "-c", help="配置文件路径"),
) -> None:
    """仅输出变更摘要（不显示详情）。

    适合快速了解变更概况或用于 CI 流水线中。
    """
    try:
        cli_overrides = {
            "before": before,
            "after": after,
        }
        config = build_config(config_file=config_file, cli_overrides=cli_overrides)
        report = generate_report(config)

        output_lines = []
        output_lines.append(f"📦 依赖变更摘要: {report.total_changes} 项变更")
        output_lines.append(f"   {report.lockfile_before} → {report.lockfile_after}")
        output_lines.append("")

        if by_type:
            output_lines.append("📊 按变更类型:")
            for ct_val, count in sorted(report.summary.items()):
                if count > 0:
                    bar = "█" * min(count, 30)
                    output_lines.append(f"   {ct_val:12s} {count:4d}  {bar}")
            output_lines.append("")

        if by_license and report.license_summary:
            output_lines.append("📜 许可证分布:")
            for lic in sorted(report.license_summary.keys()):
                pkgs = report.license_summary[lic]
                output_lines.append(f"   {lic:24s} {len(pkgs):4d}  {', '.join(pkgs[:3])}{'...' if len(pkgs) > 3 else ''}")
            output_lines.append("")

        if by_risk:
            output_lines.append("⚠️ 风险分布:")
            for rl_val, count in sorted(report.risk_summary.items()):
                if count > 0:
                    output_lines.append(f"   {rl_val:10s} {count:4d}")
            output_lines.append("")

        console.print("\n".join(output_lines))
        raise typer.Exit(code=determine_exit_code(report))

    except DepChgError as e:
        console.print(f"[bold red]❌ 错误:[/bold red] {e.message}")
        if e.suggestion:
            console.print(f"[yellow]💡 建议:[/yellow] {e.suggestion}")
        raise typer.Exit(code=e.exit_code)


@app.command("check-license", rich_help_panel="辅助命令")
def cmd_check_license(
    lockfile: str = typer.Argument(..., help="锁文件路径", exists=True, dir_okay=False),
    allowlist: List[str] = typer.Option([], "--allow", help="允许的许可证 (可多次指定)"),
    blocklist: List[str] = typer.Option([], "--block", help="禁止的许可证 (可多次指定)"),
    format: CheckLicenseFormat = typer.Option(
        CheckLicenseFormat.TABLE, "--format", "-f",
        help="输出格式: table/json",
    ),
) -> None:
    """🔍 检查单个锁文件中的许可证合规性。

    使用 --allow 指定白名单，或 --block 指定黑名单。
    未命中任何名单的许可证会显示警告。
    """
    from .parsers import parse_lockfile
    from .risk_assessor import categorize_license

    try:
        ecosystem, deps = parse_lockfile(lockfile)
        results = []
        violations = 0

        for name, dep in sorted(deps.items()):
            lic_name = dep.license.name or "UNKNOWN"
            cat = categorize_license(lic_name)
            status = "ok"

            if allowlist:
                normalized_allow = {a.lower() for a in allowlist}
                if lic_name.lower() not in normalized_allow:
                    status = "blocked"
                    violations += 1
            elif blocklist:
                normalized_block = {b.lower() for b in blocklist}
                if lic_name.lower() in normalized_block:
                    status = "blocked"
                    violations += 1
            elif cat.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
                status = "warn"

            results.append({
                "name": name,
                "version": dep.version,
                "license": lic_name,
                "risk": cat.risk_level.value,
                "status": status,
                "description": cat.description,
            })

        if format.value == "json":
            output = json.dumps({
                "lockfile": lockfile,
                "ecosystem": ecosystem,
                "total": len(results),
                "violations": violations,
                "results": results,
            }, ensure_ascii=False, indent=2)
            typer.echo(output)
        else:
            from rich.table import Table
            table = Table(title=f"🔍 许可证合规性检查: {lockfile}", show_header=True)
            table.add_column("包名", style="bold")
            table.add_column("版本")
            table.add_column("许可证")
            table.add_column("风险", justify="center")
            table.add_column("状态", justify="center")
            table.add_column("说明", overflow="fold")

            for r in results:
                status_style = {"ok": "green", "warn": "yellow", "blocked": "bold red"}.get(r["status"], "")
                risk_style = {
                    "none": "dim",
                    "low": "green",
                    "medium": "yellow",
                    "high": "red",
                    "critical": "bold red",
                }.get(r["risk"], "")
                table.add_row(
                    r["name"],
                    r["version"],
                    r["license"],
                    f"[{risk_style}]{r['risk']}[/{risk_style}]",
                    f"[{status_style}]{r['status']}[/{status_style}]",
                    r["description"],
                )
            console.print()
            console.print(table)
            console.print()
            if violations > 0:
                console.print(f"[bold red]❌ 发现 {violations} 个违规项[/bold red]")
            else:
                console.print("[bold green]✅ 未发现违规项[/bold green]")

        raise typer.Exit(code=1 if violations > 0 else 0)

    except DepChgError as e:
        console.print(f"[bold red]❌ 错误:[/bold red] {e.message}")
        if e.suggestion:
            console.print(f"[yellow]💡 建议:[/yellow] {e.suggestion}")
        raise typer.Exit(code=e.exit_code)


config_app = typer.Typer(
    help="⚙️ 配置管理子命令",
    no_args_is_help=True,
)
app.add_typer(config_app, name="config", rich_help_panel="配置管理")


@config_app.command("show")
def cmd_config_show(
    config_file: Optional[str] = typer.Option(None, "--config", "-c", help="指定配置文件"),
) -> None:
    """显示当前生效的配置（含合并后的所有来源）。"""
    config = build_config(config_file=config_file)

    console.print()
    console.print(Panel.fit(
        f"[bold cyan]📄 配置文件位置:[/bold cyan] {config_file or '(自动搜索)'}\n\n"
        f"[bold]生效配置:[/bold]\n" +
        "\n".join(
            f"  {k} = {v!r}" for k, v in config.to_dict().items()
        ),
        title="当前配置",
        border_style="cyan",
    ))
    console.print()


@config_app.command("init")
def cmd_config_init(
    output: str = typer.Option(".depchg.yaml", "--output", "-o", help="输出文件路径"),
    force: bool = typer.Option(False, "--force", "-f", help="覆盖已存在的文件"),
) -> None:
    """在当前目录生成示例配置文件。"""
    from pathlib import Path

    default_content = """# DepChg 配置文件示例
# 将此文件放在项目根目录，或使用 --config 指定路径
# 也可以在 pyproject.toml 中使用 [tool.depchg] 段

# 默认的锁文件路径 (可被 --before/--after 参数覆盖)
before: null
after: null

# 输出格式: table, markdown, json
output_format: table

# 输出文件 (null = stdout)
output_file: null

# 输出 Markdown (等价于 output_format: markdown)
markdown: false

# 是否包含许可证信息
include_license: true

# 是否包含风险评估
include_risk: true

# 仅检查直接依赖
only_direct: false

# 最小风险等级过滤: none, low, medium, high, critical
minimal_risk_level: low

# 忽略的包名列表
ignored_packages:
#  - package-to-skip
#  - another-one

# 许可证白名单 (check-license 子命令使用)
license_allowlist:
#  - MIT
#  - Apache-2.0
#  - BSD-3-Clause

# 许可证黑名单
license_blocklist:
#  - GPL-3.0
#  - AGPL-3.0

# 日志级别: DEBUG, INFO, WARNING, ERROR, CRITICAL
log_level: WARNING

# 以 JSON 格式输出日志
log_json: false
"""

    path = Path(output)
    if path.exists() and not force:
        console.print(f"[bold red]❌ 配置文件已存在:[/bold red] {output}")
        console.print("[yellow]💡 使用 --force 覆盖，或指定其他输出路径[/yellow]")
        raise typer.Exit(code=1)

    try:
        path.write_text(default_content, encoding="utf-8")
        console.print(f"[bold green]✅ 已生成示例配置文件:[/bold green] {output}")
        console.print("[dim]请根据需要编辑其中的配置项[/dim]")
        raise typer.Exit(code=0)
    except OSError as e:
        console.print(f"[bold red]❌ 写入配置文件失败:[/bold red] {e}")
        raise typer.Exit(code=5)


@app.command("examples", rich_help_panel="帮助")
def cmd_examples() -> None:
    """📖 显示常用示例命令。"""
    examples_text = """
[bold cyan]╔══════════════════════════════════════════════════════════════╗
║                    DepChg 使用示例                             ║
╚══════════════════════════════════════════════════════════════╝[/bold cyan]

[bold]📋 基本对比[/bold]

  [green]# 对比两个 npm package-lock.json[/green]
  depchg diff -b ./v1/package-lock.json -a ./v2/package-lock.json

  [green]# 对比两个 pnpm 锁文件[/green]
  depchg diff --before v1/pnpm-lock.yaml --after v2/pnpm-lock.yaml

  [green]# 对比 Python requirements[/green]
  depchg diff -b req-old.txt -a req-new.txt

[bold]📄 输出格式[/bold]

  [green]# 输出 Markdown 表格 (适合粘贴到 PR/Issue)[/green]
  depchg diff -b a.json -a b.json --markdown --output changes.md

  [green]# 输出 JSON (给脚本处理)[/green]
  depchg diff -b a.json -a b.json --format json > changes.json

  [green]# JSON 管道 jq 过滤高风险[/green]
  depchg diff -b a.json -a b.json -f json | \
    jq '[.changes[] | select(.risk.level=="high")] | length'

[bold]🔍 过滤和筛选[/bold]

  [green]# 只看直接依赖[/green]
  depchg diff -b a.json -a b.json --only-direct

  [green]# 只显示中高风险变更[/green]
  depchg diff -b a.json -a b.json --min-risk medium

  [green]# 忽略特定包[/green]
  depchg diff -b a.json -a b.json -i lodash -i react

[bold]📜 许可证检查[/bold]

  [green]# 检查单个文件的许可证[/green]
  depchg check-license ./package-lock.json

  [green]# 只允许 MIT/Apache/BSD 许可证[/green]
  depchg check-license req.txt --allow MIT --allow Apache-2.0 --allow BSD-3-Clause

  [green]# 禁止 GPL 系列许可证[/green]
  depchg check-license req.txt --block GPL-3.0 --block AGPL-3.0

[bold]⚙️ 配置和调试[/bold]

  [green]# 生成示例配置文件[/green]
  depchg config init

  [green]# 查看当前生效配置[/green]
  depchg config show --config ./my-config.yaml

  [green]# 详细日志模式[/green]
  depchg diff -b a.json -a b.json -v

  [green]# 调试模式，JSON 日志[/green]
  depchg diff -b a.json -a b.json --debug --log-json 2>debug.log

[bold]🚀 退出码约定[/bold]

  [green]0[/green]  成功，无高风险
  [yellow]10[/yellow] 报告中包含[bold]高风险[/bold]变更
  [red]11[/red] 报告中包含[bold]严重风险[/bold]变更
  [dim]其他非零值表示处理错误 (查看文档)[/dim]
"""
    console.print(examples_text)


@app.command("docs", rich_help_panel="帮助")
def cmd_docs(
    topic: Optional[str] = typer.Argument(None, help="主题: exit-codes, formats, config, licenses"),
) -> None:
    """📚 查看详细文档。"""
    docs = {
        "exit-codes": """
[bold cyan]退出码文档[/bold cyan]

| 退出码 | 常量名 | 含义 |
| ---: | :--- | :--- |
| 0 | SUCCESS | 执行成功，无高/严重风险 |
| 1 | GENERAL_ERROR | 未知错误 |
| 2 | LOCKFILE_PARSE_ERROR | 锁文件解析失败 |
| 3 | VERSION_COMPARE_ERROR | 版本对比失败 |
| 4 | CONFIG_ERROR | 配置加载错误 |
| 5 | OUTPUT_ERROR | 输出格式化/写入失败 |
| 6 | VALIDATION_ERROR | 参数校验失败 |
| 10 | HIGH_RISK_CHANGES | 报告包含[bold]高风险[/bold]变更 |
| 11 | CRITICAL_RISK_CHANGES | 报告包含[bold]严重风险[/bold]变更 |
| 130 | - | 用户中断 (Ctrl+C) |

使用退出码在 CI 中阻断高风险变更示例:
[green]
  depchg diff -b base.json -a pr.json -f json --output report.json
  EXIT=$?
  if [ $EXIT -ge 10 ]; then
    echo "⚠️  检测到高风险变更，请人工审核!"
    exit $EXIT
  fi
[/green]
""",
        "formats": """
[bold cyan]输出格式文档[/bold cyan]

[bold]1. table (默认)[/bold]
  • 终端彩色表格
  • 使用 Rich 库渲染
  • 适合本地交互式查看

[bold]2. markdown[/bold]
  • 标准 Markdown 表格
  • 无 ANSI 控制字符
  • 适合: GitHub/GitLab PR 评论、文档
  • 使用: --markdown 或 -f markdown

[bold]3. json[/bold]
  • 结构化 JSON，顶层结构:
    - generated_at: ISO 时间戳
    - lockfile_before/after: 文件路径
    - ecosystem: 生态系统类型
    - total_changes: 总变更数
    - summary: { change_type: count }
    - license_summary: { license: [package_names] }
    - risk_summary: { risk_level: count }
    - changes: 变更详情数组

  每个 change 对象字段:
    - name, change_type, version_before, version_after
    - before/after: 完整依赖对象 (含 license)
    - license_changed: bool
    - risk: { level, reasons[], suggestions[] }
""",
        "config": """
[bold cyan]配置文件文档[/bold cyan]

[bold]优先级 (高 → 低):[/bold]
  1. 命令行参数 (--before, --markdown 等)
  2. 环境变量 (DEPCHG_BEFORE=...)
  3. 配置文件 (.depchg.yaml/.json 或 pyproject.toml)
  4. 内置默认值

[bold]配置文件搜索顺序:[/bold]
  ./.depchg.yaml → ./.depchg.yml → ./.depchg.json
  → ./pyproject.toml → 向上遍历父目录

[bold]pyproject.toml 格式示例:[/bold]
[toml]
  [tool.depchg]
  output_format = "markdown"
  include_license = true
  only_direct = false
  minimal_risk_level = "low"
  ignored_packages = ["some-package"]
[/toml]

[bold]环境变量列表:[/bold]
  DEPCHG_BEFORE, DEPCHG_AFTER
  DEPCHG_OUTPUT_FORMAT, DEPCHG_OUTPUT_FILE
  DEPCHG_MARKDOWN (1/true/yes)
  DEPCHG_INCLUDE_LICENSE, DEPCHG_INCLUDE_RISK
  DEPCHG_ONLY_DIRECT, DEPCHG_MINIMAL_RISK_LEVEL
  DEPCHG_LOG_LEVEL, DEPCHG_LOG_JSON
""",
        "licenses": """
[bold cyan]许可证风险分类[/bold cyan]

[bold green]低风险 (宽松许可证):[/bold]
  MIT, Apache-2.0, BSD-2/3-Clause, ISC, Python-2.0,
  Unlicense, CC0-1.0, Zlib, WTFPL

[bold yellow]中风险 (弱Copyleft):[/bold]
  LGPL-2.0/2.1/3.0, MPL-1.1/2.0, CDDL-1.0, EPL-1.0/2.0

[bold red]高风险 (强Copyleft):[/bold]
  GPL-2.0, GPL-3.0, AGPL-3.0 (及 +/- 后缀变体)

[bold]严重风险 (专有/未知):[/bold]
  PROPRIETARY, COMMERCIAL, UNKNOWN, 空许可证

风险评估会综合考虑:
  • 版本变更类型 (主版本升级 = 高风险)
  • 许可证兼容性变化
  • 预发布版本使用
  • 新增依赖的许可证类型
""",
    }

    if topic is None:
        console.print()
        console.print("[bold cyan]📚 可用文档主题:[/bold cyan]")
        for key in sorted(docs.keys()):
            console.print(f"  [green]• {key}[/green]")
        console.print()
        console.print("[dim]使用: depchg docs <主题>[/dim]")
    else:
        topic_lower = topic.lower()
        if topic_lower not in docs:
            console.print(f"[bold red]❌ 未知文档主题:[/bold red] {topic}")
            console.print(f"[yellow]可用主题: {', '.join(sorted(docs.keys()))}[/yellow]")
            raise typer.Exit(code=1)
        console.print()
        console.print(docs[topic_lower])
        console.print()


def cli_entry() -> None:
    """入口函数，用于 setup.py 脚本。"""
    app()


if __name__ == "__main__":
    cli_entry()
