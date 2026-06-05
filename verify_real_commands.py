#!/usr/bin/env python3
"""
真实命令验证脚本 - 通过 subprocess 调用真实 Typer 命令
验证：
1. internal login → dashboard（跨命令会话）
2. admin login → stats（跨命令会话）
3. external submit-claim 带证明材料 → internal 能看到
"""

import subprocess
import sys
import os
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent
SESSION_FILE = BASE_DIR / ".session.json"


def run_cmd(cmd, stdin_input=None, desc=""):
    """执行命令，返回 (stdout, stderr, returncode)"""
    if desc:
        print(f"\n{'='*60}")
        print(f"▶ {desc}")
        print(f"  $ {cmd}")
        print(f"{'='*60}")
    
    result = subprocess.run(
        cmd, shell=True, cwd=str(BASE_DIR),
        capture_output=True, text=True,
        input=stdin_input
    )
    
    if result.stdout.strip():
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                print(f"  {line}")
    if result.stderr.strip():
        for line in result.stderr.strip().split('\n'):
            if line.strip():
                print(f"  [ERR] {line}")
    
    return result.stdout, result.stderr, result.returncode


def cleanup():
    if SESSION_FILE.exists():
        SESSION_FILE.unlink()
        print("\n[清理] 会话文件已删除")


def step1_internal_session():
    """测试1：internal login → internal dashboard"""
    print("\n" + "█"*60)
    print("█  测试1: internal login → internal dashboard (跨命令会话)")
    print("█"*60)
    
    cleanup()
    
    # 1a: 未登录访问 - 应该失败
    out, err, code = run_cmd(
        "python3 main.py internal dashboard",
        desc="1a. 未登录访问 dashboard"
    )
    combined = out + err
    if "请先登录" in combined:
        print("  ✅ 正确：未登录提示需要登录")
    else:
        print("  ❌ 错误：未登录未提示")
        return False
    
    # 1b: 登录
    out, err, code = run_cmd(
        "python3 main.py internal login -u staff1 -p staff123",
        desc="1b. internal login 登录"
    )
    if "登录成功" in out or "欢迎" in out:
        print("  ✅ 登录成功")
    else:
        print("  ❌ 登录失败")
        return False
    
    # 验证会话文件存在
    if SESSION_FILE.exists():
        with open(SESSION_FILE) as f:
            sess = json.load(f)
        print(f"  ✅ 会话文件已创建，用户: {sess.get('name')}, 角色: {sess.get('role')}")
    else:
        print("  ❌ 会话文件未创建")
        return False
    
    # 1c: 跨命令访问 dashboard（新进程）
    out, err, code = run_cmd(
        "python3 main.py internal dashboard",
        desc="1c. 跨命令访问 dashboard（无需重新登录）"
    )
    if "数据概览" in out and "失物统计" in out:
        print("  ✅ dashboard 正常显示数据概览面板")
        if "待审核" in out:
            print("  ✅ 面板包含待审核申请统计")
        if "保管柜状态" in out:
            print("  ✅ 面板包含保管柜状态统计")
    else:
        print("  ❌ dashboard 未正确显示面板")
        return False
    
    # 1d: whoami
    out, err, code = run_cmd(
        "python3 main.py internal whoami",
        desc="1d. whoami 查看当前用户"
    )
    if "工作人员张三" in out and "internal" in out:
        print("  ✅ whoami 正确显示用户信息")
    else:
        print("  ❌ whoami 显示不正确")
        return False
    
    # 1e: 登出
    out, err, code = run_cmd(
        "python3 main.py internal logout",
        desc="1e. 登出"
    )
    print("  ✅ 登出成功")
    
    # 登出后再访问
    out, err, code = run_cmd(
        "python3 main.py internal dashboard",
        desc="1f. 登出后再次访问 dashboard"
    )
    if "请先登录" in out + err:
        print("  ✅ 登出后正确提示需要重新登录")
    else:
        print("  ❌ 登出后会话未清除")
        return False
    
    print("\n✅ 测试1 全部通过！")
    return True


