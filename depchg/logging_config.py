"""结构化日志配置模块。"""

from __future__ import annotations

import logging
import sys
from typing import Optional

import structlog


_LOG_LEVEL_ORDER = {
    "debug": 10,
    "info": 20,
    "warning": 30,
    "warn": 30,
    "error": 40,
    "err": 40,
    "critical": 50,
    "fatal": 50,
}


def _safe_add_logger_name(logger, method_name, event_dict):
    """安全添加 logger 名称的处理器。"""
    if hasattr(logger, "name"):
        event_dict["logger"] = logger.name
    else:
        record = event_dict.get("_record")
        if record is not None and hasattr(record, "name"):
            event_dict["logger"] = record.name
    return event_dict


class _LevelFilter:
    """structlog 处理器，按级别丢弃日志。

    因为使用 PrintLoggerFactory 而非 stdlib 集成，
    需要在处理器链中显式过滤。
    """

    def __init__(self, min_level_int: int):
        self.min_level_int = min_level_int

    def __call__(self, logger, method_name, event_dict):
        level_str = event_dict.get("level", method_name or "")
        evt_level = _LOG_LEVEL_ORDER.get(str(level_str).lower(), 99)
        if evt_level < self.min_level_int:
            raise structlog.DropEvent
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

    log_level_int = int(log_level)

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
        _LevelFilter(log_level_int),
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

