"""Structured logging module.

Supports both human-readable and JSON formatted output for easy parsing
in CI/CD pipelines.
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any


class StructuredFormatter(logging.Formatter):
    """Base class for structured log formatters."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = self._build_log_entry(record)
        return self._serialize(log_entry)

    def _build_log_entry(self, record: logging.LogRecord) -> dict[str, Any]:
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        for key, value in record.__dict__.items():
            if key not in (
                "args", "asctime", "created", "exc_info", "exc_text",
                "filename", "funcName", "id", "levelname", "levelno",
                "lineno", "module", "msecs", "message", "msg", "name",
                "pathname", "process", "processName", "relativeCreated",
                "stack_info", "thread", "threadName",
            ):
                entry[key] = value
        return entry

    def _serialize(self, entry: dict[str, Any]) -> str:
        raise NotImplementedError


class JSONFormatter(StructuredFormatter):
    """JSON log formatter for machine-readable output."""

    def _serialize(self, entry: dict[str, Any]) -> str:
        return json.dumps(entry, ensure_ascii=False, default=str)


class HumanReadableFormatter(StructuredFormatter):
    """Human-readable log formatter with color support."""

    COLORS = {
        "DEBUG": "\033[36m",
        "INFO": "\033[32m",
        "WARNING": "\033[33m",
        "ERROR": "\033[31m",
        "CRITICAL": "\033[35m",
        "RESET": "\033[0m",
    }

    def __init__(self, use_color: bool = True, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.use_color = use_color and sys.stderr.isatty()

    def _serialize(self, entry: dict[str, Any]) -> str:
        level = entry["level"]
        color = self.COLORS.get(level, "") if self.use_color else ""
        reset = self.COLORS["RESET"] if self.use_color else ""

        timestamp = entry["timestamp"].replace("T", " ").split(".")[0]
        message = entry["message"]

        extra_fields = {k: v for k, v in entry.items() if k not in ("timestamp", "level", "logger", "message", "exception")}
        extra_str = " ".join(f"{k}={v}" for k, v in extra_fields.items())

        parts = [
            f"{timestamp}",
            f"{color}{level:<8}{reset}",
            f"{message}",
        ]
        if extra_str:
            parts.append(f"[{extra_str}]")
        if "exception" in entry:
            parts.append(f"\n{entry['exception']}")

        return " ".join(parts)


def get_logger(
    name: str = "backup_checker",
    level: int = logging.INFO,
    json_output: bool = False,
    verbose: bool = False,
) -> logging.Logger:
    """Get a configured logger instance.

    Args:
        name: Logger name
        level: Logging level
        json_output: If True, output JSON formatted logs
        verbose: If True, use DEBUG level

    Returns:
        Configured logger instance
    """
    if verbose:
        level = logging.DEBUG

    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.handlers.clear()

    handler = logging.StreamHandler(sys.stderr)
    handler.setLevel(level)

    if json_output:
        formatter: logging.Formatter = JSONFormatter()
    else:
        formatter = HumanReadableFormatter()

    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

    return logger


def log_with_context(
    logger: logging.Logger,
    level: int,
    message: str,
    **context: Any,
) -> None:
    """Log a message with additional context fields.

    Args:
        logger: Logger instance
        level: Logging level
        message: Log message
        **context: Additional key-value pairs to include in the log entry
    """
    record = logging.LogRecord(
        name=logger.name,
        level=level,
        pathname="",
        lineno=0,
        msg=message,
        args=(),
        exc_info=None,
    )
    for key, value in context.items():
        setattr(record, key, value)
    logger.handle(record)


def bind_logger(logger: logging.Logger, **context: Any) -> logging.Logger:
    """Create a logger adapter with bound context.

    Args:
        logger: Logger instance
        **context: Context fields to bind

    Returns:
        LoggerAdapter with bound context
    """
    return logging.LoggerAdapter(logger, context)
