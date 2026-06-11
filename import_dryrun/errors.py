"""
错误分组和修复建议模块。

负责:
    - 按错误类型+字段进行分组统计
    - 生成可操作的修复建议
    - 提供批量修复的步骤
"""

from __future__ import annotations

from collections import defaultdict
from typing import Dict, List, Optional, Tuple

from .models import (
    ErrorCategory,
    ErrorGroup,
    ImportError,
    ImportRecord,
    ImportResult,
    TargetSchema,
)


CATEGORY_SUGGESTIONS: Dict[ErrorCategory, str] = {
    ErrorCategory.MISSING_REQUIRED: (
        "1. 检查源数据文件中该列是否有空值\n"
        "2. 如该字段确实非必填，可在 mapping 中设置 required: false\n"
        "3. 或配置 default 字段提供默认值填充空值"
    ),
    ErrorCategory.TYPE_MISMATCH: (
        "1. 检查源数据格式是否符合目标类型\n"
        "2. 日期/时间类: 确保格式为 YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS\n"
        "3. 数值类: 确保不包含非数字字符（可使用 int()/float() 转换）\n"
        "4. 在 mapping 中配置 transform 表达式预处理数据"
    ),
    ErrorCategory.INVALID_FORMAT: (
        "1. 检查值是否在 allowed_values 枚举列表中\n"
        "2. 检查正则表达式匹配规则是否正确\n"
        "3. 确认 source 数据中使用的是标准值而非别名或中文描述"
    ),
    ErrorCategory.VALUE_OUT_OF_RANGE: (
        "1. 检查数值是否在 min_value/max_value 范围内\n"
        "2. 确认业务规则中的边界值是否正确\n"
        "3. 如范围配置过严，可调整 mapping 中的 min/max 阈值"
    ),
    ErrorCategory.DUPLICATE_KEY: (
        "1. 搜索源文件中重复的主键/唯一键值\n"
        "2. 删除重复行或修正冲突行的键值\n"
        "3. 如主键由多列组成，检查所有列的组合是否唯一"
    ),
    ErrorCategory.FOREIGN_KEY_NOT_FOUND: (
        "1. 检查关联表中是否存在该外键值\n"
        "2. 确认关联表数据已先导入或同时导入\n"
        "3. 如外键允许为空，可在 mapping 中设置 required: false"
    ),
    ErrorCategory.UNMAPPED_FIELD: (
        "1. 在 mapping 文件中添加该源字段的映射规则\n"
        "2. 如该字段无需导入，可忽略（关闭 strict_mode 即不报错）\n"
        "3. 检查是否为拼写错误导致的字段名不匹配"
    ),
    ErrorCategory.TRANSFORM_FAILED: (
        "1. 检查 transform 表达式的语法是否正确\n"
        "2. 确认表达式中的函数/属性适用于当前值类型\n"
        "3. 对可能为空的值先做判空处理后再转换"
    ),
    ErrorCategory.EMPTY_RECORD: (
        "1. 删除源数据中的空行\n"
        "2. 确认 CSV 文件中是否存在多余的换行符\n"
        "3. 如空行为正常情况，保持 skip_empty_rows=True 即可自动跳过"
    ),
    ErrorCategory.UNKNOWN_ERROR: (
        "1. 查看具体错误信息获取更多上下文\n"
        "2. 使用 --verbose 模式获取详细调试输出\n"
        "3. 如问题持续，联系开发人员排查"
    ),
}


class ErrorGrouper:
    """错误分组器。"""

    def __init__(self, sample_count: int = 5) -> None:
        self._sample_count = sample_count

    def group_result(self, result: ImportResult) -> List[ErrorGroup]:
        all_errors: List[ImportError] = []
        for record in result.records:
            all_errors.extend(record.errors)
        return self.group_errors(all_errors)

    def group_errors(self, errors: List[ImportError]) -> List[ErrorGroup]:
        buckets: Dict[Tuple[ErrorCategory, Optional[str]], List[ImportError]] = (
            defaultdict(list)
        )
        for err in errors:
            key = (err.category, err.target_field)
            buckets[key].append(err)

        groups: List[ErrorGroup] = []
        for (category, target_field), errs in buckets.items():
            sample_errors = errs[: self._sample_count]
            suggestion = self._build_suggestion(category, target_field, errs)
            groups.append(
                ErrorGroup(
                    category=category,
                    target_field=target_field,
                    count=len(errs),
                    sample_errors=sample_errors,
                    suggestion=suggestion,
                )
            )

        groups.sort(key=lambda g: (-g.count, g.category.value, g.target_field or ""))
        return groups

    def _build_suggestion(
        self,
        category: ErrorCategory,
        target_field: Optional[str],
        errors: List[ImportError],
    ) -> str:
        suggestion = CATEGORY_SUGGESTIONS.get(category, "")
        per_error_suggestions = {
            e.suggestion for e in errors if e.suggestion
        }
        if per_error_suggestions:
            lines = ["具体修复建议:"]
            for s in sorted(per_error_suggestions):
                lines.append(f"  - {s}")
            suggestion = "\n".join(lines) + "\n" + ("-" * 40) + "\n" + suggestion
        return suggestion


