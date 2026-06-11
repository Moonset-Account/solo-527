"""
数据导入 Dry-Run 工具。

提供字段映射、模拟导入、错误分组、修复建议。
"""

__version__ = "0.1.0"

from .models import (
    FieldMapping,
    TargetSchema,
    ImportRecord,
    ImportError,
    ImportResult,
    ErrorCategory,
)
from .config import AppConfig, load_config
from .mapper import FieldMapper
from .engine import DryRunEngine
from .errors import ErrorGrouper, RepairAdvisor
from .report import ReportGenerator

__all__ = [
    "__version__",
    "FieldMapping",
    "TargetSchema",
    "ImportRecord",
    "ImportError",
    "ImportResult",
    "ErrorCategory",
    "AppConfig",
    "load_config",
    "FieldMapper",
    "DryRunEngine",
    "ErrorGrouper",
    "RepairAdvisor",
    "ReportGenerator",
]
