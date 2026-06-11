"""Asset Cleaner CLI - 本地素材引用清理工具"""

import os
import sys
import time
from typing import List, Optional, Tuple
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    TaskProgressColumn,
    TimeRemainingColumn,
)
from rich.syntax import Syntax
from rich.tree import Tree
from rich import print as rprint

from .__init__ import __version__
from .path_utils import (
    normalize_path,
    normalize_relative,
    ScanProgress,
    is_image_file,
)
from .ignore_rules import IgnoreMatcher
from .reference_analyzer import ReferenceAnalyzer, AnalysisResult
from .deletion_plan import (
    DeletionPlanner,
    DeletionPlan,
    DeletionEntry,
    format_size,
)
from .config import (
    load_config,
    find_config_file,
    create_default_config,
    CleanerConfig,
)


app = typer.Typer(
    name="asset-cleaner",
    help="本地素材引用清理工具 - 扫描并清理未引用的前端资源",
    add_completion=False,
    no_args_is_help=True,
)
console = Console()


def version_callback(value: bool):
    if value:
        console.print(f"[bold green]asset-cleaner[/bold green] version [bold cyan]{__version__}[/bold cyan]")
        raise typer.Exit()


@app.callback()
def main(
    version: Optional[bool] = typer.Option(
        None,
        "--version",
        "-v",
        callback=version_callback,
        is_eager=True,
        help="显示版本信息",
    ),
):
    """本地素材引用清理工具"""
    pass


def _create_ignore_matcher(
    config: CleanerConfig,
    extra_ignore: Optional[List[str]] = None,
    extra_exclude_dirs: Optional[List[str]] = None,
    extra_exclude_extensions: Optional[List[str]] = None,
) -> IgnoreMatcher:
    """创建忽略规则匹配器"""
    patterns = list(config.ignore_patterns)
    if extra_ignore:
        patterns.extend(extra_ignore)

    exclude_dirs = list(config.exclude_dirs)
    if extra_exclude_dirs:
        for d in extra_exclude_dirs:
            if os.path.isabs(d):
                exclude_dirs.append(normalize_path(d))
            else:
                exclude_dirs.append(normalize_path(os.path.join(config.root_dir, d)))

    exclude_extensions = list(config.exclude_extensions)
    if extra_exclude_extensions:
        exclude_extensions.extend(extra_exclude_extensions)

    return IgnoreMatcher(
        root_dir=config.root_dir,
        patterns=patterns,
        exclude_dirs=exclude_dirs,
        exclude_extensions=exclude_extensions,
        use_gitignore=config.use_gitignore,
    )


def _run_analysis(
    config: CleanerConfig,
    ignore_matcher: IgnoreMatcher,
    show_progress: bool = True,
) -> Tuple[AnalysisResult, ScanProgress]:
    """运行分析"""
    analyzer = ReferenceAnalyzer(
        root_dir=config.root_dir,
        asset_dirs=config.asset_dirs,
        ignore_matcher=ignore_matcher,
    )

    scan_progress = ScanProgress()

    if show_progress:
        with Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]扫描中..."),
            BarColumn(),
            TaskProgressColumn(),
            TimeRemainingColumn(),
            TextColumn("[dim]{task.fields[current_dir]}"),
            console=console,
            transient=False,
        ) as progress:
            task_id = progress.add_task(
                "scanning",
                total=100,
                current_dir="准备中...",
            )

            def update_progress():
                if scan_progress.total_files > 0:
                    pct = int((scan_progress.processed_files / scan_progress.total_files) * 100)
                    progress.update(
                        task_id,
                        completed=pct,
                        current_dir=scan_progress.current_dir[-60:],
                    )

            scan_progress.update_callback = update_progress
            result = analyzer.analyze(scan_progress)

            progress.update(task_id, completed=100, current_dir="完成")
            time.sleep(0.2)
    else:
        result = analyzer.analyze(scan_progress)

    return result, scan_progress


def _print_header(text: str):
    """打印标题"""
    console.print()
    console.print(Panel(f"[bold cyan]{text}[/bold cyan]", expand=False))