def step2_admin_session():
    """测试2：admin login → admin stats"""
    print("\n" + "█"*60)
    print("█  测试2: admin login → admin stats (跨命令会话)")
    print("█"*60)
    
    cleanup()
    
    # 2a: 管理员登录
    out, err, code = run_cmd(
        "python3 main.py admin login -u admin -p admin123",
        desc="2a. admin login 登录"
    )
    if "登录成功" in out or "欢迎" in out or "管理员" in out:
        print("  ✅ 管理员登录成功")
    else:
        print("  ❌ 管理员登录失败")
        return False
    
    # 2b: 跨命令访问 stats
    out, err, code = run_cmd(
        "python3 main.py admin stats",
        desc="2b. 跨命令访问 admin stats"
    )
    if ("系统管理面板" in out or "失物统计" in out) and "保管柜统计" in out:
        print("  ✅ admin stats 正常显示系统管理面板")
        if "归还率" in out:
            print("  ✅ 面板包含归还率统计")
        if "利用率" in out:
            print("  ✅ 面板包含保管柜利用率")
    else:
        print("  ❌ admin stats 未正确显示面板")
        return False
    
    # 2c: 权限控制 - 内部人员登录后访问 admin
    cleanup()
    run_cmd("python3 main.py internal login -u staff1 -p staff123", desc="2c. 内部人员登录", stdin_input=None)
    out, err, code = run_cmd(
        "python3 main.py admin stats",
        desc="2d. 内部人员尝试访问 admin stats"
    )
    if "权限不足" in out + err or "请先登录" in out + err:
        print("  ✅ 内部人员正确被拒绝访问 admin 资源")
    else:
        print("  ❌ 权限控制失效")
        return False
    
    cleanup()
    print("\n✅ 测试2 全部通过！")
    return True


