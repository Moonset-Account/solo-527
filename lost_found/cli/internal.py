import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from typing import Optional
from lost_found.services.lost_item_service import LostItemService
from lost_found.services.claim_service import ClaimService
from lost_found.services.system_service import (
    LocationService, LockerService, AuthService, FilterService, ExportService, LogService
)

app = typer.Typer(help="内部人员入口 - 审核处理")
console = Console()

_current_user = None


def get_current_user():
    global _current_user
    if _current_user is None:
        console.print("[yellow]请先使用 internal login 命令登录[/yellow]")
        raise typer.Exit(1)
    return _current_user


def require_internal():
    user = get_current_user()
    ok, msg = AuthService.require_role(user, ['internal', 'admin'])
    if not ok:
        console.print(f"[red]{msg}[/red]")
        raise typer.Exit(1)
    return user


@app.command()
def login(username: str = typer.Option(..., "--username", "-u"),
          password: str = typer.Option(..., "--password", "-p")):
    """内部人员登录"""
    global _current_user
    success, msg, user = AuthService.login(username, password)
    if success:
        _current_user = user
        console.print(f"[green]✓ {msg}，欢迎 {user['name']} ({user['role']})[/green]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command()
def dashboard():
    """查看数据概览"""
    require_internal()
    
    with console.status("[bold green]加载数据..."):
        stats = ExportService.get_stats()
        locker_stats = LockerService.get_locker_stats()
    
    content = f"""
[bold cyan]📊 数据概览[/bold cyan]

[bold]失物统计:[/bold]
  总计登记: {stats['total_items']} 件
  保管中: [yellow]{stats['storing']}[/yellow] 件
  待领取: [magenta]{stats['claimed']}[/magenta] 件
  已归还: [green]{stats['returned']}[/green] 件
  归还率: [bold]{stats['return_rate']}%[/bold]

[bold]认领申请:[/bold]
  待审核: [red]{stats['pending_claims']}[/red] 条
  贵重物品: {stats['valuable']} 件

[bold]保管柜状态:[/bold]
  总计: {locker_stats['total']} 个
  可用: [green]{locker_stats['available']}[/green] 个
  已满: [red]{locker_stats['full']}[/red] 个
  利用率: {locker_stats['utilization']}%
    """
    
    console.print(Panel(content, border_style="cyan"))


@app.command("list-items")
def list_items(page: int = typer.Option(1, "--page", "-p"),
               page_size: int = typer.Option(20, "--size", "-s"),
               status: Optional[str] = typer.Option(None, "--status"),
               keyword: Optional[str] = typer.Option(None, "--keyword"),
               category: Optional[str] = typer.Option(None, "--category"),
               is_valuable: bool = typer.Option(False, "--valuable", help="仅显示贵重物品"),
               not_valuable: bool = typer.Option(False, "--not-valuable", help="仅显示非贵重物品"),
               location_id: Optional[int] = typer.Option(None, "--location-id"),
               save_filter: Optional[str] = typer.Option(None, "--save-filter", help="保存筛选条件名称"),
               use_filter: Optional[str] = typer.Option(None, "--use-filter", help="使用已保存的筛选条件")):
    """查看失物列表（内部视图，含敏感信息）"""
    user = require_internal()
    
    filters = {}
    
    if use_filter:
        saved_filters = FilterService.get_my_filters(user['id'], 'lost_item')
        filter_data = None
        for f in saved_filters:
            if f['filter_name'] == use_filter:
                filter_data = f['filter_data']
                break
        if filter_data:
            filters = filter_data
            console.print(f"[cyan]使用筛选条件: {use_filter}[/cyan]")
        else:
            console.print(f"[yellow]未找到筛选条件: {use_filter}[/yellow]")
    
    if status: filters['status'] = status
    if keyword: filters['keyword'] = keyword
    if category: filters['category'] = category
    if is_valuable and not not_valuable:
        filters['is_valuable'] = True
    elif not_valuable and not is_valuable:
        filters['is_valuable'] = False
    if location_id: filters['location_id'] = location_id
    
    if save_filter and filters:
        ok, msg, _ = FilterService.save_filter(user['id'], save_filter, 'lost_item', filters)
        if ok:
            console.print(f"[green]✓ {msg}[/green]")
    
    with console.status("[bold green]查询中..."):
        items, total, total_pages = LostItemService.list_items(
            filters=filters, page=page, page_size=page_size, include_sensitive=True
        )
    
    if not items:
        console.print("[yellow]暂无数据[/yellow]")
        return
    
    table = Table(title=f"失物列表 (第 {page}/{total_pages} 页，共 {total} 条)", show_lines=True)
    table.add_column("编号", style="cyan")
    table.add_column("物品名称", style="bold")
    table.add_column("类别")
    table.add_column("状态", style="magenta")
    table.add_column("贵重", style="yellow")
    table.add_column("敏感", style="red")
    table.add_column("保管柜")
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
            '[yellow]★[/yellow]' if item.get('is_valuable') else '-',
            '[red]✓[/red]' if item.get('is_sensitive') else '-',
            item.get('locker_code') or '-',
            item['created_at'][:16] if item.get('created_at') else '-'
        )
    
    console.print(table)


