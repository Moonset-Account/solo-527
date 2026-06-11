from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

import typer
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TaskProgressColumn,
    TextColumn,
    TimeRemainingColumn,
)
from rich.table import Table

from . import __version__
from .checker import SitemapChecker
from .config import CheckerConfig, RuntimeState, load_exported_pages, load_whitelist
from .fetcher import AsyncFetcher, FetchError
from .models import LinkType, Severity
from .parser import normalize_url, parse_sitemap
from .report import (
    to_json,
    to_markdown,
    write_json,
    write_markdown,
    write_replacement_script,
)


app = typer.Typer(
    name="sitemap-checker",
    help="站点地图死链检查 CLI - 检查 404、重定向链、标题缺失和 canonical 冲突",
    add_completion=False,
    no_args_is_help=True,
)
console = Console()
err_console = Console(stderr=True)


def _version_callback(value: bool) -> None:
    if value:
        console.print(f"sitemap-checker v{__version__}")
        raise typer.Exit()


@app.callback()
def main(
    version: Optional[bool] = typer.Option(
        None,
        "--version",
        "-V",
        help="显示版本信息",
        callback=_version_callback,
        is_eager=True,
    ),
) -> None:
    """站点地图死链检查 CLI - 给内容运营上线前使用。"""
    pass


def _print_summary_table(results) -> None:
    table = Table(title="扫描结果汇总", show_lines=True)
    table.add_column("类别", style="bold")
    table.add_column("数量", justify="right")
    table.add_column("说明")

    def count_by_severity(sev):
        return sum(1 for r in results if any(i.severity == sev for i in r.issues))

    def count_by_link_type(lt):
        return sum(1 for r in results if r.link_type == lt)

    table.add_row("检查总链接", str(len(results)), "")
    table.add_row("  内部链接", str(count_by_link_type(LinkType.INTERNAL)), style="cyan")
    table.add_row("  外部链接", str(count_by_link_type(LinkType.EXTERNAL)), style="blue")
    table.add_row("  图片资源", str(count_by_link_type(LinkType.IMAGE)), style="magenta")
    table.add_row("")
    table.add_row("🔴 严重问题", str(count_by_severity(Severity.CRITICAL)), style="bold red")
    table.add_row("🟡 警告", str(count_by_severity(Severity.WARNING)), style="bold yellow")
    table.add_row("🔵 信息提示", str(count_by_severity(Severity.INFO)), style="bold blue")
    whitelist_count = sum(1 for r in results if r.is_whitelisted)
    if whitelist_count:
        table.add_row("✅ 白名单跳过", str(whitelist_count), style="bold green")

    console.print(table)


def _print_issues(results, severity: Severity, title: str, style: str) -> None:
    items = [r for r in results if any(i.severity == severity for i in r.issues) and not r.is_whitelisted]
    if not items:
        return

    table = Table(title=f"{title} ({len(items)})", show_lines=True)
    table.add_column("URL", overflow="fold", style=style)
    table.add_column("类型", style="dim")
    table.add_column("问题", overflow="fold")

    for r in items:
        issues_text = "\n".join(i.message for i in r.issues if i.severity == severity)
        table.add_row(r.url, r.link_type.value, issues_text)

    console.print(table)


