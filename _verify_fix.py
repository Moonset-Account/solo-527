"""端到端验证三个问题修复的脚本。"""
import json
import hashlib
import subprocess
import sys
import tempfile
from pathlib import Path

PASS = 0
FAIL = 0


def check(cond: bool, msg: str):
    global PASS, FAIL
    if cond:
        print(f"  ✅ 通过：{msg}")
        PASS += 1
    else:
        print(f"  ❌ 失败：{msg}")
        FAIL += 1


def main() -> int:
    td = Path(tempfile.mkdtemp())
    backup = td / "bk"
    backup.mkdir()
    (backup / "a.txt").write_text("hello")

    # 清单：缺少 retention_days，且哈希只有 md5（不提供 sha256）
    m_warn = td / "m-warn.json"
    m_warn.write_text(json.dumps({
        "version": "1.0",
        "created_at": "2026-06-01T02:00:00Z",
        "files": [{
            "path": "a.txt",
            "size": 5,
            "hashes": {"md5": hashlib.md5(b"hello").hexdigest()},
        }],
    }))

    # 清单：有缺失文件（有 ERROR）
    m_bad = td / "m-bad.json"
    m_bad.write_text(json.dumps({
        "version": "1.0",
        "created_at": "2026-06-01T02:00:00Z",
        "retention_days": 30,
        "files": [
            {
                "path": "a.txt",
                "size": 5,
                "hashes": {"sha256": hashlib.sha256(b"hello").hexdigest()},
            },
            {
                "path": "missing.bin",
                "size": 999,
                "hashes": {"sha256": "deadbeef" * 8},
            },
        ],
    }))

    # ------------------------------------------------------------------
    # 问题1：严格模式下仅 WARNING 时退出码应为非零
    # ------------------------------------------------------------------
    print()
    print("=" * 60)
    print("【问题1】严格模式下只有 WARNING 时退出码非 0")
    print("=" * 60)
    r = subprocess.run(
        ["backup-checker", str(backup), "-m", str(m_warn),
         "--hash", "sha256", "--strict", "--quiet"],
        capture_output=True, text=True,
    )
    print(f"  执行：backup-checker ... --hash sha256 --strict --quiet")
    print(f"  退出码：{r.returncode}")
    check(r.returncode == 1, "缺少 retention + 缺少 sha256 (WARNING 级) => 退出码 1")

    r2 = subprocess.run(
        ["backup-checker", str(backup), "-m", str(m_warn),
         "--hash", "sha256", "--no-strict", "--quiet"],
        capture_output=True, text=True,
    )
    check(r2.returncode == 0, "同上 --no-strict => 退出码 0")

    # ------------------------------------------------------------------
    # 问题2：缺少 retention 或缺少指定哈希按保守策略失败（已包含在上面的验证中）
    # ------------------------------------------------------------------
    print()
    print("=" * 60)
    print("【问题2】缺少 retention 或缺少指定哈希 => 严格模式失败")
    print("=" * 60)
    r3 = subprocess.run(
        ["backup-checker", str(backup), "-m", str(m_warn),
         "--hash", "sha1", "--strict", "--quiet"],
        capture_output=True, text=True,
    )
    print(f"  --hash sha1 (清单也未提供 sha1) --strict => 退出码 {r3.returncode}")
    check(r3.returncode == 1, "缺少指定哈希 (sha1) + 严格模式 => 退出码 1")

    # ------------------------------------------------------------------
    # 问题3：--format json + stdout 告警，stdout 保持可直接解析
    # ------------------------------------------------------------------
    print()
    print("=" * 60)
    print("【问题3】--format json 时 stdout 纯净可解析")
    print("=" * 60)
    r4 = subprocess.run(
        ["backup-checker", str(backup), "-m", str(m_bad),
         "--format", "json", "--notify", "stdout"],
        capture_output=True, text=True,
    )
    print(f"  执行：--format json --notify stdout（有缺失，应触发告警）")
    print(f"  退出码：{r4.returncode}")
    has_json_err = False
    data = None
    try:
        data = json.loads(r4.stdout)
    except json.JSONDecodeError as e:
        has_json_err = True
        print(f"  JSON 解析错误：{e}")
        print(f"  stdout[:300] = {r4.stdout[:300]!r}")

    check(not has_json_err, "stdout 可直接 json.loads 解析，无污染")
    if data is not None:
        print(f"  解析结果：summary.passed={data['summary']['passed']}, "
              f"missing_files={data['summary']['missing_files']}, "
              f"顶层字段={list(data.keys())}")

    # 检查 stdout 中不应包含"备份完整性检查报告"
    check("备份完整性检查报告" not in r4.stdout,
          "stdout 不含文本报告（不污染 JSON）")

    # 检查 stderr 包含告警或重定向提示
    stderr_has_info = ("JSON 模式" in r4.stderr) or ("备份完整性检查报告" in r4.stderr)
    check(stderr_has_info, "stderr 包含告警文本或重定向提示")

    # ------------------------------------------------------------------
    # 总结
    # ------------------------------------------------------------------
    print()
    print("=" * 60)
    print(f"验证结果：{PASS} 通过，{FAIL} 失败")
    print("=" * 60)
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
