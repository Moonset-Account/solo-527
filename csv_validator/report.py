"""报告生成模块。

支持多种输出格式：
- human: 人类可读的文本报告（默认）
- json: 机器可读的JSON报告（CI集成用）
- markdown: Markdown格式报告
- csv: 错误列表CSV输出

所有输出均为UTF-8编码，确保跨平台兼容性。
"""

from __future__ import annotations

import csv
import io
import json
import sys
from typing import TextIO

from csv_validator.errors import ValidationResult, ValidationSeverity


class ReportGenerator:
    """校验报告生成器。"""

    @staticmethod
    def generate(
        result: ValidationResult,
        output_format: str = "human",
        show_fix_preview: bool = True,
        show_samples: bool = True,
    ) -> str:
        """根据指定格式生成报告。

        Args:
            result: 校验结果
            output_format: human / json / markdown / csv
            show_fix_preview: 是否显示修复建议预览
            show_samples: 是否显示样例错误

        Raises:
            ValueError: 不支持的输出格式
        """
        fmt = output_format.lower()
        if fmt == "json":
            return ReportGenerator._to_json(result)
        elif fmt == "human":
            return ReportGenerator._to_human(result, show_fix_preview, show_samples)
        elif fmt == "markdown":
            return ReportGenerator._to_markdown(result, show_fix_preview, show_samples)
        elif fmt == "csv":
            return ReportGenerator._to_csv(result)
        else:
            raise ValueError(f"不支持的输出格式: {output_format}")

    @staticmethod
    def _to_json(result: ValidationResult) -> str:
        """JSON格式报告（机器可读，CI友好）。"""
        data = result.to_dict()
        return json.dumps(data, ensure_ascii=False, indent=2)

    @staticmethod
    def _to_human(
        result: ValidationResult,
        show_fix_preview: bool,
        show_samples: bool,
    ) -> str:
        """人类可读的文本报告。"""
        lines: list = []
        status = "✓ 通过" if result.valid else "✗ 失败"
        lines.append(f"CSV校验结果: {status}")
        lines.append("=" * 60)
        lines.append(f"总行数: {result.total_rows}")
        lines.append(f"列数:   {result.total_columns}")
        lines.append(f"错误数: {result.error_count}")
        lines.append(f"警告数: {result.warning_count}")
        lines.append("")

        if result.stats:
            lines.append("错误分布统计:")
            lines.append("-" * 60)
            for code, count in sorted(result.stats.items()):
                lines.append(f"  {code:<32} {count:>4} 次")
            lines.append("")

        if result.issues:
            lines.append("问题明细:")
            lines.append("-" * 60)
            for idx, issue in enumerate(result.issues[:100], 1):
                marker = "!" if issue.severity == ValidationSeverity.ERROR else "?"
                loc = issue.format_location()
                lines.append(f"{marker} [{issue.code.value}] {loc}")
                lines.append(f"    值: {issue.value!r}")
                lines.append(f"    说明: {issue.message}")
                if issue.suggestion:
                    lines.append(f"    建议: {issue.suggestion}")
                lines.append("")
            if len(result.issues) > 100:
                lines.append(f"... 仅显示前 100 条问题，共 {len(result.issues)} 条")
                lines.append("")

        if show_samples and result.sample_errors:
            lines.append("典型错误样例:")
            lines.append("-" * 60)
            for s in result.sample_errors:
                lines.append(f"  * [{s['code']}] {s['message']}")
            lines.append("")

        if show_fix_preview and result.fix_preview:
            lines.append("修复建议预览:")
            lines.append("-" * 60)
            for fix in result.fix_preview:
                lines.append(f"  [{fix['code']}] (影响 {fix['count']} 处)")
                lines.append(f"    建议: {fix['suggestion']}")
                lines.append(f"    例子: {fix['example']['location']} 值={fix['example']['value']!r}")
                lines.append("")

        return "\n".join(lines)

    @staticmethod
    def _to_markdown(
        result: ValidationResult,
        show_fix_preview: bool,
        show_samples: bool,
    ) -> str:
        """Markdown格式报告。"""
        lines: list = []
        status = "✅ 通过" if result.valid else "❌ 失败"
        lines.append(f"# CSV校验报告 - {status}")
        lines.append("")
        lines.append("## 基本信息")
        lines.append("")
        lines.append(f"- **总行数**: {result.total_rows}")
        lines.append(f"- **列数**: {result.total_columns}")
        lines.append(f"- **错误数**: {result.error_count}")
        lines.append(f"- **警告数**: {result.warning_count}")
        lines.append("")

        if result.stats:
            lines.append("## 错误分布")
            lines.append("")
            lines.append("| 错误码 | 次数 |")
            lines.append("|--------|------|")
            for code, count in sorted(result.stats.items()):
                lines.append(f"| `{code}` | {count} |")
            lines.append("")

        if result.issues:
            lines.append("## 问题明细")
            lines.append("")
            lines.append("| # | 级别 | 错误码 | 位置 | 值 | 说明 |")
            lines.append("|---|------|--------|------|----|------|")
            for idx, issue in enumerate(result.issues[:100], 1):
                sev = "❌" if issue.severity == ValidationSeverity.ERROR else "⚠️"
                loc = issue.format_location()
                val = str(issue.value).replace("|", "\\|")
                msg = issue.message.replace("|", "\\|")
                lines.append(f"| {idx} | {sev} | `{issue.code.value}` | {loc} | `{val}` | {msg} |")
            lines.append("")

        if show_fix_preview and result.fix_preview:
            lines.append("## 修复建议")
            lines.append("")
            for fix in result.fix_preview:
                lines.append(f"### `{fix['code']}` (影响 {fix['count']} 处)")
                lines.append("")
                lines.append(f"- **建议**: {fix['suggestion']}")
                lines.append(f"- **示例**: {fix['example']['location']} 值=`{fix['example']['value']}`")
                lines.append("")

        return "\n".join(lines)

    @staticmethod
    def _to_csv(result: ValidationResult) -> str:
        """CSV格式错误列表输出。"""
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow([
            "severity", "code", "row", "column", "value", "message", "suggestion",
        ])
        for issue in result.issues:
            writer.writerow([
                issue.severity.value,
                issue.code.value,
                issue.row if issue.row is not None else "",
                issue.column if issue.column is not None else "",
                issue.value if issue.value is not None else "",
                issue.message,
                issue.suggestion,
            ])
        return buf.getvalue()

    @staticmethod
    def write(
        result: ValidationResult,
        output: TextIO,
        output_format: str = "human",
        show_fix_preview: bool = True,
        show_samples: bool = True,
    ) -> None:
        """生成报告并写入输出流。"""
        content = ReportGenerator.generate(
            result, output_format, show_fix_preview, show_samples,
        )
        output.write(content)
        if not content.endswith("\n"):
            output.write("\n")
