"""
模拟导入引擎。

负责:
    - 读取输入数据
    - 执行字段映射
    - 检测业务约束（主键重复、唯一约束）
    - 构建导入结果
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Set, Tuple

from .config import AppConfig
from .mapper import DataReader, FieldMapper, MappingLoader
from .models import (
    ErrorCategory,
    ImportError,
    ImportRecord,
    ImportResult,
    TargetSchema,
)


def _make_key(values: Dict[str, Any], fields: List[str]) -> Optional[tuple]:
    """从记录中提取唯一键元组。"""
    if not fields:
        return None
    key_parts = []
    for f in fields:
        v = values.get(f)
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return None
        key_parts.append(str(v))
    return tuple(key_parts)


class DryRunEngine:
    """Dry-Run 导入引擎。"""

    def __init__(
        self,
        config: AppConfig,
        schema: Optional[TargetSchema] = None,
    ) -> None:
        self._config = config
        self._schema = schema

        self._reader = DataReader(
            delimiter=config.csv_delimiter,
            encoding=config.csv_encoding,
            skip_empty_rows=config.skip_empty_rows,
        )

        self._seen_pks: Dict[tuple, int] = {}
        self._seen_uniques: Dict[int, Dict[tuple, int]] = {}

    def run(
        self,
        input_file: Optional[str] = None,
        source_rows: Optional[List[Dict[str, Any]]] = None,
    ) -> ImportResult:
        """执行 dry-run 导入。

        Args:
            input_file: 输入文件路径
            source_rows: 直接传入的源数据行（用于测试）

        Returns:
            ImportResult 汇总结果
        """
        if self._schema is None:
            self._schema = self._load_schema()

        result = ImportResult(
            input_file=input_file or self._config.input_file,
            target_table=self._schema.table_name,
            is_dry_run=self._config.dry_run,
            limit_applied=self._config.limit,
        )

        if source_rows is None:
            resolved_input = input_file or self._config.input_file
            if not resolved_input:
                raise ValueError(
                    "未指定输入文件: 请通过 --input 参数或配置文件指定"
                )
            source_rows = self._reader.read(resolved_input)

        mapper = FieldMapper(self._schema, strict=self._config.strict_mode)

        limit = self._config.limit
        total = len(source_rows)

        result.total_records = total if limit is None else min(total, limit)

        for idx, row in enumerate(source_rows):
            row_number = idx + 1
            if limit is not None and idx >= limit:
                break

            record = self._process_row(row_number, row, mapper)
            result.records.append(record)

        result.finalize()
        return result

    def _load_schema(self) -> TargetSchema:
        """加载目标表结构。"""
        if self._config.target_file:
            schema = MappingLoader.load_target(self._config.target_file)
        elif self._config.mapping_file:
            fields = MappingLoader.load_mapping(self._config.mapping_file)
            schema = TargetSchema(
                table_name="target_table",
                fields=fields,
            )
        else:
            raise ValueError(
                "未指定字段映射或目标表: 请通过 --mapping 或 --target 参数指定"
            )

        for f in schema.fields:
            if f.is_primary_key and f.target not in schema.primary_keys:
                schema.primary_keys.append(f.target)

        return schema

    def _process_row(
        self,
        row_number: int,
        source_row: Dict[str, Any],
        mapper: FieldMapper,
    ) -> ImportRecord:
        """处理单行数据。"""
        record = ImportRecord(
            row_number=row_number,
            source_data=source_row,
        )

        if self._config.skip_empty_rows and self._is_empty_row(source_row):
            record.skipped = True
            record.skip_reason = "空行"
            record.errors.append(
                ImportError(
                    category=ErrorCategory.EMPTY_RECORD,
                    message=f"第 {row_number} 行为空，已跳过",
                    row_number=row_number,
                    suggestion="删除空行或填充数据",
                )
            )
            return record

        extra_columns = source_row.get("__extra_columns__")
        if extra_columns:
            for extra in extra_columns:
                col_idx = extra["column"]
                val = extra["value"]
                if self._config.strict_mode:
                    record.errors.append(
                        ImportError(
                            category=ErrorCategory.UNMAPPED_FIELD,
                            target_field=f"第{col_idx}列(超列)",
                            source_field=f"第{col_idx}列",
                            message=(
                                f"第 {row_number} 行第 {col_idx} 列有多余数据"
                                f" '{val}'，超出表头定义（严格模式下视为错误）"
                            ),
                            actual_value=str(val),
                            row_number=row_number,
                            suggestion=(
                                "删除多余列数据，或在表头中补充对应列名"
                            ),
                        )
                    )
                else:
                    record.errors.append(
                        ImportError(
                            category=ErrorCategory.UNMAPPED_FIELD,
                            target_field=f"第{col_idx}列(超列)",
                            source_field=f"第{col_idx}列",
                            message=(
                                f"第 {row_number} 行第 {col_idx} 列有多余数据"
                                f" '{val}'，超出表头定义（非严格模式，仅提醒）"
                            ),
                            actual_value=str(val),
                            row_number=row_number,
                            suggestion=(
                                "删除多余列数据，或在表头中补充对应列名"
                            ),
                        )
                    )

        mapper_row = {k: v for k, v in source_row.items() if k != "__extra_columns__"}
        target_data, map_errors = mapper.map_record(row_number, mapper_row)
        record.target_data = target_data
        record.errors.extend(map_errors)

        if record.errors:
            return record

        constraint_errors = self._check_constraints(
            row_number, target_data
        )
        record.errors.extend(constraint_errors)

        return record

    @staticmethod
    def _is_empty_row(row: Dict[str, Any]) -> bool:
        if not row:
            return True
        extras = row.get("__extra_columns__")
        if extras:
            return False
        for k, v in row.items():
            if k == "__extra_columns__":
                continue
            if v is not None and str(v).strip() != "":
                return False
        return True

    def _check_constraints(
        self,
        row_number: int,
        target_data: Dict[str, Any],
    ) -> List[ImportError]:
        """检查主键和唯一约束。"""
        errors: List[ImportError] = []
        schema = self._schema
        assert schema is not None

        pk_key = _make_key(target_data, schema.primary_keys)
        if pk_key is not None:
            if pk_key in self._seen_pks:
                prev_row = self._seen_pks[pk_key]
                errors.append(
                    ImportError(
                        category=ErrorCategory.DUPLICATE_KEY,
                        target_field=",".join(schema.primary_keys),
                        message=(
                            f"主键重复: {pk_key}，与第 {prev_row} 行冲突"
                        ),
                        actual_value=str(pk_key),
                        expected_value="唯一值",
                        row_number=row_number,
                        suggestion=(
                            f"修改当前行或第 {prev_row} 行的主键值，"
                            f"确保主键 {schema.primary_keys} 唯一"
                        ),
                    )
                )
            else:
                self._seen_pks[pk_key] = row_number

        for ci, unique_fields in enumerate(schema.unique_constraints):
            uk_key = _make_key(target_data, unique_fields)
            if uk_key is None:
                continue
            seen = self._seen_uniques.setdefault(ci, {})
            if uk_key in seen:
                prev_row = seen[uk_key]
                errors.append(
                    ImportError(
                        category=ErrorCategory.DUPLICATE_KEY,
                        target_field=",".join(unique_fields),
                        message=(
                            f"唯一约束冲突 {unique_fields}: {uk_key}，"
                            f"与第 {prev_row} 行冲突"
                        ),
                        actual_value=str(uk_key),
                        expected_value="唯一值",
                        row_number=row_number,
                        suggestion=(
                            f"修改当前行或第 {prev_row} 行的字段值，"
                            f"确保 {unique_fields} 组合唯一"
                        ),
                    )
                )
            else:
                seen[uk_key] = row_number

        return errors

    def reset(self) -> None:
        """重置引擎状态（清除约束跟踪）。"""
        self._seen_pks.clear()
        self._seen_uniques.clear()