async def _fetch_sitemap_urls(sitemap_paths: List[str], config: CheckerConfig) -> List[str]:
    all_urls: List[str] = []
    sitemap_content_tasks = []

    local_sitemaps: List[Path] = []
    remote_sitemaps: List[str] = []
    for sp in sitemap_paths:
        if sp.startswith("http://") or sp.startswith("https://"):
            remote_sitemaps.append(sp)
        else:
            p = Path(sp)
            if p.exists():
                local_sitemaps.append(p)
            else:
                err_console.print(f"[yellow]警告: Sitemap 文件不存在: {sp}[/yellow]")

    for p in local_sitemaps:
        content = p.read_text(encoding="utf-8")
        base = "http://localhost"
        urls = parse_sitemap(content, base)
        all_urls.extend(urls)

    if remote_sitemaps:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console,
            transient=False,
        ) as progress:
            task = progress.add_task("下载 sitemap...", total=len(remote_sitemaps))
            async with AsyncFetcher(config) as fetcher:
                for url in remote_sitemaps:
                    try:
                        result = await fetcher.fetch(url, use_head=False)
                        if result.content:
                            urls = parse_sitemap(result.content, url)
                            all_urls.extend(urls)
                    except FetchError as e:
                        err_console.print(f"[yellow]警告: 无法获取 sitemap {url}: {e.issue.message}[/yellow]")
                    except Exception as e:
                        err_console.print(f"[yellow]警告: 解析 sitemap 出错 {url}: {e}[/yellow]")
                    progress.advance(task)

    return list(dict.fromkeys(all_urls))