def _print_summary(result: AnalysisResult, scan_progress: ScanProgress):
    """打印汇总信息"""
    table = Table(title="扫描汇总", show_header=True, header_style="bold magenta")
    table.add_column("项目", style="cyan")
    table.add_column("数值", justify="right", style="green")

    table.add_row("总资源文件数", str(len(result.all_assets)))
    table.add_row("已引用资源数", str(len(result.referenced_assets)))
    table.add_row("[bold red]未引用资源数[/bold red]", f"[bold red]{len(result.unreferenced_assets)}[/bold red]")
    table.add_row("扫描文件数", str(result.total_scanned_files))
    table.add_row("总引用次数", str(result.total_references))
    table.add_row("动态引用文件数", str(len(result.dynamic_references)))

    if scan_progress.skipped_files:
        table.add_row("[yellow]跳过文件数[/yellow]", f"[yellow]{len(scan_progress.skipped_files)}[/yellow]")

    if scan_progress.symlink_loops:
        table.add_row("[yellow]软链接循环数[/yellow]", f"[yellow]{len(scan_progress.symlink_loops)}[/yellow]")

    console.print(table)


def _print_unreferenced(
    result: AnalysisResult,
    root_dir: str,
    show_all: bool = False,
    max_show: int = 50,
):
    """打印未引用资源列表"""
    unreferenced = result.unreferenced_assets
    if not unreferenced:
        console.print("[green]✓ 没有发现未引用的资源[/green]")
        return

    _print_header(f"未引用资源清单 ({len(unreferenced)} 个)")

    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("#", style="dim", justify="right")
    table.add_column("文件路径", style="red")
    table.add_column("大小", justify="right", style="yellow")
    table.add_column("类型", style="cyan")

    total_size = 0
    display_items = unreferenced if show_all else unreferenced[:max_show]

    for i, asset_path in enumerate(display_items, 1):
        try:
            size = os.path.getsize(asset_path)
        except OSError:
            size = 0
        total_size += size

        rel_path = normalize_relative(asset_path, root_dir)
        ext = Path(asset_path).suffix.lower()

        table.add_row(
            str(i),
            rel_path,
            format_size(size),
            ext.lstrip('.'),
        )

    console.print(table)

    if not show_all and len(unreferenced) > max_show:
        console.print(f"[dim]... 还有 {len(unreferenced) - max_show} 个文件未显示，使用 --show-all 查看全部[/dim]")

    console.print(f"\n[bold red]可释放空间: {format_size(total_size)}[/bold red]")


def _print_reference_chains(
    result: AnalysisResult,
    root_dir: str,
    asset_path: Optional[str] = None,
):
    """打印引用链"""
    _print_header("引用链")

    if asset_path:
        abs_path = normalize_path(asset_path)
        chain = result.get_reference_chain(abs_path)
        if chain:
            _print_single_chain(chain, root_dir)
        else:
            console.print(f"[yellow]未找到资源的引用: {asset_path}[/yellow]")
        return

    count = 0
    max_chains = 10

    for asset_path, chain in sorted(result.referenced_assets.items()):
        if count >= max_chains:
            break
        if chain.reference_count > 0:
            _print_single_chain(chain, root_dir)
            count += 1

    if len(result.referenced_assets) > max_chains:
        console.print(f"\n[dim]... 还有 {len(result.referenced_assets) - max_chains} 个资源的引用链未显示[/dim]")


def _print_single_chain(chain, root_dir: str):
    """打印单个引用链"""
    asset_rel = normalize_relative(chain.asset_path, root_dir)
    tree = Tree(f"[bold green]📄 {asset_rel}[/bold green] (被引用 {chain.reference_count} 次)")

    for ref in chain.references:
        source_rel = normalize_relative(ref.source_file, root_dir)
        branch = tree.add(f"[cyan]← {source_rel}[/cyan] [dim](L{ref.line_number}, {ref.pattern_type})[/dim]")
        branch.add(f"[dim]引用: {ref.reference}[/dim]")

    console.print(tree)


