"""自定义异常类。"""

from __future__ import annotations

from typing import Optional


class DepChgError(Exception):
    """DepChg 工具的基础异常类。"""

    exit_code = 1

    def __init__(
        self,
        message: str,
        suggestion: Optional[str] = None,
        details: Optional[dict] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.suggestion = suggestion
        self.details = details or {}

    def __str__(self) -> str:
        parts = [f"错误: {self.message}"]
        if self.suggestion:
            parts.append(f"建议: {self.suggestion}")
        return " | ".join(parts)


class LockfileParseError(DepChgError):
    """锁文件解析错误。"""

    exit_code = 2


class VersionCompareError(DepChgError):
    """版本对比错误。"""

    exit_code = 3


class ConfigError(DepChgError):
    """配置加载错误。"""

    exit_code = 4


class OutputError(DepChgError):
    """输出格式化错误。"""

    exit_code = 5


class ValidationError(DepChgError):
    """参数校验错误。"""

    exit_code = 6
