"""
字段映射和数据转换核心模块。

负责:
    - 从源数据提取字段值
    - 应用转换表达式
    - 类型转换和验证
    - 生成映射后的目标数据
"""

from __future__ import annotations

import csv
import json
import re
from datetime import date, datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple
from uuid import UUID

from .models import (
    ErrorCategory,
    FieldMapping,
    FieldType,
    ImportError,
    ImportRecord,
    TargetSchema,
)


def _is_empty(value: Any) -> bool:
    """判断值是否为空。"""
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    if isinstance(value, (list, tuple, dict, set)) and len(value) == 0:
        return True
    return False


class FieldMapper:
    """字段映射器。"""

    def __init__(self, schema: TargetSchema, strict: bool = False) -> None:
        self._schema = schema
        self._strict = strict
        self._transform_cache: Dict[str, Callable[[Any], Any]] = {}

    @property
    def schema(self) -> TargetSchema:
        return self._schema

    def map_record(
        self, row_number: int, source_data: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], List[ImportError]]:
        """将一条源记录映射为目标数据。

        Args:
            row_number: 行号
            source_data: 原始源数据

        Returns:
            (目标数据字典, 错误列表)
        """
        target_data: Dict[str, Any] = {}
        errors: List[ImportError] = []

        seen_source_fields = set()

        for field in self._schema.fields:
            if field.source in source_data:
                seen_source_fields.add(field.source)

            value, field_errors = self._map_field(
                field, source_data, row_number
            )
            target_data[field.target] = value
            errors.extend(field_errors)

        if self._strict:
            unmapped = set(source_data.keys()) - seen_source_fields
            for src in unmapped:
                if _is_empty(source_data.get(src)):
                    continue
                errors.append(
                    ImportError(
                        category=ErrorCategory.UNMAPPED_FIELD,
                        source_field=src,
                        target_field=None,
                        message=f"源字段 '{src}' 未配置映射规则，严格模式下视为错误",
                        actual_value=str(source_data[src]),
                        row_number=row_number,
                        suggestion="在 mapping 文件中添加该字段的映射规则，或关闭严格模式",
                    )
                )

        return target_data, errors

    def _map_field(
        self,
        field: FieldMapping,
        source_data: Dict[str, Any],
        row_number: int,
    ) -> Tuple[Any, List[ImportError]]:
        errors: List[ImportError] = []
        raw_value = source_data.get(field.source)

        if _is_empty(raw_value):
            if field.required and field.default is None:
                errors.append(
                    ImportError(
                        category=ErrorCategory.MISSING_REQUIRED,
                        source_field=field.source,
                        target_field=field.target,
                        message=f"必填字段 '{field.target}' (源: '{field.source}') 缺少值",
                        actual_value=None,
                        row_number=row_number,
                        suggestion=f"请在第 {row_number} 行填充 '{field.source}' 列的值，或配置默认值",
                    )
                )
                return None, errors

            if field.default is not None:
                value = field.default
            else:
                return None, errors
        else:
            value = raw_value

        if field.transform:
            value, tf_errors = self._apply_transform(
                field, value, row_number
            )
            if tf_errors:
                errors.extend(tf_errors)
                return value, errors

        value, type_errors = self._validate_and_cast(
            field, value, row_number
        )
        errors.extend(type_errors)

        return value, errors

    def _apply_transform(
        self,
        field: FieldMapping,
        value: Any,
        row_number: int,
    ) -> Tuple[Any, List[ImportError]]:
        """应用转换表达式。"""
        errors: List[ImportError] = []
        transform = field.transform.strip()

        try:
            str_value = str(value)
            safe_dict = {
                "value": value,
                "str_value": str_value,
                "len": len,
                "int": int,
                "float": float,
                "str": str,
                "bool": bool,
                "abs": abs,
                "round": round,
                "strip": str_value.strip,
                "lower": str_value.lower,
                "upper": str_value.upper,
                "title": str_value.title,
                "replace": str_value.replace,
                "split": str_value.split,
                "join": str.join,
            }

            if transform.startswith("value."):
                expr = transform
            elif "." in transform and "(" in transform:
                expr = transform
            else:
                expr = f"({transform})"

            result = eval(expr, {"__builtins__": {}}, safe_dict)
            return result, errors

        except Exception as exc:
            errors.append(
                ImportError(
                    category=ErrorCategory.TRANSFORM_FAILED,
                    source_field=field.source,
                    target_field=field.target,
                    message=(
                        f"字段 '{field.target}' 执行转换 '{transform}' 失败: "
                        f"{type(exc).__name__}: {exc}"
                    ),
                    actual_value=str(value),
                    row_number=row_number,
                    suggestion=(
                        f"检查转换表达式语法，或修正源数据格式。"
                        f"示例: strip()、lower()、int(value)、value[:10]"
                    ),
                )
            )
            return value, errors

    def _validate_and_cast(
        self,
        field: FieldMapping,
        value: Any,
        row_number: int,
    ) -> Tuple[Any, List[ImportError]]:
        """按字段类型验证并转换值。"""
        errors: List[ImportError] = []

        try:
            result = self._cast_value(field.field_type, value)
        except (ValueError, TypeError) as exc:
            errors.append(
                ImportError(
                    category=ErrorCategory.TYPE_MISMATCH,
                    source_field=field.source,
                    target_field=field.target,
                    message=(
                        f"字段 '{field.target}' 类型转换失败，"
                        f"期望 {field.field_type.value}，实际值: {value!r}"
                    ),
                    actual_value=str(value),
                    expected_value=field.field_type.value,
                    row_number=row_number,
                    suggestion=(
                        f"确保源数据格式符合 {field.field_type.value} 类型要求，"
                        f"或调整 mapping 配置中的 field_type"
                    ),
                )
            )
            return value, errors

        if field.min_value is not None and isinstance(result, (int, float)):
            if result < field.min_value:
                errors.append(
                    ImportError(
                        category=ErrorCategory.VALUE_OUT_OF_RANGE,
                        source_field=field.source,
                        target_field=field.target,
                        message=(
                            f"字段 '{field.target}' 值 {result} 小于最小值 {field.min_value}"
                        ),
                        actual_value=str(result),
                        expected_value=f">= {field.min_value}",
                        row_number=row_number,
                        suggestion=f"将值调整为不小于 {field.min_value}",
                    )
                )

        if field.max_value is not None and isinstance(result, (int, float)):
            if result > field.max_value:
                errors.append(
                    ImportError(
                        category=ErrorCategory.VALUE_OUT_OF_RANGE,
                        source_field=field.source,
                        target_field=field.target,
                        message=(
                            f"字段 '{field.target}' 值 {result} 大于最大值 {field.max_value}"
                        ),
                        actual_value=str(result),
                        expected_value=f"<= {field.max_value}",
                        row_number=row_number,
                        suggestion=f"将值调整为不大于 {field.max_value}",
                    )
                )

        if field.regex and isinstance(result, str):
            if not re.match(field.regex, result):
                errors.append(
                    ImportError(
                        category=ErrorCategory.INVALID_FORMAT,
                        source_field=field.source,
                        target_field=field.target,
                        message=(
                            f"字段 '{field.target}' 值 '{result}' 不符合正则 {field.regex}"
                        ),
                        actual_value=result,
                        expected_value=f"匹配 {field.regex}",
                        row_number=row_number,
                        suggestion="检查值格式是否满足正则表达式约束",
                    )
                )

        if field.allowed_values is not None and result not in field.allowed_values:
            errors.append(
                ImportError(
                    category=ErrorCategory.INVALID_FORMAT,
                    source_field=field.source,
                    target_field=field.target,
                    message=(
                        f"字段 '{field.target}' 值 {result!r} 不在允许列表中"
                    ),
                    actual_value=str(result),
                    expected_value=str(field.allowed_values),
                    row_number=row_number,
                    suggestion=f"从允许值中选择: {field.allowed_values}",
                )
            )

        return result, errors

    @staticmethod
    def _cast_value(field_type: FieldType, value: Any) -> Any:
        """按类型转换值。"""
        if isinstance(value, str):
            value = value.strip()

        if field_type == FieldType.STRING:
            return str(value)

        if field_type == FieldType.INTEGER:
            if isinstance(value, bool):
                raise ValueError(f"布尔值不能转为整数: {value}")
            if isinstance(value, (int, float)):
                if isinstance(value, float) and not value.is_integer():
                    raise ValueError(f"浮点值不能精确转为整数: {value}")
                return int(value)
            s = str(value).strip()
            if s == "":
                raise ValueError("空字符串不能转为整数")
            return int(s)

        if field_type == FieldType.FLOAT:
            if isinstance(value, (int, float)):
                return float(value)
            s = str(value).strip()
            if s == "":
                raise ValueError("空字符串不能转为浮点数")
            return float(s)

        if field_type == FieldType.BOOLEAN:
            if isinstance(value, bool):
                return value
            s = str(value).strip().lower()
            if s in ("1", "true", "yes", "on", "是", "y", "t"):
                return True
            if s in ("0", "false", "no", "off", "否", "n", "f", ""):
                return False
            raise ValueError(f"无法转为布尔值: {value!r}")

        if field_type == FieldType.DATE:
            if isinstance(value, date):
                return value
            if isinstance(value, datetime):
                return value.date()
            s = str(value).strip()
            for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y%m%d", "%d-%m-%Y", "%m/%d/%Y"):
                try:
                    return datetime.strptime(s, fmt).date()
                except ValueError:
                    continue
            raise ValueError(f"无法解析日期: {value!r}")

        if field_type == FieldType.DATETIME:
            if isinstance(value, datetime):
                return value
            if isinstance(value, date):
                return datetime(value.year, value.month, value.day)
            s = str(value).strip()
            formats = (
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%d %H:%M",
                "%Y/%m/%d %H:%M:%S",
                "%Y%m%d%H%M%S",
                "%Y-%m-%d",
            )
            for fmt in formats:
                try:
                    return datetime.strptime(s, fmt)
                except ValueError:
                    continue
            raise ValueError(f"无法解析时间: {value!r}")

        if field_type == FieldType.EMAIL:
            s = str(value).strip()
            email_re = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")
            if not email_re.match(s):
                raise ValueError(f"无效邮箱格式: {value!r}")
            return s

        if field_type == FieldType.PHONE:
            s = str(value).strip()
            phone_re = re.compile(r"^[0-9+\-\s()]{6,20}$")
            if not phone_re.match(s):
                raise ValueError(f"无效电话格式: {value!r}")
            return s

        if field_type == FieldType.ENUM:
            return str(value)

        if field_type == FieldType.UUID:
            if isinstance(value, UUID):
                return value
            s = str(value).strip()
            return UUID(s)

        return value