def _print_dynamic_references(
    result: AnalysisResult,
    root_dir: str,
):
    """打印动态引用"""
    if not result.dynamic_references:
        return

    _print_header(f"疑似动态引用 ({len(result.dynamic_references)} 个文件)")

    console.print("[yellow]⚠️  以下文件包含动态资源引用，可能导致误判[/yellow]")
    console.print()

    for file_path, dyn_info in sorted(result.dynamic_references.items()):
        rel_path = normalize_relative(file_path, root_dir)
        panel_title = f"[bold yellow]📄 {rel_path}[/bold yellow]"

        content_lines = []
        for ref in dyn_info.references:
            content_lines.append(f"  [dim]L{ref.line_number}[/dim]: [red]{ref.reference}[/red]")

        if dyn_info.pattern_hints:
            content_lines.append("")
            content_lines.append(f"  [cyan]可能的模式: {', '.join(dyn_info.pattern_hints)}[/cyan]")

        panel = Panel(
            "\n".join(content_lines),
            title=panel_title,
            border_style="yellow",
            expand=False,
        )
        console.print(panel)


def _print_symlink_loops(scan_progress: ScanProgress):
    """打印软链接循环警告"""
    if not scan_progress.symlink_loops:
        return

    _print_header("软链接循环警告")

    console.print("[yellow]⚠️  检测到以下软链接循环，已跳过处理:[/yellow]")
    console.print()

    for path, reason in scan_progress.symlink_loops:
        console.print(f"  [red]✗ {path}[/red]")
        console.print(f"    [dim]{reason}[/dim]")
        console.print()


def _print_skipped_files(scan_progress: ScanProgress):
    """打印跳过的文件"""
    if not scan_progress.skipped_files:
        return

    _print_header(f"跳过的文件 ({len(scan_progress.skipped_files)} 个)")

    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("文件路径", style="dim")
    table.add_column("原因", style="yellow")

    for path, reason in scan_progress.skipped_files[:20]:
        table.add_row(path, reason)

    console.print(table)

    if len(scan_progress.skipped_files) > 20:
        console.print(f"[dim]... 还有 {len(scan_progress.skipped_files) - 20} 个跳过的文件[/dim]")


def _confirm_action(message: str) -> bool:
    """确认操作"""
    console.print()
    response = typer.prompt(
        f"\n{message} (y/N)",
        default="n",
        show_default=False,
    )
    return response.lower() in {'y', 'yes'}


@app.command("scan")
def scan(
    path: str = typer.Argument(
        ".",
        help="要扫描的项目根目录",
    ),
    config: Optional[str] = typer.Option(
        None,
        "--config",
        "-c",
        help="配置文件路径",
    ),
    asset_dir: Optional[List[str]] = typer.Option(
        None,
        "--asset-dir",
        "-a",
        help="资产目录（可多次指定）",
    ),
    ignore: Optional[List[str]] = typer.Option(
        None,
        "--ignore",
        "-i",
        help="忽略模式（.gitignore 风格，可多次指定）",
    ),
    exclude_dir: Optional[List[str]] = typer.Option(
        None,
        "--exclude-dir",
        help="排除的目录（可多次指定）",
    ),
    exclude_ext: Optional[List[str]] = typer.Option(
        None,
        "--exclude-ext",
        help="排除的文件扩展名（可多次指定）",
    ),
    show_all: bool = typer.Option(
        False,
        "--show-all",
        help="显示所有未引用文件（默认显示前50个）",
    ),
    show_chains: bool = typer.Option(
        False,
        "--show-chains",
        help="显示引用链",
    ),
    chain_for: Optional[str] = typer.Option(
        None,
        "--chain-for",
        help="显示指定资源的引用链",
    ),
    no_progress: bool = typer.Option(
        False,
        "--no-progress",
        help="不显示进度条",
    ),
    no_gitignore: bool = typer.Option(
        False,
        "--no-gitignore",
        help="不使用 .gitignore",
    ),
):
    """扫描并显示未引用资源清单（不会删除任何文件）"""
    root_dir = normalize_path(path)

    if not os.path.isdir(root_dir):
        console.print(f"[bold red]错误: 目录不存在: {root_dir}[/bold red]")
        raise typer.Exit(code=1)

    try:
        cfg = load_config(root_dir, config)
    except (ValueError, ImportError) as e:
        console.print(f"[bold red]配置错误: {e}[/bold red]")
        raise typer.Exit(code=1)

    if asset_dir:
        cfg.asset_dirs = []
        for d in asset_dir:
            if not os.path.isabs(d):
                d = os.path.join(root_dir, d)
            cfg.asset_dirs.append(normalize_path(d))

    if no_gitignore:
        cfg.use_gitignore = False

    if no_progress:
        cfg.show_progress = False

    ignore_matcher = _create_ignore_matcher(
        cfg,
        extra_ignore=ignore,
        extra_exclude_dirs=exclude_dir,
        extra_exclude_extensions=exclude_ext,
    )

    console.print(f"[bold cyan]Asset Cleaner v{__version__}[/bold cyan]")
    console.print(f"[dim]扫描目录: {root_dir}[/dim]")
    console.print(f"[dim]资产目录: {', '.join(cfg.asset_dirs)}[/dim]")
    console.print()

    result, scan_progress = _run_analysis(
        cfg,
        ignore_matcher,
        show_progress=cfg.show_progress,
    )

    _print_summary(result, scan_progress)
    _print_unreferenced(result, root_dir, show_all=show_all)

    if show_chains or chain_for:
        _print_reference_chains(result, root_dir, chain_for)

    if cfg.show_dynamic:
        _print_dynamic_references(result, root_dir)

    if scan_progress.symlink_loops:
        _print_symlink_loops(scan_progress)

    if result.unreferenced_assets:
        console.print()
        console.print("[yellow]💡 提示: 使用 --apply 参数执行删除[/yellow]")
        console.print("[yellow]💡 提示: 使用 --exclude-dir 或 --exclude-ext 排除误判文件[/yellow]")