@app.command()
def view_item(item_id: int = typer.Option(..., "--item-id", "-i")):
    """查看失物详情（内部视图）"""
    require_internal()
    
    item = LostItemService.get_item(item_id, include_sensitive=True)
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
[bold]贵重物品:[/bold] {'是' if item.get('is_valuable') else '否'}
[bold]敏感内容:[/bold] {'是' if item.get('is_sensitive') else '否'}
[bold]照片:[/bold] {item.get('photo_path') or '-'}

[bold]拾取信息:[/bold]
  地点: {item.get('location_name') or '-'}
  时间: {item.get('pickup_time') or '-'}
  拾取人: {item.get('pickup_person') or '-'}

[bold]保管信息:[/bold]
  保管柜: {item.get('locker_code') or '-'}

[bold]提交信息:[/bold]
  提交人: {item.get('submitter_name') or '-'}
  联系电话: {item.get('submitter_phone') or '-'}
  登记时间: {item.get('created_at', '-')}

[bold]备注:[/bold] {item.get('remark') or '-'}
    """
    
    console.print(Panel(content, title="失物详情（内部视图）", border_style="cyan"))


@app.command()
def assign_locker(item_id: int = typer.Option(..., "--item-id", "-i"),
                  locker_id: int = typer.Option(..., "--locker-id", "-l")):
    """分配保管柜"""
    user = require_internal()
    
    with console.status("[bold green]处理中..."):
        success, msg = LostItemService.assign_locker(item_id, locker_id, user['id'])
    
    if success:
        console.print(f"[green]✓ {msg}[/green]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command()
def update_status(item_id: int = typer.Option(..., "--item-id", "-i"),
                  status: str = typer.Option(..., "--status", "-s"),
                  remark: Optional[str] = typer.Option(None, "--remark", "-r")):
    """更新失物状态"""
    user = require_internal()
    
    with console.status("[bold green]更新中..."):
        success, msg = LostItemService.update_status(item_id, status, user['id'], remark)
    
    if success:
        console.print(f"[green]✓ {msg}[/green]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command("list-claims")
def list_claims(page: int = typer.Option(1, "--page", "-p"),
                page_size: int = typer.Option(20, "--size", "-s"),
                status: Optional[str] = typer.Option(None, "--status"),
                keyword: Optional[str] = typer.Option(None, "--keyword"),
                save_filter: Optional[str] = typer.Option(None, "--save-filter"),
                use_filter: Optional[str] = typer.Option(None, "--use-filter")):
    """查看认领申请列表"""
    user = require_internal()
    
    filters = {}
    
    if use_filter:
        saved_filters = FilterService.get_my_filters(user['id'], 'claim')
        filter_data = None
        for f in saved_filters:
            if f['filter_name'] == use_filter:
                filter_data = f['filter_data']
                break
        if filter_data:
            filters = filter_data
    
    if status: filters['status'] = status
    if keyword: filters['keyword'] = keyword
    
    if save_filter and filters:
        FilterService.save_filter(user['id'], save_filter, 'claim', filters)
    
    with console.status("[bold green]查询中..."):
        requests, total, total_pages = ClaimService.list_claim_requests(
            filters=filters, page=page, page_size=page_size
        )
    
    if not requests:
        console.print("[yellow]暂无数据[/yellow]")
        return
    
    table = Table(title=f"认领申请列表 (第 {page}/{total_pages} 页，共 {total} 条)", show_lines=True)
    table.add_column("申请号", style="cyan")
    table.add_column("物品", style="bold")
    table.add_column("认领人")
    table.add_column("电话")
    table.add_column("状态", style="magenta")
    table.add_column("贵重", style="yellow")
    table.add_column("申请时间")
    
    status_map = {
        'pending': '[yellow]待审核[/yellow]',
        'approved': '[green]已通过[/green]',
        'rejected': '[red]已拒绝[/red]',
        'withdrawn': '[dim]已撤回[/dim]',
        'completed': '[blue]已完成[/blue]'
    }
    
    for req in requests:
        table.add_row(
            str(req['id']),
            req['item_name'],
            req.get('claimant_name') or '-',
            req.get('claimant_phone') or '-',
            status_map.get(req['status'], req['status']),
            '[yellow]★[/yellow]' if req.get('is_valuable') else '-',
            req['created_at'][:16] if req.get('created_at') else '-'
        )
    
    console.print(table)


@app.command()
def view_claim(request_id: int = typer.Option(..., "--request-id", "-r")):
    """查看认领申请详情"""
    require_internal()
    
    req = ClaimService.get_claim_request(request_id, include_sensitive=True)
    if not req:
        console.print("[red]✗ 申请不存在[/red]")
        raise typer.Exit(1)
    
    proofs = ClaimService.get_proof_materials(request_id)
    verifications = ClaimService.get_verification_records(request_id)
    
    status_map = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝',
        'withdrawn': '已撤回',
        'completed': '已完成'
    }
    
    content = f"""