class DataReader:
    """从 CSV 或 JSON 文件读取数据。

    注意: DataReader 层不再过滤空行，空行会保留并交给 DryRunEngine 决定是否跳过，
    以便在最终报告中正确统计 total_records 和 skipped_count。
    skip_empty_rows 参数保留用于接口兼容，但默认已不再在本层生效。
    """

    def __init__(
        self,
        delimiter: str = ",",
        encoding: str = "utf-8",
        skip_empty_rows: bool = True,
    ) -> None:
        self._delimiter = delimiter
        self._encoding = encoding
        # 空行跳过逻辑已移至 DryRunEngine，保证空行被计入总记录数和跳过数
        self._skip_empty_rows = skip_empty_rows

    def read(self, file_path: str) -> List[Dict[str, Any]]:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"输入文件不存在: {file_path}")

        suffix = path.suffix.lower()
        if suffix == ".csv":
            return self._read_csv(path)
        if suffix in (".json", ".jsonl", ".ndjson"):
            return self._read_json(path, suffix)

        raise ValueError(
            f"不支持的输入文件格式: {suffix}, 请使用 .csv/.json/.jsonl"
        )

    def _read_csv(self, path: Path) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []
        with open(path, "r", encoding=self._encoding, newline="") as f:
            # 使用 csv.reader 而不是 DictReader，因为 DictReader 会自动跳过空行。
            # 我们需要保留空行，让 DryRunEngine 决定是否标记为 skipped，
            # 以确保总记录数和跳过计数准确。
            reader = csv.reader(f, delimiter=self._delimiter)
            try:
                fieldnames = next(reader)
            except StopIteration:
                return rows
            if not fieldnames:
                return rows

            for raw_row in reader:
                if raw_row is None:
                    rows.append({name: None for name in fieldnames})
                    continue

                # 空行（csv.reader 返回 []）→ 视为全空字典
                if len(raw_row) == 0:
                    rows.append({name: None for name in fieldnames})
                    continue

                # 列数与表头不一致时，用 None 补齐
                if len(raw_row) < len(fieldnames):
                    raw_row = raw_row + [None] * (len(fieldnames) - len(raw_row))

                row_dict: Dict[str, Any] = {}
                for idx, name in enumerate(fieldnames):
                    if name is None:
                        continue
                    row_dict[name] = raw_row[idx] if idx < len(raw_row) else None

                if len(raw_row) > len(fieldnames):
                    extras = [
                        {"column": len(fieldnames) + i + 1, "value": v}
                        for i, v in enumerate(raw_row[len(fieldnames):])
                        if v is not None and str(v).strip() != ""
                    ]
                    if extras:
                        row_dict["__extra_columns__"] = extras

                rows.append(row_dict)
        return rows

    def _read_json(
        self, path: Path, suffix: str
    ) -> List[Dict[str, Any]]:
        with open(path, "r", encoding=self._encoding) as f:
            if suffix in (".jsonl", ".ndjson"):
                rows: List[Dict[str, Any]] = []
                line_no = 0
                for raw_line in f:
                    line_no += 1
                    line = raw_line.strip()
                    if not line:
                        # JSONL 空行 → 视为空记录 {}，让 Engine 标记跳过
                        rows.append({})
                        continue
                    data = json.loads(line)
                    if isinstance(data, dict):
                        rows.append(data)
                    else:
                        raise ValueError(
                            f"JSONL 文件第 {line_no} 行必须是对象"
                        )
                return rows
            else:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if not isinstance(item, dict):
                            raise ValueError(
                                "JSON 数组元素必须是对象"
                            )
                    return data
                if isinstance(data, dict):
                    return [data]
                raise ValueError(
                    "JSON 文件根节点必须是数组或对象"
                )


