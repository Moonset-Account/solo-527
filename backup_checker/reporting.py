"""报告格式化与告警通知。"""
from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import TextIO

from .models import CheckResult, NotifyTarget, OutputFormat, IssueSeverity


# ---------------------------------------------------------------------------
# 文本报告（人类可读）
# ---------------------------------------------------------------------------

def render_text_report(result: CheckResult) -> str:
    """生成文本格式报告：摘要 + 明细 + 错误清单。"""
    lines: list[str] = []
    s = result.summary
    lines.append("=" * 72)
    lines.append("备份完整性检查报告")
    lines.append("=" * 72)
    lines.append("")

    # -- 元信息 --
    lines.append("【摘要】")
    status = "通过 ✓" if s.passed else "未通过 ✗"
    lines.append(f"  检查状态     : {status}")
    lines.append(f"  开始时间     : {_fmt_dt(result.started_at)}")
    if result.finished_at:
        lines.append(f"  完成时间     : {_fmt_dt(result.finished_at)}")
        lines.append(f"  耗时         : {result.duration_seconds:.3f} 秒")
    lines.append(f"  备份目录     : {result.config.backup_dir}")
    lines.append(f"  清单文件     : {result.config.manifest_path or '-'}")
    lines.append(f"  哈希算法     : {result.config.hash_algorithm}"
                 f"{' (dry-run，跳过哈希计算)' if result.config.dry_run else ''}")
    if result.config.retention_days:
        lines.append(f"  保留周期     : {result.config.retention_days} 天")
    elif result.manifest and result.manifest.retention_days:
        lines.append(f"  保留周期     : {result.manifest.retention_days} 天（清单）")
    lines.append("")

    # -- 统计 --
    lines.append("【统计】")
    lines.append(f"  清单文件总数 : {s.total_files}")
    lines.append(f"  已检查文件   : {s.checked_files}")
    if s.missing_files:
        lines.append(f"  缺失文件     : {s.missing_files} ⚠")
    else:
        lines.append(f"  缺失文件     : {s.missing_files}")
    if s.hash_mismatches:
        lines.append(f"  哈希不匹配   : {s.hash_mismatches} ⚠")
    else:
        lines.append(f"  哈希不匹配   : {s.hash_mismatches}")
    if s.size_mismatches:
        lines.append(f"  大小不一致   : {s.size_mismatches} ⚠")
    else:
        lines.append(f"  大小不一致   : {s.size_mismatches}")
    lines.append(f"  是否过期     : {'是 ⚠' if s.expired else '否'}")
    lines.append(f"  警告数       : {s.warnings_count}")
    lines.append(f"  错误数       : {s.errors_count}")
    lines.append(f"  总问题数     : {s.issues_count}")
    lines.append("")

    # -- 文件明细（verbose 或有问题时展示） --
    show_details = (
        result.config.verbose >= 1
        or s.missing_files > 0
        or s.hash_mismatches > 0
        or s.size_mismatches > 0
    )
    if show_details and result.file_details:
        lines.append("【文件明细】")
        for d in result.file_details:
            rel = d.get("manifest_path", "?")
            exists = d.get("exists", False)
            checked = d.get("checked", False)
            flag = "✓" if exists else "✗"
            if d.get("hash_skipped"):
                flag += "(dry)"
            elif checked and not d.get("actual_hash") and not d.get("size_mismatch"):
                flag += "(size-only)"
            lines.append(f"  [{flag}] {rel}")
            if result.config.verbose >= 1 and exists:
                lines.append(f"        本地路径 : {d.get('local_path')}")
                if "actual_size" in d:
                    from .utils import format_size
                    lines.append(
                        f"        大小     : 期望 {format_size(d.get('expected_size'))}"
                        f" / 实际 {format_size(d.get('actual_size'))}"
                    )
                if d.get("expected_hash"):
                    lines.append(f"        期望哈希 : {d['expected_hash']}")
                    lines.append(f"        实际哈希 : {d.get('actual_hash', '-')}")
        lines.append("")

    # -- 问题清单 --
    if result.issues:
        lines.append("【问题清单】")
        # 按严重程度排序
        order = {"critical": 0, "error": 1, "warning": 2, "info": 3}
        sorted_issues = sorted(result.issues, key=lambda i: order.get(i.severity.value, 9))
        for idx, issue in enumerate(sorted_issues, 1):
            sev = issue.severity.value.upper()
            lines.append(f"  {idx}. [{sev}] {issue.message}")
            if issue.file_path:
                lines.append(f"     文件    : {issue.file_path}")
            if issue.expected is not None or issue.actual is not None:
                lines.append(f"     期望    : {issue.expected or '-'}")
                lines.append(f"     实际    : {issue.actual or '-'}")
            if issue.location:
                lines.append(f"     定位    : {issue.location}")
        lines.append("")

    lines.append("=" * 72)
    ec = result.exit_code()
    if ec == 0:
        lines.append("结果：所有检查通过（退出码 0）")
    else:
        lines.append(f"结果：存在问题，退出码 {ec}")
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# JSON 报告
# ---------------------------------------------------------------------------

def render_json_report(result: CheckResult, *, indent: int = 2) -> str:
    return json.dumps(result.to_dict(), ensure_ascii=False, indent=indent)


# ---------------------------------------------------------------------------
# 告警通知
# ---------------------------------------------------------------------------

class Notifier:
    """将告警信息分发到 stdout / stderr / 文件 / logging。"""

    def __init__(self, target: NotifyTarget, path: Path | None = None) -> None:
        self.target = target
        self.path = path
        self._file: TextIO | None = None
        self._open_file_if_needed()

    def _open_file_if_needed(self) -> None:
        if self.target == NotifyTarget.FILE and self.path is not None:
            try:
                self.path.parent.mkdir(parents=True, exist_ok=True)
                self._file = open(self.path, "a", encoding="utf-8")
            except OSError:
                self._file = None

    def notify(self, result: CheckResult) -> None:
        if result.summary.issues_count == 0:
            return
        text = render_text_report(result)
        header = (
            f"\n===== [backup-checker 告警] "
            f"{datetime.now(timezone.utc).astimezone().strftime('%Y-%m-%d %H:%M:%S')} "
            f"=====\n"
        )
        content = header + text

        if self.target == NotifyTarget.STDOUT:
            stream = sys.stdout if result.summary.errors_count == 0 else sys.stderr
            stream.write(content)
        elif self.target == NotifyTarget.STDERR:
            sys.stderr.write(content)
        elif self.target == NotifyTarget.LOG:
            level = (logging.ERROR if result.summary.errors_count
                     else logging.WARNING if result.summary.warnings_count
                     else logging.INFO)
            logging.getLogger("backup_checker").log(level, "\n%s", content)
        elif self.target == NotifyTarget.FILE:
            if self._file is not None:
                try:
                    self._file.write(content)
                    self._file.flush()
                except OSError:
                    sys.stderr.write(content)
            else:
                sys.stderr.write(content)

    def close(self) -> None:
        if self._file is not None:
            try:
                self._file.close()
            finally:
                self._file = None

    def __enter__(self) -> "Notifier":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()


def render_report(result: CheckResult, fmt: OutputFormat) -> str:
    """根据输出格式生成报告字符串。"""
    if fmt == OutputFormat.JSON:
        return render_json_report(result)
    return render_text_report(result)


def _fmt_dt(dt) -> str:
    from .utils import format_datetime
    return format_datetime(dt)
