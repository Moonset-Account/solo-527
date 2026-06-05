#!/usr/bin/env python3
"""
验收测试脚本 - 校园失物招领与认领审核平台
测试路径：新增、审批、撤回、导出
"""

import sys
import os
import csv
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from lost_found.services.lost_item_service import LostItemService
from lost_found.services.claim_service import ClaimService
from lost_found.services.system_service import ExportService, AuthService

console = Console()
passed = 0
failed = 0


def test_case(name, func):
    global passed, failed
    console.print(f"\n[cyan]▶ 测试: {name}[/cyan]")
    try:
        result = func()
        if result:
            console.print(f"[green]✓ 通过[/green]")
            passed += 1
        else:
            console.print(f"[red]✗ 失败[/red]")
            failed += 1
    except Exception as e:
        console.print(f"[red]✗ 异常: {str(e)}[/red]")
        import traceback
        traceback.print_exc()
        failed += 1


# ==================== 1. 新增路径测试 ====================

def test_register_lost_item():
    """测试：登记失物（外部入口）"""
    success, msg, item_id = LostItemService.register_item(
        item_name="黑色苹果手机",
        category="电子设备",
        description="iPhone 14 Pro，黑色，有划痕",
        is_valuable=True,
        is_sensitive=False,
        submitter_name="张三",
        submitter_phone="13800138001"
    )
    console.print(f"  登记结果: {msg}, ID: {item_id}")
    assert success, f"登记失败: {msg}"
    assert item_id is not None, "物品ID为空"
    
    item = LostItemService.get_item(item_id, include_sensitive=True)
    assert item is not None, "查询物品失败"
    assert item['item_name'] == "黑色苹果手机", "物品名称不匹配"
    assert item['status'] == 'registered', "初始状态不正确"
    assert item['is_valuable'] == 1, "贵重物品标记不正确"
    
    return True


def test_register_sensitive_item():
    """测试：登记敏感物品"""
    success, msg, item_id = LostItemService.register_item(
        item_name="身份证",
        category="证件",
        description="内含个人身份信息",
        is_valuable=False,
        is_sensitive=True,
        submitter_name="李四",
        submitter_phone="13800138002"
    )
    console.print(f"  敏感物品登记: {msg}, ID: {item_id}")
    assert success, f"登记失败: {msg}"
    
    item_public = LostItemService.get_item(item_id, include_sensitive=False)
    assert item_public['photo_path'] == "[敏感照片已隐藏]", "敏感信息未隐藏"
    
    item_internal = LostItemService.get_item(item_id, include_sensitive=True)
    assert item_internal['is_sensitive'] == 1, "敏感标记不正确"
    
    return True


def test_duplicate_submit_validation():
    """测试：输入验证（空物品名）"""
    success, msg, item_id = LostItemService.register_item(
        item_name="",
        category="测试",
        submitter_name="测试",
        submitter_phone="13800138000"
    )
    console.print(f"  空名称验证: {msg}")
    assert not success, "空物品名应该被拒绝"
    assert "不能为空" in msg, "错误提示不正确"
    return True


def test_search_similar():
    """测试：相似搜索"""
    results = LostItemService.search_similar("手机")
    console.print(f"  搜索到 {len(results)} 条结果")
    assert len(results) > 0, "应该能搜索到手机相关物品"
    return True


# ==================== 2. 审批路径测试 ====================

