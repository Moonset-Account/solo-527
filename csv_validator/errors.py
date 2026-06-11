"""错误定义模块。

定义校验过程中使用的错误码、错误实例和结果封装类，
确保错误信息结构化、定位精确，并支持机器可读的报告输出。
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Dict, List, Optional


class ExitCode:
    """CLI退出码定义。

    与数据运营团队约定的稳定退出码，便于CI流水线判断错误类型。
    """

    SUCCESS = 0
    VALIDATION_ERRORS = 1
    SCHEMA_ERROR = 2
    IO_ERROR = 3
    CLI_ERROR = 4


class ValidationErrorCode(str, Enum):
    """校验错误码枚举。

    每个错误码对应一种具体的校验失败类型，
    用于机器可读报告中的错误分类和聚合统计。
    """

    MISSING_REQUIRED_COLUMN = "MISSING_REQUIRED_COLUMN"
    UNKNOWN_COLUMN = "UNKNOWN_COLUMN"
    MISSING_VALUE = "MISSING_VALUE"
    TYPE_MISMATCH = "TYPE_MISMATCH"
    INVALID_ENUM = "INVALID_ENUM"
    DUPLICATE_KEY = "DUPLICATE_KEY"
    INVALID_FORMAT = "INVALID_FORMAT"
    VALUE_OUT_OF_RANGE = "VALUE_OUT_OF_RANGE"
    EMPTY_FILE = "EMPTY_FILE"


class ValidationSeverity(str, Enum):
    """校验问题严重程度。"""

    ERROR = "error"
    WARNING = "warning"


@dataclass
class ValidationIssue:
    """单个校验问题。

    包含错误码、定位信息（行号、列名）、原始值、
    错误描述和修复建议，便于快速定位和修复。

    Attributes:
        code: 错误码，见 ValidationErrorCode
        row: CSV数据行号（从2开始，1为表头），None表示全局/表头问题
        column: 列名，None表示无特定列
        value: 触发错误的原始值
        message: 人类可读的错误描述
        suggestion: 修复建议
        severity: 严重程度
    """

    code: ValidationErrorCode
    row: Optional[int]
    column: Optional[str]
    value: Any
    message: str
    suggestion: str = ""
    severity: ValidationSeverity = ValidationSeverity.ERROR

    def to_dict(self) -> Dict[str, Any]:
        """转换为可序列化的字典。"""
        result = asdict(self)
        result["code"] = self.code.value
        result["severity"] = self.severity.value
        return result

    def format_location(self) -> str:
        """格式化位置信息，便于人类阅读。"""
        parts = []
        if self.row is not None:
            parts.append(f"第{self.row}行")
        if self.column is not None:
            parts.append(f"列[{self.column}]")
        return " ".join(parts) if parts else "全局"


@dataclass
class ValidationResult:
    """校验结果汇总。

    汇总所有校验问题、统计信息和样例数据，
    可直接序列化为JSON供CI流水线或下游系统消费。

    Attributes:
        valid: 是否通过校验（无ERROR级别问题）
        issues: 所有校验问题列表
        total_rows: 数据行数（不含表头）
        total_columns: 列数
        stats: 按错误码的统计计数
        sample_errors: 典型错误样例（用于快速预览）
        fix_preview: 修复建议预览
    """

    valid: bool
    issues: List[ValidationIssue] = field(default_factory=list)
    total_rows: int = 0
    total_columns: int = 0
    stats: Dict[str, int] = field(default_factory=dict)
    sample_errors: List[Dict[str, Any]] = field(default_factory=list)
    fix_preview: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """转换为可序列化的字典（用于JSON输出）。"""
        return {
            "valid": self.valid,
            "total_rows": self.total_rows,
            "total_columns": self.total_columns,
            "error_count": self.error_count,
            "warning_count": self.warning_count,
            "stats": self.stats,
            "issues": [issue.to_dict() for issue in self.issues],
            "sample_errors": self.sample_errors,
            "fix_preview": self.fix_preview,
        }

    @property
    def error_count(self) -> int:
        """ERROR级别问题数量。"""
        return sum(
            1 for i in self.issues if i.severity == ValidationSeverity.ERROR
        )

    @property
    def warning_count(self) -> int:
        """WARNING级别问题数量。"""
        return sum(
            1 for i in self.issues if i.severity == ValidationSeverity.WARNING
        )

    def add_issue(self, issue: ValidationIssue) -> None:
        """添加一个校验问题并更新统计。"""
        self.issues.append(issue)
        code_str = issue.code.value
        self.stats[code_str] = self.stats.get(code_str, 0) + 1
        if issue.severity == ValidationSeverity.ERROR:
            self.valid = False

    def finalize(self) -> None:
        """校验结束后的收尾工作：生成样例错误和修复预览。"""
        self.sample_errors = self._generate_sample_errors()
        self.fix_preview = self._generate_fix_preview()

    def _generate_sample_errors(self, limit: int = 5) -> List[Dict[str, Any]]:
        """抽取典型错误样例。"""
        samples = []
        seen_codes = set()
        for issue in self.issues:
            if issue.code.value not in seen_codes and len(samples) < limit:
                seen_codes.add(issue.code.value)
                samples.append(issue.to_dict())
        return samples

    def _generate_fix_preview(self) -> List[Dict[str, Any]]:
        """生成修复建议预览，按错误类型聚合。"""
        fixes: Dict[str, Dict[str, Any]] = {}
        for issue in self.issues:
            code = issue.code.value
            if code not in fixes and issue.suggestion:
                fixes[code] = {
                    "code": code,
                    "count": self.stats.get(code, 0),
                    "suggestion": issue.suggestion,
                    "example": {
                        "location": issue.format_location(),
                        "value": str(issue.value) if issue.value is not None else "",
                    },
                }
        return list(fixes.values())


class ValidationError(Exception):
    """校验过程中发生的异常（非数据校验问题，而是流程性错误）。"""

    def __init__(self, message: str, exit_code: int = ExitCode.VALIDATION_ERRORS):
        super().__init__(message)
        self.exit_code = exit_code
