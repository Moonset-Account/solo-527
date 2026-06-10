"""结构化日志配置模块。"""

from __future__ import annotations

import logging
import sys
from typing import Optional

import structlog


def _safe_add_logger_name(logger, method_name, event_dict):
    """安全添加 logger 名称的处理器。"""
    if hasattr(logger, "name"):
        event_dict["logger"] = logger.name
    else:
        record = event_dict.get("_record")
        if record is not None and hasattr(record, "name"):
            event_dict["logger"] = record.name
    return event_dict


def setup_logging(level: str = "WARNING", json_output: bool = False) -> None:
    """配置结构化日志系统。

    Args:
        level: 日志级别 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_output: 是否以 JSON 格式输出
    """
    try:
        log_level = getattr(logging, level.upper())
    except AttributeError:
        log_level = logging.WARNING

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stderr,
        level=log_level,
        force=True,
    )

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        _safe_add_logger_name,
    ]

    if json_output:
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]
    else:
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(
                colors=sys.stderr.isatty(),
            ),
        ]

    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stderr),
        cache_logger_on_first_use=True,
    )


def get_logger(name: Optional[str] = None) -> structlog.stdlib.BoundLogger:
    """获取结构化日志记录器。"""
    return structlog.get_logger(name or "depchg")