@app.command("clean")
def clean(
    path: str = typer.Argument(
        ".",
        help="要清理的项目根目录",
    ),
    apply: bool = typer.Option(
        False,
        "--apply",
        help="确认执行删除（必须显式指定）",
    ),
    config: Optional[str] = typer.Option(
        None,
        "--config",
        "-c",
        help="配置文件路径",
    ),
    asset_dir: Optional[List[str]] = typer.Option(
        None,
        "--asset-dir",
        "-a",
        help="资产目录（可多次指定）",
    ),
    ignore: Optional[List[str]] = typer.Option(
        None,
        "--ignore",
        "-i",
        help="忽略模式（.gitignore 风格，可多次指定）",
    ),
    exclude_dir: Optional[List[str]] = typer.Option(
        None,
        "--exclude-dir",
        help="排除的目录（可多次指定）",
    ),
    exclude_ext: Optional[List[str]] = typer.Option(
        None,
        "--exclude-ext",
        help="排除的文件扩展名（可多次指定）",
    ),
    dry_run: bool = typer.Option(
        True,
        "--dry-run/--no-dry-run",
        help="试运行模式（默认开启）",
    ),
    no_backup: bool = typer.Option(
        False,
        "--no-backup",
        help="不创建备份（不推荐）",
    ),
    show_all: bool = typer.Option(
        False,
        "--show-all",
        help="显示所有未引用文件",
    ),
    no_progress: bool = typer.Option(
        False,
        "--no-progress",
        help="不显示进度条",
    ),
    no_confirm: bool = typer.Option(
        False,
        "--no-confirm",
        help="跳过确认提示（谨慎使用）",
    ),
    force: bool = typer.Option(
        False,
        "--force",
        help="忽略锁定文件强制操作",
    ),
    no_gitignore: bool = typer.Option(
        False,
        "--no-gitignore",
        help="不使用 .gitignore 规则",
    ),
):
    """清理未引用的资源文件"""
    root_dir = normalize_path(path)

    if not os.path.isdir(root_dir):
        console.print(f"[bold red]错误: 目录不存在: {root_dir}[/bold red]")
        raise typer.Exit(code=1)

    try:
        cfg = load_config(root_dir, config)
    except (ValueError, ImportError) as e:
        console.print(f"[bold red]配置错误: {e}[/bold red]")
        raise typer.Exit(code=1)

    if asset_dir:
        cfg.asset_dirs = []
        for d in asset_dir:
            if not os.path.isabs(d):
                d = os.path.join(root_dir, d)
            cfg.asset_dirs.append(normalize_path(d))

    if no_progress:
        cfg.show_progress = False

    if no_gitignore:
        cfg.use_gitignore = False

    planner = DeletionPlanner(root_dir)

    if planner.has_lock_file() and not force:
        console.print("[bold yellow]⚠️  检测到现有的锁定文件[/bold yellow]")
        console.print("  使用 --force 忽略锁定文件，或使用 undo 命令撤销上次操作")
        raise typer.Exit(code=1)

    ignore_matcher = _create_ignore_matcher(
        cfg,
        extra_ignore=ignore,
        extra_exclude_dirs=exclude_dir,
        extra_exclude_extensions=exclude_ext,
    )

    console.print(f"[bold cyan]Asset Cleaner v{__version__}[/bold cyan]")
    console.print(f"[dim]扫描目录: {root_dir}[/dim]")
    console.print()

    result, scan_progress = _run_analysis(
        cfg,
        ignore_matcher,
        show_progress=cfg.show_progress,
    )

    _print_summary(result, scan_progress)
    _print_unreferenced(result, root_dir, show_all=show_all)

    if cfg.show_dynamic and result.dynamic_references:
        _print_dynamic_references(result, root_dir)
        console.print()
        console.print("[bold yellow]⚠️  存在动态引用，可能导致误判！[/bold yellow]")
        console.print("[yellow]建议使用 --exclude-dir 或 --exclude-ext 排除相关文件[/yellow]")
        console.print()

    if not result.unreferenced_assets:
        console.print("[green]✓ 没有需要清理的资源[/green]")
        raise typer.Exit(code=0)

    if scan_progress.symlink_loops:
        _print_symlink_loops(scan_progress)

    if dry_run and not apply:
        console.print()
        console.print(Panel(
            "[bold yellow]⚠️  DRY RUN 模式[/bold yellow]\n\n"
            "以上是拟删除的文件清单。\n"
            "确认无误后，使用 --apply 参数执行删除。",
            border_style="yellow",
        ))
        raise typer.Exit(code=0)

    if not apply:
        console.print()
        console.print("[yellow]💡 使用 --apply 参数确认删除操作[/yellow]")
        raise typer.Exit(code=0)

    reasons = {p: "未引用的资源文件" for p in result.unreferenced_assets}
    plan = planner.create_plan(
        result.unreferenced_assets,
        reasons=reasons,
        dry_run=False,
    )

    console.print()
    console.print(f"[bold red]即将删除 {plan.file_count} 个文件，共 {format_size(plan.total_size)}[/bold red]")

    if not no_confirm:
        if not _confirm_action("确认要删除这些文件吗？"):
            console.print("[yellow]操作已取消[/yellow]")
            raise typer.Exit(code=0)

    console.print()
    console.print("[cyan]正在写入锁定文件...[/cyan]")
    lock_path = planner.write_lock_file(plan)
    console.print(f"[dim]锁定文件: {lock_path}[/dim]")

    if not no_backup:
        console.print("[cyan]正在创建备份并删除文件...[/cyan]")
    else:
        console.print("[bold yellow]⚠️  不创建备份模式，删除后无法直接恢复！[/bold yellow]")
        console.print("[cyan]正在删除文件...[/cyan]")

    create_backup = not no_backup
    plan = planner.apply_plan(plan, create_backup=create_backup)

    console.print()
    console.print(Panel(
        f"[bold green]✓ 删除完成[/bold green]\n\n"
        f"成功删除: {plan.deleted_count} 个文件\n"
        f"失败: {plan.failed_count} 个文件\n"
        f"释放空间: {format_size(plan.total_size)}\n\n"
        f"[dim]锁定文件: {lock_path}[/dim]\n"
        f"[dim]使用 `asset-cleaner undo` 可撤销删除[/dim]",
        border_style="green",
    ))

    if plan.failed_count > 0:
        console.print()
        _print_header("删除失败的文件")
        for entry in plan.entries:
            if entry.error:
                console.print(f"  [red]✗ {entry.file_info.relative_path}: {entry.error}[/red]")