class RepairAdvisor:
    """修复建议生成器。"""

    def __init__(self, schema: Optional[TargetSchema] = None) -> None:
        self._schema = schema

    def generate_summary(self, groups: List[ErrorGroup]) -> str:
        """生成修复建议摘要。"""
        if not groups:
            return "🎉 数据质量良好，未发现任何错误，可直接进行正式导入。"

        lines: List[str] = []
        total_errors = sum(g.count for g in groups)
        high_priority = [g for g in groups if g.category in (
            ErrorCategory.MISSING_REQUIRED,
            ErrorCategory.DUPLICATE_KEY,
            ErrorCategory.FOREIGN_KEY_NOT_FOUND,
            ErrorCategory.TYPE_MISMATCH,
        )]

        lines.append(f"共发现 {total_errors} 个错误，分为 {len(groups)} 类")
        if high_priority:
            lines.append(
                f"⚠️  需优先处理 {len(high_priority)} 类高严重度错误，"
                f"涉及 {sum(g.count for g in high_priority)} 条记录"
            )

        lines.append("")
        lines.append("=== 修复优先级建议 ===")
        for i, g in enumerate(high_priority, 1):
            field_label = g.target_field or "全局"
            lines.append(
                f"  P{i}. [{g.category.label}] {field_label} ({g.count} 条)"
            )

        remaining = [g for g in groups if g not in high_priority]
        if remaining:
            lines.append("")
            lines.append("=== 其他错误（可酌情处理） ===")
            for g in remaining:
                field_label = g.target_field or "全局"
                lines.append(
                    f"  - [{g.category.label}] {field_label} ({g.count} 条)"
                )

        lines.append("")
        lines.append(self._build_overall_recommendation(
            total_errors, len(high_priority)
        ))

        return "\n".join(lines)

    @staticmethod
    def _build_overall_recommendation(
        total_errors: int, high_count: int
    ) -> str:
        if total_errors == 0:
            return "✅  状态: 通过。建议: 可直接执行正式导入。"
        if high_count == 0 and total_errors <= 5:
            return "⚠️  状态: 有少量非关键问题。建议: 确认后可导入，或修正后导入。"
        if high_count > 0 and total_errors <= 20:
            return "🔴 状态: 存在关键问题。建议: 修复高优先级错误后再导入。"
        return (
            "🔴 状态: 错误较多。建议: 先在源数据层面进行批量修正，"
            "或调整 mapping 配置，再重新执行 dry-run。"
        )

    def list_field_actions(
        self, groups: List[ErrorGroup]
    ) -> List[Dict[str, object]]:
        """按字段列出可执行的修复动作。"""
        actions: List[Dict[str, object]] = []
        for g in groups:
            if not g.target_field:
                continue
            action = {
                "field": g.target_field,
                "category": g.category.label,
                "count": g.count,
                "action": self._recommend_action(g),
            }
            actions.append(action)
        return actions

    @staticmethod
    def _recommend_action(group: ErrorGroup) -> str:
        cat = group.category
        field = group.target_field or "该字段"

        if cat == ErrorCategory.MISSING_REQUIRED:
            return f"批量填充 {field} 的空值，或设置默认值"
        if cat == ErrorCategory.TYPE_MISMATCH:
            return f"统一 {field} 的数据格式，或添加 transform 转换"
        if cat == ErrorCategory.DUPLICATE_KEY:
            return f"删除 {field} 重复值或调整唯一键策略"
        if cat == ErrorCategory.INVALID_FORMAT:
            return f"将 {field} 的值标准化为枚举允许范围"
        if cat == ErrorCategory.VALUE_OUT_OF_RANGE:
            return f"检查并修正 {field} 的越界值"
        if cat == ErrorCategory.FOREIGN_KEY_NOT_FOUND:
            return f"先导入关联表，或修正 {field} 的外键引用"
        if cat == ErrorCategory.TRANSFORM_FAILED:
            return f"修正 {field} 的 transform 表达式"
        if cat == ErrorCategory.UNMAPPED_FIELD:
            return f"为 {field} 添加映射规则或忽略该字段"
        if cat == ErrorCategory.EMPTY_RECORD:
            return "删除空行"
        return "检查具体错误信息后处理"
