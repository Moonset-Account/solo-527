import typer
from rich.console import Console
from lost_found.cli.external import app as external_app
from lost_found.cli.internal import app as internal_app
from lost_found.cli.admin import app as admin_app

app = typer.Typer(help="校园失物招领与认领审核平台")
console = Console()

app.add_typer(external_app, name="external", help="外部人员入口 - 提交失物/认领信息")
app.add_typer(internal_app, name="internal", help="内部人员入口 - 审核处理")
app.add_typer(admin_app, name="admin", help="管理员入口 - 系统管理")


@app.command()
def init():
    """初始化数据库"""
    from lost_found.db.schema import init_db
    init_db()
    console.print("[green]数据库初始化成功[/green]")


if __name__ == "__main__":
    app()
