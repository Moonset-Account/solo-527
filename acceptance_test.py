#!/usr/bin/env python3
"""验收脚本：验证所有argparse错误场景输出JSON。"""
import subprocess
import json
import sys

PASS = "\033[32m✓\033[0m"
FAIL = "\033[31m✗\033[0m"
all_passed = True

def check(name, cmd, expect_exit=4, expect_json=True, stdout_empty=True):
    global all_passed
    r = subprocess.run(cmd, capture_output=True, text=True)
    exit_ok = r.returncode == expect_exit
    json_ok = True
    stdout_ok = (r.stdout == "") if stdout_empty else True
    if expect_json:
        try:
            d = json.loads(r.stderr)
            keys = set(d.keys())
            expected = {"status", "error_type", "message", "exit_code"}
            keys_ok = keys == expected
            status_ok = d.get("status") == "error"
            exit_code_ok = d.get("exit_code") == expect_exit
            if not (keys_ok and status_ok and exit_code_ok):
                json_ok = False
        except Exception as e:
            json_ok = False
    else:
        # 非JSON场景：--help/--version正常输出到stdout，stderr为空；
        # 显式-f human时stderr为文本错误
        if "help" in name or "version" in name or "dry-run" in name or "标准输入" in name or "报告文件" in name:
            json_ok = (r.stderr == "")
        else:
            json_ok = "{" not in r.stderr and "错误:" in r.stderr

    status = PASS if (exit_ok and json_ok and stdout_ok) else FAIL
    if status == FAIL:
        all_passed = False
    print(f"{status} {name}")
    print(f"   退出码: {r.returncode} (期望{expect_exit}) {'✓' if exit_ok else '✗'}")
    if expect_json:
        try:
            d = json.loads(r.stderr)
            print(f"   字段: {sorted(d.keys())} (期望4个) {'✓' if set(d.keys())=={'status','error_type','message','exit_code'} else '✗'}")
            print(f"   status={d.get('status')}, exit_code={d.get('exit_code')}")
        except:
            print(f"   stderr: {r.stderr[:80]}")
    print()

print("=" * 60)
print("验收：所有argparse解析失败场景输出稳定JSON")
print("=" * 60)
print()

check("场景1: 缺少--schema（未指定格式）",
      ["csv-validator", "data.csv"])

check("场景2: 未知参数 --unknown-flag",
      ["csv-validator", "--schema", "examples/schema_orders.json", "--unknown", "data.csv"])

check("场景3: 选项缺值 --schema",
      ["csv-validator", "--schema"])

check("场景4: 非法--format -f xml",
      ["csv-validator", "--schema", "examples/schema_orders.json", "-f", "xml", "data.csv"])

check("场景5: 显式-f json → JSON错误",
      ["csv-validator", "-f", "json", "data.csv"])

check("场景6: 显式-f human → 文本错误（仅该场景降级）",
      ["csv-validator", "-f", "human", "data.csv"],
      expect_json=False)

check("场景7: --report → JSON错误",
      ["csv-validator", "--report", "out.json", "data.csv"])

check("场景8: --help → 正常帮助",
      ["csv-validator", "--help"],
      expect_exit=0,
      expect_json=False,
      stdout_empty=False)

check("场景9: --version → 正常版本",
      ["csv-validator", "--version"],
      expect_exit=0,
      expect_json=False,
      stdout_empty=False)

check("场景10: dry-run 正常工作",
      ["csv-validator", "--schema", "examples/schema_orders.json", "--dry-run", "-f", "json"],
      expect_exit=0,
      expect_json=False,
      stdout_empty=False)

check("场景11: 标准输入正常工作",
      ["sh", "-c", "head -3 examples/orders_valid.csv | csv-validator --schema examples/schema_orders.json -f json -"],
      expect_exit=0,
      expect_json=False,
      stdout_empty=False)

check("场景12: --report 正常输出报告文件",
      ["csv-validator", "--schema", "examples/schema_orders.json", "--report", "/tmp/accept_report.json", "examples/orders_valid.csv"],
      expect_exit=0,
      expect_json=False,
      stdout_empty=True)

# 验证报告文件
import os
if os.path.exists("/tmp/accept_report.json"):
    with open("/tmp/accept_report.json") as f:
        d = json.load(f)
    status = PASS if d.get("valid") else FAIL
    print(f"{status} 场景12报告文件验证: valid={d.get('valid')}, rows={d.get('total_rows')}")
    os.unlink("/tmp/accept_report.json")

print("=" * 60)
if all_passed:
    print(f"{PASS} 全部验收通过")
    sys.exit(0)
else:
    print(f"{FAIL} 存在验收失败")
    sys.exit(1)