def test_submit_claim():
    """测试：提交认领申请"""
    success, msg, item_id = LostItemService.register_item(
        item_name="蓝色水杯",
        category="生活用品",
        description="蓝色保温杯，有Hello Kitty贴纸",
        submitter_name="王五",
        submitter_phone="13800138003"
    )
    assert success, "登记失物失败"
    
    success, msg, request_id = ClaimService.submit_claim(
        lost_item_id=item_id,
        claimant_name="赵六",
        claimant_phone="13900139001",
        description="蓝色保温杯，杯口有掉漆",
        student_id="2024001"
    )
    console.print(f"  认领申请提交: {msg}, 申请ID: {request_id}")
    assert success, f"提交失败: {msg}"
    assert request_id is not None, "申请ID为空"
    
    req = ClaimService.get_claim_request(request_id, include_sensitive=True)
    assert req is not None, "查询申请失败"
    assert req['status'] == 'pending', "初始状态应为待审核"
    
    item = LostItemService.get_item(item_id, include_sensitive=True)
    assert item['status'] == 'claiming', "物品状态应为认领中"
    
    return True


def test_review_claim_approve():
    """测试：审核通过认领申请"""
    success, msg, item_id = LostItemService.register_item(
        item_name="红色钱包",
        category="钱包",
        description="红色皮质钱包",
        is_valuable=True,
        submitter_name="测试",
        submitter_phone="13800138004"
    )
    assert success, "登记失物失败"
    
    success, msg, request_id = ClaimService.submit_claim(
        lost_item_id=item_id,
        claimant_name="申请人1",
        claimant_phone="13900139002",
        description="红色钱包，有我的照片"
    )
    assert success, "提交申请失败"
    
    success, msg = ClaimService.review_claim(
        claim_request_id=request_id,
        approved=True,
        reviewer_id=2,
        review_remark="信息核对无误"
    )
    console.print(f"  审核通过: {msg}")
    assert success, f"审核失败: {msg}"
    
    req = ClaimService.get_claim_request(request_id, include_sensitive=True)
    assert req['status'] == 'approved', "状态应为已通过"
    
    item = LostItemService.get_item(item_id, include_sensitive=True)
    assert item['status'] == 'claimed', "物品状态应为待领取"
    
    return True


def test_review_claim_reject():
    """测试：审核拒绝认领申请"""
    success, msg, item_id = LostItemService.register_item(
        item_name="眼镜",
        category="配饰",
        description="黑色框架眼镜",
        submitter_name="测试",
        submitter_phone="13800138005"
    )
    assert success, "登记失物失败"
    
    success, msg, request_id = ClaimService.submit_claim(
        lost_item_id=item_id,
        claimant_name="申请人2",
        claimant_phone="13900139003",
        description="棕色眼镜"
    )
    assert success, "提交申请失败"
    
    success, msg = ClaimService.review_claim(
        claim_request_id=request_id,
        approved=False,
        reviewer_id=2,
        review_remark="颜色描述不符"
    )
    console.print(f"  审核拒绝: {msg}")
    assert success, f"审核失败: {msg}"
    
    req = ClaimService.get_claim_request(request_id, include_sensitive=True)
    assert req['status'] == 'rejected', "状态应为已拒绝"
    
    return True


def test_confirm_pickup_valuable():
    """测试：贵重物品领取核销（需要证件后四位）"""
    success, msg, item_id = LostItemService.register_item(
        item_name="笔记本电脑",
        category="电子设备",
        description="MacBook Pro",
        is_valuable=True,
        submitter_name="测试",
        submitter_phone="13800138006"
    )
    assert success, "登记失物失败"
    
    success, msg, request_id = ClaimService.submit_claim(
        lost_item_id=item_id,
        claimant_name="失主",
        claimant_phone="13900139004",
        description="MacBook Pro 2023"
    )
    assert success, "提交申请失败"
    
    success, msg = ClaimService.review_claim(request_id, True, 2)
    assert success, "审核失败"
    
    success, msg = ClaimService.confirm_pickup(request_id, handler_id=2, id_last4=None)
    console.print(f"  无证件号领取: {msg}")
    assert not success, "贵重物品无证件号应该被拒绝"
    assert "证件后四位" in msg, "错误提示不正确"
    
    success, msg = ClaimService.confirm_pickup(request_id, handler_id=2, id_last4="1234")
    console.print(f"  有证件号领取: {msg}")
    assert success, f"领取失败: {msg}"
    
    req = ClaimService.get_claim_request(request_id, include_sensitive=True)
    assert req['status'] == 'completed', "状态应为已完成"
    
    item = LostItemService.get_item(item_id, include_sensitive=True)
    assert item['status'] == 'returned', "物品状态应为已归还"
    
    return True