class MappingLoader:
    """加载字段映射文件。"""

    @staticmethod
    def load_mapping(file_path: str) -> List[FieldMapping]:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"映射文件不存在: {file_path}")
        suffix = path.suffix.lower()

        with open(path, "r", encoding="utf-8") as f:
            if suffix in (".yaml", ".yml"):
                import yaml
                raw = yaml.safe_load(f)
            elif suffix == ".json":
                raw = json.load(f)
            else:
                raise ValueError(
                    f"不支持的映射文件格式: {suffix}, 请使用 .yaml/.yml/.json"
                )

        if raw is None:
            return []
        if isinstance(raw, dict) and "fields" in raw:
            raw = raw["fields"]
        if not isinstance(raw, list):
            raise ValueError(
                "映射文件格式错误: 根节点应为字段列表 (数组)，或包含 'fields' 字段"
            )

        return [FieldMapping(**item) for item in raw]

    @staticmethod
    def load_target(file_path: str) -> TargetSchema:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"目标表结构文件不存在: {file_path}")
        suffix = path.suffix.lower()

        with open(path, "r", encoding="utf-8") as f:
            if suffix in (".yaml", ".yml"):
                import yaml
                raw = yaml.safe_load(f)
            elif suffix == ".json":
                raw = json.load(f)
            else:
                raise ValueError(
                    f"不支持的目标表文件格式: {suffix}, 请使用 .yaml/.yml/.json"
                )

        if raw is None:
            raise ValueError("目标表结构文件为空")

        if isinstance(raw, list):
            return TargetSchema(
                table_name="target_table",
                fields=[FieldMapping(**item) for item in raw],
            )

        if "fields" not in raw:
            raise ValueError("目标表结构文件必须包含 'fields' 字段")

        return TargetSchema(**raw)
