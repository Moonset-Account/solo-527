"""
核心数据模型。

使用 Pydantic 定义所有数据结构，确保类型安全和验证。
"""

from __future__ import annotations

import re
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, field_validator, ConfigDict


class ErrorCategory(str, Enum):
    """错误分类。"""

    MISSING_REQUIRED = "missing_required"
    TYPE_MISMATCH = "type_mismatch"
    INVALID_FORMAT = "invalid_format"
    VALUE_OUT_OF_RANGE = "value_out_of_range"
    DUPLICATE_KEY = "duplicate_key"
    FOREIGN_KEY_NOT_FOUND = "foreign_key_not_found"
    UNMAPPED_FIELD = "unmapped_field"
    UNKNOWN_ERROR = "unknown_error"
    TRANSFORM_FAILED = "transform_failed"
    EMPTY_RECORD = "empty_record"

    @property
    def label(self) -> str:
        labels = {
            ErrorCategory.MISSING_REQUIRED: "缺少必填字段",
            ErrorCategory.TYPE_MISMATCH: "类型不匹配",
            ErrorCategory.INVALID_FORMAT: "格式无效",
            ErrorCategory.VALUE_OUT_OF_RANGE: "数值越界",
            ErrorCategory.DUPLICATE_KEY: "重复键值",
            ErrorCategory.FOREIGN_KEY_NOT_FOUND: "外键不存在",
            ErrorCategory.UNMAPPED_FIELD: "未映射字段",
            ErrorCategory.UNKNOWN_ERROR: "未知错误",
            ErrorCategory.TRANSFORM_FAILED: "转换失败",
            ErrorCategory.EMPTY_RECORD: "空记录",
        }
        return labels[self]


class FieldType(str, Enum):
    """目标字段类型。"""

    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    DATE = "date"
    DATETIME = "datetime"
    EMAIL = "email"
    PHONE = "phone"
    ENUM = "enum"
    UUID = "uuid"


class FieldMapping(BaseModel):
    """字段映射规则。

    Attributes:
        source: 源字段名（客户数据中的列名）
        target: 目标字段名（目标表中的列名）
        required: 是否为必填字段
        field_type: 目标字段类型
        transform: 可选的转换表达式，如 "strip()", "lower()", "int(value)"
        default: 默认值（当源字段为空时使用）
        allowed_values: 允许值列表（enum 类型）
        description: 字段说明
    """

    model_config = ConfigDict(extra="forbid")

    source: str = Field(..., description="源字段名")
    target: str = Field(..., description="目标字段名")
    required: bool = Field(False, description="是否必填")
    field_type: FieldType = Field(FieldType.STRING, description="字段类型")
    transform: Optional[str] = Field(None, description="转换表达式")
    default: Optional[Any] = Field(None, description="默认值")
    allowed_values: Optional[List[Any]] = Field(None, description="允许值列表")
    description: Optional[str] = Field(None, description="字段说明")
    min_value: Optional[Union[int, float]] = Field(None, description="最小值")
    max_value: Optional[Union[int, float]] = Field(None, description="最大值")
    regex: Optional[str] = Field(None, description="正则校验")
    is_primary_key: bool = Field(False, description="是否主键")
    foreign_key_table: Optional[str] = Field(None, description="外键关联表")


class TargetSchema(BaseModel):
    """目标表结构定义。"""

    model_config = ConfigDict(extra="forbid")

    table_name: str = Field(..., description="目标表名")
    description: Optional[str] = Field(None, description="表描述")
    fields: List[FieldMapping] = Field(..., description="字段映射列表")
    primary_keys: List[str] = Field(default_factory=list, description="主键字段")
    unique_constraints: List[List[str]] = Field(
        default_factory=list, description="唯一约束（多个字段组合）"
    )

    @field_validator("fields")
    @classmethod
    def _validate_unique_targets(cls, fields: List[FieldMapping]) -> List[FieldMapping]:
        targets = [f.target for f in fields]
        if len(targets) != len(set(targets)):
            duplicates = [t for t in targets if targets.count(t) > 1]
            raise ValueError(f"目标字段存在重复: {list(set(duplicates))}")
        return fields

    def get_required_fields(self) -> List[FieldMapping]:
        return [f for f in self.fields if f.required]

    def get_field(self, target: str) -> Optional[FieldMapping]:
        for f in self.fields:
            if f.target == target:
                return f
        return None

    def get_field_by_source(self, source: str) -> Optional[FieldMapping]:
        for f in self.fields:
            if f.source == source:
                return f
        return None


class ImportError(BaseModel):
    """单条导入错误。"""

    model_config = ConfigDict(extra="forbid")

    category: ErrorCategory = Field(..., description="错误分类")
    target_field: Optional[str] = Field(None, description="目标字段")
    source_field: Optional[str] = Field(None, description="源字段")
    message: str = Field(..., description="错误描述")
    actual_value: Optional[str] = Field(None, description="实际值")
    expected_value: Optional[str] = Field(None, description="期望值")
    row_number: Optional[int] = Field(None, description="行号")
    suggestion: Optional[str] = Field(None, description="修复建议")

    def __hash__(self) -> int:
        return hash(
            (
                self.category,
                self.target_field,
                self.message,
            )
        )


class ImportRecord(BaseModel):
    """单条导入记录。"""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    row_number: int = Field(..., description="原始行号")
    source_data: Dict[str, Any] = Field(..., description="原始源数据")
    target_data: Dict[str, Any] = Field(default_factory=dict, description="映射后的目标数据")
    errors: List[ImportError] = Field(default_factory=list, description="错误列表")
    skipped: bool = Field(False, description="是否跳过")
    skip_reason: Optional[str] = Field(None, description="跳过原因")

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0 and not self.skipped


class ImportResult(BaseModel):
    """导入结果汇总。"""

    input_file: Optional[str] = Field(None, description="输入文件路径")
    target_table: str = Field(..., description="目标表名")
    started_at: datetime = Field(default_factory=datetime.now)
    finished_at: Optional[datetime] = Field(None)
    total_records: int = Field(0, description="总记录数")
    processed_count: int = Field(0, description="处理成功数")
    skipped_count: int = Field(0, description="跳过数")
    failed_count: int = Field(0, description="失败数")
    records: List[ImportRecord] = Field(default_factory=list, description="所有记录详情")
    is_dry_run: bool = Field(True, description="是否 dry-run")
    limit_applied: Optional[int] = Field(None, description="应用的 limit")

    @property
    def duration_seconds(self) -> float:
        end = self.finished_at or datetime.now()
        return (end - self.started_at).total_seconds()

    def finalize(self) -> None:
        self.finished_at = datetime.now()
        self.processed_count = sum(1 for r in self.records if r.is_valid)
        self.skipped_count = sum(1 for r in self.records if r.skipped)
        self.failed_count = sum(
            1 for r in self.records if not r.is_valid and not r.skipped
        )


class ErrorGroup(BaseModel):
    """错误分组结果。"""

    category: ErrorCategory
    target_field: Optional[str]
    count: int = 0
    sample_errors: List[ImportError] = Field(default_factory=list)
    suggestion: Optional[str] = None

    @property
    def key(self) -> tuple:
        return (self.category, self.target_field)