@app.command("undo")
def undo(
    path: str = typer.Argument(
        ".",
        help="项目根目录",
    ),
    plan_id: Optional[str] = typer.Option(
        None,
        "--plan-id",
        help="指定要撤销的计划ID",
    ),
    list_plans: bool = typer.Option(
        False,
        "--list",
        help="列出可用的撤销计划",
    ),
):
    """撤销删除操作"""
    root_dir = normalize_path(path)
    planner = DeletionPlanner(root_dir)

    if list_plans:
        plans = planner.list_undo_plans()
        if not plans:
            console.print("[yellow]没有可用的撤销计划[/yellow]")
        else:
            console.print("[bold cyan]可用的撤销计划:[/bold cyan]")
            for pid in plans:
                console.print(f"  {pid}")
        raise typer.Exit(code=0)

    if plan_id:
        console.print(f"[cyan]正在撤销计划 {plan_id}...[/cyan]")
    else:
        console.print("[cyan]正在撤销上次删除操作...[/cyan]")

    restored, failed = planner.undo_deletion(plan_id)

    if restored == 0 and failed == 0:
        console.print("[yellow]没有需要撤销的操作[/yellow]")
        raise typer.Exit(code=0)

    console.print()
    console.print(Panel(
        f"[bold green]✓ 撤销完成[/bold green]\n\n"
        f"成功恢复: {restored} 个文件\n"
        f"失败: {failed} 个文件",
        border_style="green",
    ))