# ==================== 3. 撤回路径测试 ====================

def test_withdraw_claim():
    """测试：撤回认领申请"""
    success, msg, item_id = LostItemService.register_item(
        item_name="雨伞",
        category="生活用品",
        description="黑色长柄伞",
        submitter_name="测试",
        submitter_phone="13800138007"
    )
    assert success, "登记失物失败"
    
    success, msg, request_id = ClaimService.submit_claim(
        lost_item_id=item_id,
        claimant_name="撤回测试人",
        claimant_phone="13900139005",
        description="黑色雨伞"
    )
    assert success, "提交申请失败"
    
    req = ClaimService.get_claim_request(request_id, include_sensitive=True)
    assert req['status'] == 'pending', "状态应为待审核"
    
    success, msg = ClaimService.withdraw_claim(request_id, user_id=2)
    console.print(f"  撤回申请: {msg}")
    assert success, f"撤回失败: {msg}"
    
    req = ClaimService.get_claim_request(request_id, include_sensitive=True)
    assert req['status'] == 'withdrawn', "状态应为已撤回"
    
    return True


def test_withdraw_completed_claim():
    """测试：已完成的申请不能撤回"""
    success, msg, item_id = LostItemService.register_item(
        item_name="钥匙",
        category="钥匙",
        description="一串钥匙",
        submitter_name="测试",
        submitter_phone="13800138008"
    )
    assert success, "登记失物失败"
    
    success, msg, request_id = ClaimService.submit_claim(
        lost_item_id=item_id,
        claimant_name="测试人",
        claimant_phone="13900139006",
        description="我的钥匙"
    )
    assert success, "提交申请失败"
    
    success, msg = ClaimService.review_claim(request_id, True, 2)
    assert success, "审核失败"
    
    success, msg = ClaimService.confirm_pickup(request_id, handler_id=2)
    assert success, "领取失败"
    
    success, msg = ClaimService.withdraw_claim(request_id, user_id=2)
    console.print(f"  撤回已完成申请: {msg}")
    assert not success, "已完成的申请应该不能撤回"
    assert "不允许撤回" in msg, "错误提示不正确"
    
    return True


# ==================== 4. 导出路径测试 ====================

def test_export_lost_items():
    """测试：导出失物数据"""
    success, msg, filepath = ExportService.export_lost_items()
    console.print(f"  导出失物: {msg} -> {filepath}")
    assert success, f"导出失败: {msg}"
    assert os.path.exists(filepath), "导出文件不存在"
    
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        rows = list(reader)
        assert len(rows) > 1, "应该有表头和数据"
        console.print(f"  导出 {len(rows)-1} 条记录")
    
    os.unlink(filepath)
    return True


def test_export_claim_requests():
    """测试：导出认领申请数据"""
    success, msg, filepath = ExportService.export_claim_requests()
    console.print(f"  导出申请: {msg} -> {filepath}")
    assert success, f"导出失败: {msg}"
    assert os.path.exists(filepath), "导出文件不存在"
    
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        rows = list(reader)
        assert len(rows) > 1, "应该有表头和数据"
    
    os.unlink(filepath)
    return True


def test_export_pickup_records():
    """测试：导出领取记录"""
    success, msg, filepath = ExportService.export_pickup_records()
    console.print(f"  导出领取记录: {msg} -> {filepath}")
    assert success, f"导出失败: {msg}"
    assert os.path.exists(filepath), "导出文件不存在"
    
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        rows = list(reader)
        assert len(rows) >= 1, "至少有表头"
    
    os.unlink(filepath)
    return True


# ==================== 权限测试 ====================

