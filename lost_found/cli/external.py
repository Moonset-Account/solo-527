import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt
from typing import Optional
from lost_found.services.lost_item_service import LostItemService
from lost_found.services.claim_service import ClaimService

app = typer.Typer(help="外部人员入口 - 提交失物/认领信息")
console = Console()


@app.command()
def register_lost():
    """登记拾取到的失物"""
    console.print(Panel.fit("[bold cyan]失物登记[/bold cyan]", border_style="cyan"))
    
    item_name = Prompt.ask("物品名称 *")
    category = Prompt.ask("物品类别（如：电子设备、证件、衣物等）", default="")
    description = Prompt.ask("物品描述", default="")
    is_valuable = Prompt.ask("是否贵重物品？(y/n)", choices=["y", "n"], default="n") == "y"
    is_sensitive = Prompt.ask("是否涉及敏感内容？(y/n)", choices=["y", "n"], default="n") == "y"
    pickup_person = Prompt.ask("拾取人姓名", default="")
    submitter_name = Prompt.ask("您的姓名", default="")
    submitter_phone = Prompt.ask("联系电话 *")
    
    with console.status("[bold green]正在提交..."):
        success, msg, item_id = LostItemService.register_item(
            item_name=item_name,
            category=category or None,
            description=description or None,
            is_valuable=is_valuable,
            is_sensitive=is_sensitive,
            pickup_person=pickup_person or None,
            submitter_name=submitter_name or None,
            submitter_phone=submitter_phone
        )
    
    if success:
        console.print(f"[green]✓ {msg}，物品编号: {item_id}[/green]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command()
def search(keyword: str = typer.Option(..., "--keyword", "-k", help="搜索关键词"),
           category: Optional[str] = typer.Option(None, "--category", "-c", help="物品类别")):
    """搜索相似失物（公开信息）"""
    with console.status("[bold green]正在搜索..."):
        items = LostItemService.search_similar(keyword=keyword, category=category)
    
    if not items:
        console.print("[yellow]未找到匹配的失物[/yellow]")
        return
    
    table = Table(title=f"相似失物搜索结果 ({len(items)} 条)", show_lines=True)
    table.add_column("编号", style="cyan", no_wrap=True)
    table.add_column("物品名称", style="bold")
    table.add_column("类别")
    table.add_column("描述", overflow="fold")
    table.add_column("状态", style="magenta")
    table.add_column("登记时间")
    
    status_map = {
        'registered': '[yellow]待入库[/yellow]',
        'storing': '[green]保管中[/green]',
        'claiming': '[blue]认领中[/blue]',
        'claimed': '[magenta]待领取[/magenta]',
        'returned': '[dim]已归还[/dim]',
        'expired': '[red]已过期[/red]'
    }
    
    for item in items:
        table.add_row(
            str(item['id']),
            item['item_name'],
            item.get('category') or '-',
            item.get('description') or '-',
            status_map.get(item['status'], item['status']),
            item['created_at'][:16] if item.get('created_at') else '-'
        )
    
    console.print(table)


@app.command("list")
def list_items(page: int = typer.Option(1, "--page", "-p", help="页码"),
               page_size: int = typer.Option(20, "--size", "-s", help="每页数量"),
               status: Optional[str] = typer.Option(None, "--status", help="状态筛选"),
               keyword: Optional[str] = typer.Option(None, "--keyword", help="关键词")):
    """查看公开失物列表"""
    filters = {}
    if status:
        filters['status'] = status
    if keyword:
        filters['keyword'] = keyword
    
    with console.status("[bold green]正在查询..."):
        items, total, total_pages = LostItemService.list_items(
            filters=filters, page=page, page_size=page_size, include_sensitive=False
        )
    
    if not items:
        console.print("[yellow]暂无数据[/yellow]")
        return
    
    table = Table(title=f"失物列表 (第 {page}/{total_pages} 页，共 {total} 条)", show_lines=True)
    table.add_column("编号", style="cyan", no_wrap=True)
    table.add_column("物品名称", style="bold")
    table.add_column("类别")
    table.add_column("状态", style="magenta")
    table.add_column("登记时间")
    
    status_map = {
        'registered': '[yellow]待入库[/yellow]',
        'storing': '[green]保管中[/green]',
        'claiming': '[blue]认领中[/blue]',
        'claimed': '[magenta]待领取[/magenta]',
        'returned': '[dim]已归还[/dim]',
        'expired': '[red]已过期[/red]'
    }
    
    for item in items:
        table.add_row(
            str(item['id']),
            item['item_name'],
            item.get('category') or '-',
            status_map.get(item['status'], item['status']),
            item['created_at'][:16] if item.get('created_at') else '-'
        )
    
    console.print(table)


@app.command()
def submit_claim(item_id: int = typer.Option(..., "--item-id", "-i", help="失物编号")):
    """提交认领申请"""
    item = LostItemService.get_item(item_id, include_sensitive=False)
    if not item:
        console.print("[red]✗ 失物不存在[/red]")
        raise typer.Exit(1)
    
    console.print(Panel.fit(
        f"[bold cyan]认领申请 - {item['item_name']}[/bold cyan]\n"
        f"类别: {item.get('category') or '-'}\n"
        f"状态: {item['status']}",
        border_style="cyan"
    ))
    
    claimant_name = Prompt.ask("您的姓名 *")
    claimant_phone = Prompt.ask("联系电话 *")
    student_id = Prompt.ask("学号（可选）", default="")
    description = Prompt.ask("物品特征描述 *")
    loss_time = Prompt.ask("丢失时间（可选）", default="")
    loss_location = Prompt.ask("丢失地点（可选）", default="")
    
    if not description:
        console.print("[red]✗ 请提供物品特征描述[/red]")
        raise typer.Exit(1)
    
    with console.status("[bold green]正在提交申请..."):
        success, msg, request_id = ClaimService.submit_claim(
            lost_item_id=item_id,
            claimant_name=claimant_name,
            claimant_phone=claimant_phone,
            description=description,
            loss_time=loss_time or None,
            loss_location=loss_location or None,
            student_id=student_id or None
        )
    
    if success:
        console.print(f"[green]✓ {msg}，申请编号: {request_id}[/green]")
        console.print("[yellow]请等待工作人员审核，审核结果将通过电话通知您[/yellow]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command()
def view_item(item_id: int = typer.Option(..., "--item-id", "-i", help="失物编号")):
    """查看失物详情（公开信息）"""
    item = LostItemService.get_item(item_id, include_sensitive=False)
    if not item:
        console.print("[red]✗ 失物不存在[/red]")
        raise typer.Exit(1)
    
    status_map = {
        'registered': '待入库',
        'storing': '保管中',
        'claiming': '认领中',
        'claimed': '待领取',
        'returned': '已归还',
        'expired': '已过期'
    }
    
    content = f"""
[bold cyan]{item['item_name']}[/bold cyan]
[dim]编号: {item['id']}[/dim]

[bold]类别:[/bold] {item.get('category') or '-'}
[bold]状态:[/bold] {status_map.get(item['status'], item['status'])}
[bold]描述:[/bold] {item.get('description') or '-'}
[bold]拾取地点:[/bold] {item.get('location_name') or '-'}
[bold]贵重物品:[/bold] {'是' if item.get('is_valuable') else '否'}
[bold]登记时间:[/bold] {item.get('created_at', '-')}
[bold]保管柜:[/bold] {item.get('locker_code') or '-'}
    """
    
    console.print(Panel(content, title="失物详情", border_style="cyan"))