@app.command("init-config")
def init_config(
    path: str = typer.Argument(
        ".",
        help="配置文件生成目录",
    ),
    force: bool = typer.Option(
        False,
        "--force",
        help="覆盖已存在的配置文件",
    ),
):
    """生成默认配置文件"""
    target_dir = normalize_path(path)
    config_path = os.path.join(target_dir, ".asset-cleaner.yaml")

    created = create_default_config(config_path, force=force)
    console.print(f"[bold green]✓ 配置文件已生成: {created}[/bold green]")


@app.command("show-config")
def show_config(
    path: str = typer.Argument(
        ".",
        help="项目目录",
    ),
    config: Optional[str] = typer.Option(
        None,
        "--config",
        "-c",
        help="配置文件路径",
    ),
):
    """显示当前配置"""
    root_dir = normalize_path(path)

    if config is None:
        config = find_config_file(root_dir)

    if not config:
        console.print("[yellow]未找到配置文件，使用默认配置[/yellow]")
        console.print("[dim]使用 `asset-cleaner init-config` 生成配置文件[/dim]")
        cfg = CleanerConfig.default(root_dir)
    else:
        console.print(f"[bold green]使用配置文件: {config}[/bold green]")
        try:
            cfg = load_config(root_dir, config)
        except (ValueError, ImportError) as e:
            console.print(f"[bold red]配置错误: {e}[/bold red]")
            raise typer.Exit(code=1)

    table = Table(title="当前配置", show_header=True, header_style="bold magenta")
    table.add_column("配置项", style="cyan")
    table.add_column("值", style="green")

    table.add_row("root_dir", cfg.root_dir)
    table.add_row("asset_dirs", "\n".join(cfg.asset_dirs))
    table.add_row("ignore_patterns", "\n".join(cfg.ignore_patterns) if cfg.ignore_patterns else "(无)")
    table.add_row("exclude_dirs", "\n".join(cfg.exclude_dirs) if cfg.exclude_dirs else "(无)")
    table.add_row("exclude_extensions", ", ".join(cfg.exclude_extensions) if cfg.exclude_extensions else "(无)")
    table.add_row("use_gitignore", str(cfg.use_gitignore))
    table.add_row("show_progress", str(cfg.show_progress))
    table.add_row("show_dynamic", str(cfg.show_dynamic))
    table.add_row("dry_run", str(cfg.dry_run))
    table.add_row("create_backup", str(cfg.create_backup))

    console.print(table)


if __name__ == "__main__":
    app()
