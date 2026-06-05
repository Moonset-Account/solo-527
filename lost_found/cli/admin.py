import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt
from typing import Optional
from lost_found.services.system_service import (
    AuthService, LocationService, LockerService, ExportService, LogService
)
from lost_found.dao.user_dao import UserDAO

app = typer.Typer(help="管理员入口 - 系统管理")
console = Console()

_current_user = None


def get_current_user():
    global _current_user
    if _current_user is None:
        console.print("[yellow]请先使用 admin login 命令登录[/yellow]")
        raise typer.Exit(1)
    return _current_user


def require_admin():
    user = get_current_user()
    ok, msg = AuthService.require_role(user, ['admin'])
    if not ok:
        console.print(f"[red]{msg}[/red]")
        raise typer.Exit(1)
    return user


@app.command()
def login(username: str = typer.Option(..., "--username", "-u"),
          password: str = typer.Option(..., "--password", "-p")):
    """管理员登录"""
    global _current_user
    success, msg, user = AuthService.login(username, password)
    if success and user['role'] == 'admin':
        _current_user = user
        console.print(f"[green]✓ {msg}，欢迎 {user['name']} ({user['role']})[/green]")
    else:
        _current_user = None
        console.print(f"[red]✗ 管理员登录失败: {msg if not success else '权限不足'}[/red]")


@app.command()
def add_user(username: str = typer.Option(..., "--username", "-u"),
             password: str = typer.Option(..., "--password", "-p"),
             role: str = typer.Option("internal", "--role", "-r"),
             name: Optional[str] = typer.Option(None, "--name", "-n"),
             phone: Optional[str] = typer.Option(None, "--phone")):
    """添加用户"""
    require_admin()
    
    valid_roles = ['external', 'internal', 'admin']
    if role not in valid_roles:
        console.print(f"[red]✗ 无效角色: {role}，可选: {', '.join(valid_roles)}[/red]")
        raise typer.Exit(1)
    
    try:
        user_id = UserDAO.create(username, password, role, name, phone)
        console.print(f"[green]✓ 用户添加成功，ID: {user_id}[/green]")
    except Exception as e:
        console.print(f"[red]✗ 添加失败: {str(e)}[/red]")


@app.command("list-users")
def list_users(role: Optional[str] = typer.Option(None, "--role", "-r")):
    """查看用户列表"""
    require_admin()
    
    users = UserDAO.list_all(role=role)
    
    if not users:
        console.print("[yellow]暂无用户[/yellow]")
        return
    
    table = Table(title="用户列表", show_lines=True)
    table.add_column("ID", style="cyan")
    table.add_column("用户名", style="bold")
    table.add_column("姓名")
    table.add_column("角色", style="magenta")
    table.add_column("创建时间")
    
    role_map = {
        'admin': '[red]管理员[/red]',
        'internal': '[green]内部人员[/green]',
        'external': '[blue]外部人员[/blue]'
    }
    
    for user in users:
        table.add_row(
            str(user['id']),
            user['username'],
            user.get('name') or '-',
            role_map.get(user['role'], user['role']),
            user['created_at'][:16] if user.get('created_at') else '-'
        )
    
    console.print(table)


@app.command()
def add_location(name: str = typer.Option(..., "--name", "-n"),
                 building: Optional[str] = typer.Option(None, "--building"),
                 floor: Optional[str] = typer.Option(None, "--floor"),
                 description: Optional[str] = typer.Option(None, "--desc")):
    """添加拾取地点"""
    require_admin()
    
    ok, msg, loc_id = LocationService.add_location(name, building, floor, description)
    if ok:
        console.print(f"[green]✓ {msg}，ID: {loc_id}[/green]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command()
def add_locker(code: str = typer.Option(..., "--code", "-c"),
               location_id: Optional[int] = typer.Option(None, "--location-id", "-l"),
               capacity: int = typer.Option(10, "--capacity")):
    """添加保管柜"""
    require_admin()
    
    ok, msg, locker_id = LockerService.add_locker(code, location_id, capacity)
    if ok:
        console.print(f"[green]✓ {msg}，ID: {locker_id}[/green]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command("export-items")
def export_items(filepath: Optional[str] = typer.Option(None, "--output", "-o"),
                 status: Optional[str] = typer.Option(None, "--status"),
                 keyword: Optional[str] = typer.Option(None, "--keyword")):
    """导出失物数据"""
    require_admin()
    
    filters = {}
    if status: filters['status'] = status
    if keyword: filters['keyword'] = keyword
    
    with console.status("[bold green]正在导出..."):
        success, msg, path = ExportService.export_lost_items(filters, filepath)
    
    if success:
        console.print(f"[green]✓ {msg}[/green]")
        console.print(f"[cyan]文件路径: {path}[/cyan]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command("export-claims")
def export_claims(filepath: Optional[str] = typer.Option(None, "--output", "-o"),
                  status: Optional[str] = typer.Option(None, "--status"),
                  keyword: Optional[str] = typer.Option(None, "--keyword")):
    """导出认领申请数据"""
    require_admin()
    
    filters = {}
    if status: filters['status'] = status
    if keyword: filters['keyword'] = keyword
    
    with console.status("[bold green]正在导出..."):
        success, msg, path = ExportService.export_claim_requests(filters, filepath)
    
    if success:
        console.print(f"[green]✓ {msg}[/green]")
        console.print(f"[cyan]文件路径: {path}[/cyan]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command("export-pickups")
def export_pickups(filepath: Optional[str] = typer.Option(None, "--output", "-o"),
                   keyword: Optional[str] = typer.Option(None, "--keyword")):
    """导出领取记录"""
    require_admin()
    
    filters = {}
    if keyword: filters['keyword'] = keyword
    
    with console.status("[bold green]正在导出..."):
        success, msg, path = ExportService.export_pickup_records(filters, filepath)
    
    if success:
        console.print(f"[green]✓ {msg}[/green]")
        console.print(f"[cyan]文件路径: {path}[/cyan]")
    else:
        console.print(f"[red]✗ {msg}[/red]")


@app.command()
def stats():
    """系统统计概览"""
    require_admin()
    
    stats = ExportService.get_stats()
    locker_stats = LockerService.get_locker_stats()
    
    content = f"""
[bold red]🔐 系统管理面板[/bold red]

[bold]📦 失物统计:[/bold]
  总计登记: {stats['total_items']} 件
  保管中: [yellow]{stats['storing']}[/yellow] 件
  待领取: [magenta]{stats['claimed']}[/magenta] 件
  已归还: [green]{stats['returned']}[/green] 件
  归还率: [bold]{stats['return_rate']}%[/bold]
  待审核申请: [red]{stats['pending_claims']}[/red] 条
  贵重物品: {stats['valuable']} 件

[bold]🗄️  保管柜统计:[/bold]
  总计: {locker_stats['total']} 个
  可用: [green]{locker_stats['available']}[/green] 个
  已满: [red]{locker_stats['full']}[/red] 个
  利用率: {locker_stats['utilization']}%
    """
    
    console.print(Panel(content, border_style="red"))