def test_auth_validation():
    """测试：用户认证"""
    success, msg, user = AuthService.login("staff1", "staff123")
    console.print(f"  内部人员登录: {msg}")
    assert success, f"登录失败: {msg}"
    assert user['role'] == 'internal', "角色不正确"
    
    success, msg, user = AuthService.login("admin", "admin123")
    assert success, f"管理员登录失败: {msg}"
    assert user['role'] == 'admin', "角色不正确"
    
    success, msg, user = AuthService.login("wrong", "wrong")
    console.print(f"  错误登录: {msg}")
    assert not success, "错误凭证应该被拒绝"
    
    return True


def test_role_permission():
    """测试：角色权限控制"""
    from lost_found.services.system_service import AuthService
    
    admin_user = {'role': 'admin'}
    internal_user = {'role': 'internal'}
    
    ok, msg = AuthService.require_role(admin_user, ['admin'])
    assert ok, "管理员应有权限"
    
    ok, msg = AuthService.require_role(internal_user, ['admin'])
    console.print(f"  内部人员访问管理员资源: {msg}")
    assert not ok, "内部人员不应有管理员权限"
    assert "权限不足" in msg, "错误提示不正确"
    
    ok, msg = AuthService.require_role(internal_user, ['internal', 'admin'])
    assert ok, "内部人员应能访问内部资源"
    
    return True


def run_all_tests():
    console.print(Panel.fit(
        "[bold cyan]校园失物招领与认领审核平台 - 验收测试[/bold cyan]\n"
        "测试路径：新增、审批、撤回、导出",
        border_style="cyan"
    ))
    
    # 1. 新增路径
    console.print("\n[bold yellow]══════════════ 1. 新增路径 ══════════════[/bold yellow]")
    test_case("登记普通失物", test_register_lost_item)
    test_case("登记敏感物品（信息隐藏）", test_register_sensitive_item)
    test_case("输入验证（空物品名）", test_duplicate_submit_validation)
    test_case("相似物品搜索", test_search_similar)
    
    # 2. 审批路径
    console.print("\n[bold yellow]══════════════ 2. 审批路径 ══════════════[/bold yellow]")
    test_case("提交认领申请", test_submit_claim)
    test_case("审核通过申请", test_review_claim_approve)
    test_case("审核拒绝申请", test_review_claim_reject)
    test_case("贵重物品领取核销（证件验证）", test_confirm_pickup_valuable)
    
    # 3. 撤回路径
    console.print("\n[bold yellow]══════════════ 3. 撤回路径 ══════════════[/bold yellow]")
    test_case("撤回待审核申请", test_withdraw_claim)
    test_case("已完成申请无法撤回", test_withdraw_completed_claim)
    
    # 4. 导出路径
    console.print("\n[bold yellow]══════════════ 4. 导出路径 ══════════════[/bold yellow]")
    test_case("导出失物数据", test_export_lost_items)
    test_case("导出认领申请数据", test_export_claim_requests)
    test_case("导出领取记录", test_export_pickup_records)
    
    # 权限测试
    console.print("\n[bold yellow]══════════════ 5. 权限验证 ══════════════[/bold yellow]")
    test_case("用户认证验证", test_auth_validation)
    test_case("角色权限控制", test_role_permission)
    
    # 总结
    total = passed + failed
    console.print("\n" + "=" * 50)
    console.print(f"[bold]测试完成:[/bold] {total} 个测试用例")
    console.print(f"  [green]通过: {passed}[/green]")
    console.print(f"  [red]失败: {failed}[/red]")
    
    if failed == 0:
        console.print("[green bold]✓ 所有测试通过！系统验收合格 ✓[/green bold]")
    else:
        console.print("[red bold]✗ 存在测试失败，请检查问题 ✗[/red bold]")
    
    return failed == 0


if __name__ == "__main__":
    os.chdir(Path(__file__).parent)
    success = run_all_tests()
    sys.exit(0 if success else 1)