@app.command("check")
def check_cmd(
    sitemap: Optional[List[str]] = typer.Option(
        None,
        "--sitemap",
        "-s",
        help="Sitemap URL 或本地文件路径，可多次指定",
    ),
    pages_file: Optional[Path] = typer.Option(
        None,
        "--pages",
        "-p",
        help="页面导出文件 (TXT/CSV, 每行一个 URL)",
    ),
    whitelist: Optional[Path] = typer.Option(
        None,
        "--whitelist",
        "-w",
        help="白名单文件 (每行一个 URL, 支持 * 通配符)",
    ),
    base_domain: Optional[str] = typer.Option(
        None,
        "--domain",
        "-d",
        help="基础域名，用于区分内/外链。默认从第一个 sitemap URL 推断",
    ),
    max_depth: int = typer.Option(
        2,
        "--max-depth",
        help="最大爬取深度 (0 = 仅检查输入链接)",
        min=0,
        max=10,
    ),
    max_redirects: int = typer.Option(
        3,
        "--max-redirects",
        help="最大重定向链长度，超过视为问题",
        min=1,
        max=10,
    ),
    rate_limit: int = typer.Option(
        10,
        "--rate-limit",
        "-r",
        help="每秒最大请求数",
        min=1,
        max=100,
    ),
    concurrency: int = typer.Option(
        20,
        "--concurrency",
        "-c",
        help="最大并发请求数",
        min=1,
        max=100,
    ),
    timeout: float = typer.Option(
        15.0,
        "--timeout",
        help="单次请求超时时间 (秒)",
        min=1.0,
        max=120.0,
    ),
    retries: int = typer.Option(
        2,
        "--retries",
        help="网络错误重试次数",
        min=0,
        max=10,
    ),
    no_title_check: bool = typer.Option(
        False,
        "--no-title-check",
        help="跳过 <title> 标签检查",
    ),
    no_canonical_check: bool = typer.Option(
        False,
        "--no-canonical-check",
        help="跳过 canonical 标签检查",
    ),
    no_image_check: bool = typer.Option(
        False,
        "--no-image-check",
        help="跳过图片资源检查",
    ),
    output_json: Optional[Path] = typer.Option(
        None,
        "--json",
        help="输出 JSON 报告到指定文件",
    ),
    output_md: Optional[Path] = typer.Option(
        None,
        "--markdown",
        "-o",
        help="输出 Markdown 报告到指定文件",
    ),
    output_script: Optional[Path] = typer.Option(
        None,
        "--replace-script",
        help="生成 sed 批量替换脚本 (需人工确认后执行)",
    ),
    print_json: bool = typer.Option(
        False,
        "--print-json",
        help="同时将 JSON 报告打印到标准输出",
    ),
    no_summary: bool = typer.Option(
        False,
        "--no-summary",
        help="不打印终端汇总表格",
    ),
) -> None:
    """运行死链检查。读取 sitemap / 页面导出 / 白名单，检查 404、重定向链、标题缺失和 canonical 冲突。"""

    if not sitemap and not pages_file:
        err_console.print("[bold red]错误: 至少需要指定 --sitemap 或 --pages[/bold red]")
        raise typer.Exit(code=1)

    config = CheckerConfig(
        max_depth=max_depth,
        max_redirects=max_redirects,
        request_timeout=timeout,
        rate_limit_per_second=rate_limit,
        max_concurrent=concurrency,
        retries=retries,
        check_title=not no_title_check,
        check_canonical=not no_canonical_check,
        check_images=not no_image_check,
    )

    state = RuntimeState()
    state.whitelist_patterns = load_whitelist(whitelist)
    state.exported_pages = load_exported_pages(pages_file)

    console.print(
        Panel.fit(
            f"[bold]sitemap-checker v{__version__}[/bold]\n"
            f"最大深度: {max_depth}  速率限制: {rate_limit}/s  并发: {concurrency}\n"
            f"超时: {timeout}s  重试: {retries}  白名单: {len(state.whitelist_patterns)} 条",
            title="配置",
            border_style="cyan",
        )
    )

    sitemap_urls: List[str] = []
    if sitemap:
        sitemap_urls = asyncio.run(_fetch_sitemap_urls(list(sitemap), config))
        state.sitemap_urls = sitemap_urls
        console.print(f"[green]✓[/green] 从 sitemap 提取 {len(sitemap_urls)} 个 URL")

    if state.exported_pages:
        console.print(f"[green]✓[/green] 从页面导出文件加载 {len(state.exported_pages)} 个 URL")

    if not base_domain:
        all_seed = sitemap_urls + state.exported_pages
        for u in all_seed:
            parsed = urlparse(u)
            if parsed.netloc:
                base_domain = parsed.netloc
                break
        if base_domain:
            console.print(f"[cyan]i[/cyan] 自动推断基础域名: {base_domain}")

    if not base_domain:
        err_console.print("[yellow]警告: 无法确定基础域名，所有链接将按外链处理 (仅 HEAD)[/yellow]")

    state.base_domain = base_domain

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        TimeRemainingColumn(),
        console=console,
    ) as progress:
        overall_task = progress.add_task("扫描中...", total=None)

        def _progress(stage: str, done: int, total: int) -> None:
            progress.update(
                overall_task,
                description=f"{stage} ({done}/{total})",
                total=total,
                completed=done,
            )

        checker = SitemapChecker(config, state)
        report = asyncio.run(checker.scan(sitemap_urls, progress_cb=_progress))

        progress.update(overall_task, description="扫描完成 ✓", completed=100, total=100)

    if not no_summary:
        console.print()
        _print_summary_table(report.results)
        _print_issues(report.results, Severity.CRITICAL, "严重问题", "red")
        _print_issues(report.results, Severity.WARNING, "警告", "yellow")
        manual = report.get_manual_review()
        if manual:
            console.print(
                Panel.fit(
                    f"[bold yellow]⚠️  {len(manual)} 条链接需要人工确认[/bold yellow]\n"
                    "网络错误/超时/SSL 问题并非真实死链，\n请内容运营手动验证后再决定是否处理。",
                    border_style="yellow",
                )
            )

    if output_md:
        write_markdown(report, output_md)
        console.print(f"[green]✓[/green] Markdown 报告已写入: {output_md}")

    if output_json:
        write_json(report, output_json)
        console.print(f"[green]✓[/green] JSON 报告已写入: {output_json}")

    if print_json:
        console.print(to_json(report))

    if output_script:
        write_replacement_script(report, output_script)
        console.print(f"[green]✓[/green] 替换脚本已生成: {output_script}")
        console.print(f"     [dim]执行: CONFIRMED=1 SEARCH_ROOT=./src bash {output_script}[/dim]")

    critical_count = len(report.get_critical_issues())
    has_issues = critical_count > 0
    if has_issues:
        raise typer.Exit(code=2)


if __name__ == "__main__":
    app()
