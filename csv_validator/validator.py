"""CSV校验引擎。

核心校验逻辑，支持：
- 表头校验（必填列、未知列）
- 字段类型转换与校验
- 枚举值校验
- 正则格式校验
- 数值范围校验
- 单字段唯一键校验
- 多字段组合唯一键校验
"""

from __future__ import annotations

import csv
import io
import re
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Set, TextIO, Tuple

from csv_validator.errors import (
    ValidationErrorCode,
    ValidationIssue,
    ValidationResult,
    ValidationSeverity,
)
from csv_validator.schema import FieldSchema, Schema


class CSVValidator:
    """CSV数据校验器。

    基于Schema定义对CSV数据执行完整校验，返回结构化的校验结果。

    Args:
        schema: Schema定义
        strict: 是否严格模式（覆盖schema中的strict设置）
        max_errors: 最大错误记录数（超过后停止收集，用于性能）
    """

    def __init__(
        self,
        schema: Schema,
        strict: Optional[bool] = None,
        max_errors: int = 1000,
    ):
        self.schema = schema
        self.strict = strict if strict is not None else schema.strict
        self.max_errors = max_errors

    def validate_file(self, path: str, encoding: str = "utf-8") -> ValidationResult:
        """校验CSV文件。

        Args:
            path: CSV文件路径
            encoding: 文件编码

        Raises:
            ValidationError: 文件不存在或无法读取时抛出
        """
        from csv_validator.errors import ValidationError, ExitCode
        try:
            with open(path, "r", encoding=encoding, newline="") as fp:
                return self.validate_stream(fp)
        except FileNotFoundError:
            raise ValidationError(
                f"输入文件不存在: {path}",
                exit_code=ExitCode.IO_ERROR,
            )
        except OSError as e:
            raise ValidationError(
                f"无法读取输入文件 {path}: {e}",
                exit_code=ExitCode.IO_ERROR,
            )

    def validate_string(self, data: str) -> ValidationResult:
        """校验CSV字符串内容。"""
        return self.validate_stream(io.StringIO(data))

    def validate_stream(self, stream: TextIO) -> ValidationResult:
        """校验CSV数据流。

        流式读取，避免一次性加载大文件导致内存溢出。
        """
        result = ValidationResult(valid=True)

        reader = csv.reader(stream)
        try:
            header = next(reader)
        except StopIteration:
            result.add_issue(ValidationIssue(
                code=ValidationErrorCode.EMPTY_FILE,
                row=None,
                column=None,
                value=None,
                message="CSV文件为空，不包含任何数据",
                suggestion="请确认数据源是否正确，至少应包含表头行",
            ))
            result.finalize()
            return result

        header_issues = self._validate_header(header)
        for issue in header_issues:
            result.add_issue(issue)
        result.total_columns = len(header)

        if result.error_count >= self.max_errors:
            result.finalize()
            return result

        header_index = {name: idx for idx, name in enumerate(header)}
        defined_fields = {f.name for f in self.schema.fields}
        relevant_columns = [
            (name, idx) for name, idx in header_index.items()
            if name in defined_fields
        ]

        seen_unique: Dict[str, Set[Any]] = {
            f: set() for f in self.schema.unique_fields
        }
        seen_composite_unique: Dict[Tuple[str, ...], Set[Tuple[Any, ...]]] = {}
        for uk in self.schema.unique_keys:
            key = tuple(uk)
            seen_composite_unique[key] = set()

        row_num = 1
        for row in reader:
            row_num += 1
            if result.error_count >= self.max_errors:
                break

            if len(row) < len(header):
                row = row + [""] * (len(header) - len(row))

            row_values: Dict[str, str] = {}
            for name, idx in relevant_columns:
                if idx < len(row):
                    row_values[name] = row[idx].strip()
                else:
                    row_values[name] = ""

            row_issues = self._validate_row(
                row_num=row_num,
                row_values=row_values,
                seen_unique=seen_unique,
                seen_composite_unique=seen_composite_unique,
            )
            for issue in row_issues:
                result.add_issue(issue)

        result.total_rows = row_num - 1 if row_num > 1 else 0
        result.finalize()
        return result

    def _validate_header(self, header: List[str]) -> List[ValidationIssue]:
        """校验表头。"""
        issues: List[ValidationIssue] = []
        schema_fields = self.schema.field_names
        required_fields = self.schema.required_fields

        header_set = set(header)
        for field_name in required_fields:
            if field_name not in header_set:
                issues.append(ValidationIssue(
                    code=ValidationErrorCode.MISSING_REQUIRED_COLUMN,
                    row=1,
                    column=field_name,
                    value=None,
                    message=f"缺少必填列: {field_name}",
                    suggestion=f"请在CSV表头中添加列 '{field_name}'",
                ))

        if self.strict:
            for col_name in header:
                if col_name not in schema_fields:
                    issues.append(ValidationIssue(
                        code=ValidationErrorCode.UNKNOWN_COLUMN,
                        row=1,
                        column=col_name,
                        value=col_name,
                        message=f"发现未在Schema中定义的列: {col_name}",
                        suggestion=(
                            f"严格模式下不允许未知列。请移除该列，"
                            f"或在Schema中添加字段 '{col_name}' 的定义"
                        ),
                        severity=ValidationSeverity.WARNING,
                    ))

        return issues

    def _validate_row(
        self,
        row_num: int,
        row_values: Dict[str, str],
        seen_unique: Dict[str, Set[Any]],
        seen_composite_unique: Dict[Tuple[str, ...], Set[Tuple[Any, ...]]],
    ) -> List[ValidationIssue]:
        """校验单行数据。"""
        issues: List[ValidationIssue] = []

        for field_schema in self.schema.fields:
            name = field_schema.name
            raw_value = row_values.get(name, "")

            if raw_value == "" or raw_value is None:
                if field_schema.required:
                    issues.append(ValidationIssue(
                        code=ValidationErrorCode.MISSING_VALUE,
                        row=row_num,
                        column=name,
                        value="",
                        message=f"必填字段 '{name}' 为空",
                        suggestion=f"请填写该字段的值",
                    ))
                continue

            type_ok, typed_value, type_msg = self._check_type(field_schema, raw_value)
            if not type_ok:
                issues.append(ValidationIssue(
                    code=ValidationErrorCode.TYPE_MISMATCH,
                    row=row_num,
                    column=name,
                    value=raw_value,
                    message=type_msg,
                    suggestion=f"请将该值转换为合法的 {field_schema.type} 类型",
                ))
                continue

            if field_schema.enum is not None and typed_value not in field_schema.enum:
                issues.append(ValidationIssue(
                    code=ValidationErrorCode.INVALID_ENUM,
                    row=row_num,
                    column=name,
                    value=raw_value,
                    message=(
                        f"值 '{raw_value}' 不在允许的枚举列表中。"
                        f"允许的值: {field_schema.enum}"
                    ),
                    suggestion=(
                        f"请从以下值中选择一个: {', '.join(map(str, field_schema.enum))}"
                    ),
                ))
                continue

            if field_schema.pattern:
                if not re.match(field_schema.pattern, raw_value):
                    issues.append(ValidationIssue(
                        code=ValidationErrorCode.INVALID_FORMAT,
                        row=row_num,
                        column=name,
                        value=raw_value,
                        message=(
                            f"值 '{raw_value}' 不匹配要求的格式: "
                            f"{field_schema.pattern}"
                        ),
                        suggestion=(
                            f"请按照正则模式 {field_schema.pattern} 填写该字段"
                        ),
                    ))
                    continue

            if field_schema.min_value is not None and isinstance(typed_value, (int, float)):
                if typed_value < field_schema.min_value:
                    issues.append(ValidationIssue(
                        code=ValidationErrorCode.VALUE_OUT_OF_RANGE,
                        row=row_num,
                        column=name,
                        value=raw_value,
                        message=(
                            f"值 {raw_value} 小于最小值 {field_schema.min_value}"
                        ),
                        suggestion=(
                            f"请输入大于或等于 {field_schema.min_value} 的值"
                        ),
                    ))
                    continue

            if field_schema.max_value is not None and isinstance(typed_value, (int, float)):
                if typed_value > field_schema.max_value:
                    issues.append(ValidationIssue(
                        code=ValidationErrorCode.VALUE_OUT_OF_RANGE,
                        row=row_num,
                        column=name,
                        value=raw_value,
                        message=(
                            f"值 {raw_value} 大于最大值 {field_schema.max_value}"
                        ),
                        suggestion=(
                            f"请输入小于或等于 {field_schema.max_value} 的值"
                        ),
                    ))
                    continue

            if field_schema.unique:
                if typed_value in seen_unique[name]:
                    issues.append(ValidationIssue(
                        code=ValidationErrorCode.DUPLICATE_KEY,
                        row=row_num,
                        column=name,
                        value=raw_value,
                        message=(
                            f"唯一键字段 '{name}' 出现重复值: '{raw_value}'"
                        ),
                        suggestion=(
                            f"请确保该字段的值唯一。值 '{raw_value}' 已在其他行出现"
                        ),
                    ))
                else:
                    seen_unique[name].add(typed_value)

        for uk_tuple, seen_set in seen_composite_unique.items():
            key_values = tuple(row_values.get(col, "") for col in uk_tuple)
            if all(v != "" for v in key_values):
                if key_values in seen_set:
                    issues.append(ValidationIssue(
                        code=ValidationErrorCode.DUPLICATE_KEY,
                        row=row_num,
                        column="+".join(uk_tuple),
                        value=str(key_values),
                        message=(
                            f"组合唯一键 {list(uk_tuple)} 出现重复值: {key_values}"
                        ),
                        suggestion=(
                            f"请确保组合键 {list(uk_tuple)} 的值唯一，"
                            f"该组合已在其他行出现"
                        ),
                    ))
                else:
                    seen_set.add(key_values)

        return issues

    @staticmethod
    def _check_type(
        field_schema: FieldSchema, raw_value: str
    ) -> Tuple[bool, Any, str]:
        """类型检查与转换。

        Returns:
            (是否成功, 转换后的值, 失败时的错误信息)
        """
        ftype = field_schema.type
        try:
            if ftype == "string":
                return True, raw_value, ""
            elif ftype == "integer":
                return True, int(raw_value), ""
            elif ftype == "float":
                return True, float(raw_value), ""
            elif ftype == "boolean":
                lower = raw_value.lower()
                if lower in ("true", "1", "yes", "是"):
                    return True, True, ""
                elif lower in ("false", "0", "no", "否"):
                    return True, False, ""
                else:
                    return False, None, (
                        f"值 '{raw_value}' 不是合法的布尔值。"
                        f"允许: true/false, 1/0, yes/no, 是/否"
                    )
            elif ftype == "date":
                fmt = field_schema.format or "%Y-%m-%d"
                return True, datetime.strptime(raw_value, fmt).date(), ""
            elif ftype == "datetime":
                fmt = field_schema.format or "%Y-%m-%d %H:%M:%S"
                return True, datetime.strptime(raw_value, fmt), ""
            else:
                return False, None, f"未知类型: {ftype}"
        except ValueError:
            return False, None, (
                f"值 '{raw_value}' 无法转换为 {ftype} 类型"
            )