def step3_proof_workflow():
    """测试3：external 提交带证明材料的申请 → internal 能看到并审核"""
    print("\n" + "█"*60)
    print("█  测试3: external 证明材料 → internal 审核")
    print("█"*60)
    
    cleanup()
    
    # 3a: 先用 API 创建一个测试失物
    from lost_found.services.lost_item_service import LostItemService
    success, msg, item_id = LostItemService.register_item(
        item_name="验证用白色耳机",
        category="电子设备",
        description="白色无线耳机，充电盒有贴纸",
        is_valuable=True,
        submitter_name="测试同学",
        submitter_phone="13800000099"
    )
    if success:
        print(f"\n  [准备] 创建测试失物成功，ID: {item_id}")
    else:
        print(f"  ❌ 创建测试失物失败: {msg}")
        return False
    
    # 3b: external submit-claim 带证明材料参数
    # 提供交互式输入：姓名、电话、学号、描述、丢失时间、丢失地点
    stdin_data = (
        "验证认领人\n"       # 您的姓名
        "13900000099\n"     # 联系电话
        "20240099\n"        # 学号
        "白色耳机，充电盒有Hello Kitty贴纸\n"  # 物品特征描述
        "\n"                # 丢失时间（空）
        "\n"                # 丢失地点（空）
    )
    
    out, err, code = run_cmd(
        f"python3 main.py external submit-claim -i {item_id} "
        f"--proof-type purchase_proof "
        f"--proof-desc '京东购买凭证，订单号 JD123456789' "
        f"--proof-path '/uploads/jd_invoice_99.pdf'",
        stdin_input=stdin_data,
        desc="3b. external submit-claim 带 --proof-* 参数提交申请"
    )
    
    # 提取申请ID
    import re
    match = re.search(r'申请编号[:：]\s*(\d+)', out)
    if not match:
        print("  ❌ 未找到申请编号，提交失败")
        return False
    
    request_id = int(match.group(1))
    print(f"  ✅ 认领申请提交成功，ID: {request_id}")
    
    # 检查证明材料是否上传
    if "证明材料已上传" in out or "材料ID" in out:
        print("  ✅ 证明材料随申请自动上传成功")
    else:
        print("  ❌ 证明材料未自动上传")
        return False
    
    # 3c: external 查看申请状态
    out, err, code = run_cmd(
        f"python3 main.py external view-claim -r {request_id} -h 13900000099",
        desc="3c. external view-claim 查看证明材料"
    )
    if "购买凭证" in out or "purchase_proof" in out or "京东购买" in out:
        print("  ✅ external 可查看已上传的证明材料")
    else:
        print("  ❌ external 看不到证明材料")
        return False
    
    # 3d: internal 登录并查看
    run_cmd("python3 main.py internal login -u staff1 -p staff123", desc="3d. internal 登录", stdin_input=None)
    
    out, err, code = run_cmd(
        f"python3 main.py internal list-claims --status pending",
        desc="3e. internal 查看待审核列表"
    )
    if str(request_id) in out:
        print("  ✅ 待审核列表中显示该申请")
    else:
        print("  ❌ 待审核列表中未找到申请")
        return False
    
    # 3f: internal 查看详情，验证能看到证明材料
    out, err, code = run_cmd(
        f"python3 main.py internal view-claim -r {request_id}",
        desc="3f. internal view-claim 查看证明材料详情"
    )
    if "购买凭证" in out or "purchase_proof" in out or "京东购买" in out or "JD123456789" in out:
        print("  ✅ internal 可看到完整的证明材料详情")
        if "证明材料" in out:
            print("  ✅ 显示证明材料表格")
    else:
        print("  ❌ internal 看不到证明材料")
        print(f"  [DEBUG] output: {out[:500]}")
        return False
    
    # 3g: internal 审核通过
    out, err, code = run_cmd(
        f"python3 main.py internal review-claim -r {request_id} --approve -m '证明材料核对无误'",
        desc="3g. internal review-claim 审核通过"
    )
    if "通过" in out or "完成" in out:
        print("  ✅ 审核通过成功")
    else:
        print("  ❌ 审核失败")
        return False
    
    # 3h: internal 领取核销
    out, err, code = run_cmd(
        f"python3 main.py internal confirm-pickup -r {request_id} --id-last4 9999",
        desc="3h. internal confirm-pickup 贵重物品领取核销（验证证件后四位）"
    )
    if "成功" in out or "核销" in out:
        print("  ✅ 贵重物品领取核销成功（证件后四位验证通过）")
    else:
        print("  ❌ 领取核销失败")
        return False
    
    # 3i: internal 查看领取记录（复盘）
    out, err, code = run_cmd(
        "python3 main.py internal list-pickups",
        desc="3i. internal list-pickups 查看领取记录（复盘）"
    )
    if "验证用白色耳机" in out and "9999" in out:
        print("  ✅ 领取记录可复盘查询，包含证件后四位")
    else:
        print("  ❌ 领取记录查询失败")
        return False
    
    cleanup()
    print("\n✅ 测试3 全部通过！")
    return True


def main():
    print("\n" + "%"*60)
    print("%  校园失物招领平台 - 真实 Typer 命令验证")
    print("%"*60)
    
    all_passed = True
    
    # 测试1
    try:
        if not step1_internal_session():
            all_passed = False
    except Exception as e:
        print(f"\n❌ 测试1异常: {e}")
        import traceback
        traceback.print_exc()
        all_passed = False
    
    # 测试2
    try:
        if not step2_admin_session():
            all_passed = False
    except Exception as e:
        print(f"\n❌ 测试2异常: {e}")
        import traceback
        traceback.print_exc()
        all_passed = False
    
    # 测试3
    try:
        if not step3_proof_workflow():
            all_passed = False
    except Exception as e:
        print(f"\n❌ 测试3异常: {e}")
        import traceback
        traceback.print_exc()
        all_passed = False
    
    cleanup()
    
    print("\n" + "%"*60)
    if all_passed:
        print("%  🎉 所有真实命令验证全部通过！")
        print("%")
        print("%  已验证：")
        print("%  1. internal login → dashboard 跨命令会话保持")
        print("%  2. admin login → stats 跨命令会话保持")
        print("%  3. external --proof-* 参数自动保存证明材料")
        print("%  4. internal view-claim 能看到证明材料")
        print("%  5. 完整的审核→核销→复盘工作流")
        print("%"*60)
        return 0
    else:
        print("%  ❌ 部分验证失败，请检查输出")
        print("%"*60)
        return 1


if __name__ == "__main__":
    os.chdir(BASE_DIR)
    sys.exit(main())