[bold cyan]认领申请 #{req['id']}[/bold cyan]

[bold]物品:[/bold] {req['item_name']}
[bold]状态:[/bold] {status_map.get(req['status'], req['status'])}
[bold]贵重物品:[/bold] {'是' if req.get('is_valuable') else '否'}

[bold]认领人信息:[/bold]
  姓名: {req.get('claimant_name') or '-'}
  电话: {req.get('claimant_phone') or '-'}
  学号: {req.get('student_id') or '-'}

[bold]认领说明:[/bold]
  特征描述: {req.get('description') or '-'}
  丢失时间: {req.get('loss_time') or '-'}
  丢失地点: {req.get('loss_location') or '-'}

[bold]审核信息:[/bold]
  审核意见: {req.get('review_remark') or '-'}
  审核时间: {req.get('reviewed_at') or '-'}
    """
    
    console.print(Panel(content, title="认领申请详情", border_style="cyan"))
    
    if proofs:
        proof_table = Table(title="证明材料", show_lines=True)
        proof_table.add_column("类型")
        proof_table.add_column("描述")
        proof_table.add_column("上传时间")
        type_map = {
            'id_card': '身份证',
            'student_card': '学生证',
            'purchase_proof': '购买凭证',
            'photo': '照片',
            'other': '其他'
        }
        for p in proofs:
            proof_table.add_row(
                type_map.get(p['material_type'], p['material_type']),
                p.get('description') or '-',
                p['uploaded_at'][:16] if p.get('uploaded_at') else '-'
            )
        console.print(proof_table)


@app.command()
def review_claim(request_id: int = typer.Option(..., "--request-id", "-r"),
                 approve: bool = typer.Option(False, "--approve", "-a", help="通过申请"),
                 reject: bool = typer.Option(False, "--reject", "-j", help="拒绝申请"),
                 remark: Optional[str] = typer.Option(None, "--remark", "-m")):
    """审核认领申请"""
    user = require_internal()
    
    if approve and reject:
        console.print("[red]✗ 不能同时选择通过和拒绝[/red]")
        raise typer.Exit(1)
    if not approve and not reject:
        console.print("[red]✗ 请指定 --approve 或 --reject[/red]")
        raise typer.Exit(1)
    
    approved = approve
    
    if not approved and not remark:
        remark = Prompt.ask("请输入拒绝原因")
    
    with console.status("[bold green]审核中..."):
        success, msg = ClaimService.review_claim(request_id, approved, user['id'], remark)
    
    if success:
        console.print(f"[green]✓ {msg}[/green]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command()
def withdraw_claim(request_id: int = typer.Option(..., "--request-id", "-r")):
    """撤回认领申请"""
    user = require_internal()
    
    if not Confirm.ask("确定要撤回此认领申请吗？"):
        return
    
    with console.status("[bold green]处理中..."):
        success, msg = ClaimService.withdraw_claim(request_id, user['id'])
    
    if success:
        console.print(f"[green]✓ {msg}[/green]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command()
def confirm_pickup(request_id: int = typer.Option(..., "--request-id", "-r"),
                   id_last4: Optional[str] = typer.Option(None, "--id-last4", help="证件后四位"),
                   remark: Optional[str] = typer.Option(None, "--remark")):
    """确认领取（核销）"""
    user = require_internal()
    
    req = ClaimService.get_claim_request(request_id, include_sensitive=True)
    if req and req.get('is_valuable') and not id_last4:
        id_last4 = Prompt.ask("贵重物品，请输入证件后四位 *")
    
    with console.status("[bold green]核销中..."):
        success, msg = ClaimService.confirm_pickup(request_id, user['id'], id_last4, remark)
    
    if success:
        console.print(f"[green]✓ {msg}[/green]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command("list-lockers")
def list_lockers(status: Optional[str] = typer.Option(None, "--status")):
    """查看保管柜列表"""
    require_internal()
    
    lockers = LockerService.list_lockers(status=status)
    
    table = Table(title="保管柜列表", show_lines=True)
    table.add_column("编号", style="cyan")
    table.add_column("柜号", style="bold")
    table.add_column("位置")
    table.add_column("容量")
    table.add_column("当前")
    table.add_column("状态", style="magenta")
    
    status_map = {
        'available': '[green]可用[/green]',
        'full': '[red]已满[/red]',
        'maintenance': '[yellow]维护中[/yellow]'
    }
    
    for locker in lockers:
        table.add_row(
            str(locker['id']),
            locker['code'],
            locker.get('location_name') or '-',
            str(locker['capacity']),
            str(locker['current_count']),
            status_map.get(locker['status'], locker['status'])
        )
    
    console.print(table)


@app.command("list-locations")
def list_locations():
    """查看拾取地点列表"""
    require_internal()
    
    locations = LocationService.list_locations()
    
    table = Table(title="拾取地点列表", show_lines=True)
    table.add_column("编号", style="cyan")
    table.add_column("名称", style="bold")
    table.add_column("楼栋")
    table.add_column("楼层")
    table.add_column("描述")
    
    for loc in locations:
        table.add_row(
            str(loc['id']),
            loc['name'],
            loc.get('building') or '-',
            loc.get('floor') or '-',
            loc.get('description') or '-'
        )
    
    console.print(table)


@app.command("list-pickups")
def list_pickups(page: int = typer.Option(1, "--page", "-p"),
                 page_size: int = typer.Option(20, "--size", "-s"),
                 keyword: Optional[str] = typer.Option(None, "--keyword")):
    """查看领取记录"""
    require_internal()
    
    filters = {}
    if keyword:
        filters['keyword'] = keyword
    
    with console.status("[bold green]查询中..."):
        records, total, total_pages = ClaimService.list_pickup_records(
            filters=filters, page=page, page_size=page_size
        )
    
    if not records:
        console.print("[yellow]暂无数据[/yellow]")
        return
    
    table = Table(title=f"领取记录 (第 {page}/{total_pages} 页，共 {total} 条)", show_lines=True)
    table.add_column("编号", style="cyan")
    table.add_column("物品", style="bold")
    table.add_column("领取人")
    table.add_column("电话")
    table.add_column("证件后4位")
    table.add_column("经办人")
    table.add_column("领取时间")
    
    for record in records:
        table.add_row(
            str(record['id']),
            record['item_name'],
            record.get('claimant_name') or '-',
            record.get('claimant_phone') or '-',
            record.get('id_last4') or '-',
            record.get('handler_name') or '-',
            record['pickup_time'][:16] if record.get('pickup_time') else '-'
        )
    
    console.print(table)


@app.command("saved-filters")
def list_saved_filters(filter_type: Optional[str] = typer.Option(None, "--type")):
    """查看已保存的筛选条件"""
    user = require_internal()
    
    filters = FilterService.get_my_filters(user['id'], filter_type)
    
    if not filters:
        console.print("[yellow]暂无保存的筛选条件[/yellow]")
        return
    
    table = Table(title="已保存的筛选条件", show_lines=True)
    table.add_column("编号", style="cyan")
    table.add_column("名称", style="bold")
    table.add_column("类型")
    table.add_column("筛选条件")
    table.add_column("创建时间")
    
    type_map = {
        'lost_item': '失物',
        'claim': '认领申请'
    }
    
    for f in filters:
        table.add_row(
            str(f['id']),
            f['filter_name'],
            type_map.get(f['filter_type'], f['filter_type']),
            str(f['filter_data']),
            f['created_at'][:16] if f.get('created_at') else '-'
        )
    
    console.print(table)


@app.command("logs")
def view_logs(page: int = typer.Option(1, "--page", "-p"),
              page_size: int = typer.Option(50, "--size", "-s")):
    """查看操作日志"""
    require_internal()
    
    with console.status("[bold green]查询中..."):
        logs, total, total_pages = LogService.list_logs(page=page, page_size=page_size)
    
    if not logs:
        console.print("[yellow]暂无日志[/yellow]")
        return
    
    table = Table(title=f"操作日志 (第 {page}/{total_pages} 页，共 {total} 条)", show_lines=True)
    table.add_column("时间", style="cyan")
    table.add_column("操作人")
    table.add_column("操作", style="bold")
    table.add_column("目标")
    table.add_column("详情", overflow="fold")
    
    for log in logs:
        table.add_row(
            log['created_at'][:16] if log.get('created_at') else '-',
            log.get('user_name') or '-',
            log['operation'],
            f"{log.get('target_type', '')} #{log.get('target_id', '')}",
            log.get('detail') or '-'
        )
    
    console.print(table)
