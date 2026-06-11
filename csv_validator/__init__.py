"""CSV数据导入校验器模块。

本模块提供CSV文件的结构化校验能力，包括：
- 基于Schema的字段类型校验
- 必填列检查
- 枚举值合法性校验
- 唯一键重复检测
- 错误定位与修复建议
- CI友好的退出码和机器可读报告
"""

from csv_validator.errors import (
    ValidationError,
    ValidationErrorCode,
    ValidationIssue,
    ValidationResult,
)
from csv_validator.schema import FieldSchema, Schema, SchemaLoader
from csv_validator.validator import CSVValidator

__version__ = "1.0.0"
__all__ = [
    "CSVValidator",
    "FieldSchema",
    "Schema",
    "SchemaLoader",
    "ValidationError",
    "ValidationErrorCode",
    "ValidationIssue",
    "ValidationResult",
]
