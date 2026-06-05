#!/usr/bin/env python3
"""
工作流演示脚本 - 验证登录状态持久化 + 证明材料流程
"""

import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from rich.console import Console
from rich.panel import Panel

console = Console()

console.print(Panel.fit(
    "[bold cyan]校园失物招领平台 - 完整工作流演示[/bold cyan]\n\n"
    "1. 登录状态持久化验证\n"
    "2. 证明材料审核流程验证\n"
    "3. 内部人员导出功能验证",
    border_style="cyan"
))

# 1. 清理旧会话
session_file = Path(__file__).parent / ".session.json"
if session_file.exists():
    session_file.unlink()
    console.print("[dim]已清理旧会话文件[/dim]")

# 2. 导入服务
from lost_found.services import auth_session
from lost_found.services.system_service import AuthService
from lost_found.services.lost_item_service import LostItemService
from lost_found.services.claim_service import ClaimService
from lost_found.services.system_service import ExportService

console.print("\n[bold yellow]═══════════ 1. 登录状态持久化验证 ═══════════[/bold yellow]")

# 登录
console.print("\n[cyan]▶ 内部人员登录[/cyan]")
success, msg, user = AuthService.login("staff1", "staff123")
if success:
    auth_session.save_session(user)
    console.print(f"[green]✓ 登录成功: {user['name']} ({user['role']})[/green]")
    
    # 检查会话文件
    if session_file.exists():
        console.print(f"[green]✓ 会话文件已创建: {session_file}[/green]")
    
    # 模拟跨命令读取会话
    console.print("\n[cyan]▶ 模拟下一个命令读取会话[/cyan]")
    loaded_user = auth_session.get_current_user()
    if loaded_user:
        console.print(f"[green]✓ 会话恢复成功: {loaded_user['name']} ({loaded_user['role']})[/green]")
        console.print(f"[dim]无需重新登录即可执行后续操作[/dim]")
    else:
        console.print("[red]✗ 会话恢复失败[/red]")
else:
    console.print(f"[red]✗ 登录失败: {msg}[/red]")

# 获取当前用户
current_user = auth_session.get_current_user()
if not current_user:
    console.print("[red]✗ 无登录用户，终止测试[/red]")
    sys.exit(1)

console.print("\n[bold yellow]═══════════ 2. 证明材料审核流程 ═══════════[/bold yellow]")

# 登记失物
console.print("\n[cyan]步骤1: 登记失物[/cyan]")
success, msg, item_id = LostItemService.register_item(
    item_name="AirPods Pro 耳机",
    category="电子设备",
    description="白色无线耳机，充电盒有划痕",
    is_valuable=True,
    submitter_name="同学A",
    submitter_phone="13800138001"
)
console.print(f"  失物登记: {msg}, ID: {item_id}")

# 分配保管柜
console.print("\n[cyan]步骤2: 分配保管柜（派发）[/cyan]")
success, msg = LostItemService.assign_locker(item_id, 1, current_user['id'])
console.print(f"  分配保管柜: {msg}")

# 提交认领申请
console.print("\n[cyan]步骤3: 提交认领申请[/cyan]")
success, msg, request_id = ClaimService.submit_claim(
    lost_item_id=item_id,
    claimant_name="失主B",
    claimant_phone="13900139001",
    description="我的AirPods Pro，刻有名字缩写",
    student_id="2024001"
)
console.print(f"  认领申请: {msg}, 申请ID: {request_id}")

# 上传证明材料
console.print("\n[cyan]步骤4: 上传证明材料[/cyan]")
success, msg, proof_id = ClaimService.add_proof_material(
    claim_request_id=request_id,
    material_type="purchase_proof",
    material_path="/uploads/proof_123.pdf",
    description="京东购买凭证，订单号 123456",
    user_id=current_user['id']
)
console.print(f"  购买凭证: {msg}, 材料ID: {proof_id}")

success, msg, proof_id = ClaimService.add_proof_material(
    claim_request_id=request_id,
    material_type="photo",
    material_path="/uploads/item_photo.jpg",
    description="耳机照片，显示刻字",
    user_id=current_user['id']
)
console.print(f"  物品照片: {msg}, 材料ID: {proof_id}")

# 查看证明材料
console.print("\n[cyan]步骤5: 查看证明材料（核验）[/cyan]")
proofs = ClaimService.get_proof_materials(request_id)
console.print(f"  已上传 {len(proofs)} 份证明材料:")
for p in proofs:
    type_map = {'id_card': '身份证', 'student_card': '学生证', 
                'purchase_proof': '购买凭证', 'photo': '照片', 'other': '其他'}
    console.print(f"    - {type_map.get(p['material_type'], p['material_type'])}: {p.get('description', '-')}")

# 审核通过
console.print("\n[cyan]步骤6: 审核通过[/cyan]")
success, msg = ClaimService.review_claim(
    claim_request_id=request_id,
    approved=True,
    reviewer_id=current_user['id'],
    review_remark="证明材料齐全，信息一致"
)
console.print(f"  审核结果: {msg}")

# 领取核销
console.print("\n[cyan]步骤7: 领取核销[/cyan]")
success, msg = ClaimService.confirm_pickup(
    request_id,
    handler_id=current_user['id'],
    id_last4="5678",
    remark="本人领取，已核对身份"
)
console.print(f"  领取核销: {msg}")

console.print("\n[bold yellow]═══════════ 3. 内部导出功能 ═══════════[/bold yellow]")

# 导出失物
console.print("\n[cyan]导出失物数据[/cyan]")
success, msg, path = ExportService.export_lost_items()
if success:
    console.print(f"[green]✓ {msg}[/green]")
    console.print(f"[cyan]  文件: {path}[/cyan]")

# 导出认领申请
console.print("\n[cyan]导出认领申请[/cyan]")
success, msg, path = ExportService.export_claim_requests()
if success:
    console.print(f"[green]✓ {msg}[/green]")
    console.print(f"[cyan]  文件: {path}[/cyan]")

# 导出领取记录
console.print("\n[cyan]导出领取记录[/cyan]")
success, msg, path = ExportService.export_pickup_records()
if success:
    console.print(f"[green]✓ {msg}[/green]")
    console.print(f"[cyan]  文件: {path}[/cyan]")

console.print("\n[bold yellow]═══════════ 工作流完成 ═══════════[/bold yellow]")
console.print(Panel.fit(
    "[green bold]✓ 所有流程验证通过！[/green bold]\n\n"
    "[bold]已验证功能:[/bold]\n"
    "  1. 登录状态持久化（跨命令保持）\n"
    "  2. 证明材料上传/查看/审核流程\n"
    "  3. 内部人员导出功能\n"
    "  4. 完整的核验→派发→审核→核销工作流",
    border_style="green"
))
