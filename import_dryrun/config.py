"""
配置加载模块。

支持三层配置覆盖：
    命令行参数 > 环境变量 > 配置文件 > 默认值
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from pydantic import BaseModel, Field, ConfigDict


ENV_PREFIX = "IMPORTDRYRUN_"

DEFAULT_CONFIG_FILENAMES = [
    "import-dryrun.yaml",
    "import-dryrun.yml",
    "import-dryrun.json",
    ".import-dryrun.yaml",
    ".import-dryrun.yml",
    ".import-dryrun.json",
]


class LogLevel(str):
    pass


class AppConfig(BaseModel):
    """应用完整配置。"""

    model_config = ConfigDict(extra="ignore")

    mapping_file: Optional[str] = Field(
        default=None, description="字段映射文件路径 (YAML/JSON)"
    )
    target_file: Optional[str] = Field(
        default=None, description="目标表结构文件路径 (YAML/JSON)"
    )
    input_file: Optional[str] = Field(
        default=None, description="输入数据文件路径 (CSV/JSON)"
    )
    sample_errors: int = Field(
        default=5, ge=0, le=100, description="每类错误展示的样例数量"
    )
    limit: Optional[int] = Field(
        default=None, ge=0, description="处理的最大记录数 (默认不限制)"
    )
    dry_run: bool = Field(
        default=True, description="dry-run 模式，仅模拟不实际写入 (默认 True)"
    )
    verbose: bool = Field(
        default=False, description="详细模式，输出更多调试信息"
    )
    machine_output: bool = Field(
        default=False, description="机器可读输出 (JSON)"
    )
    color: bool = Field(
        default=True, description="是否启用彩色输出 (默认 True)"
    )
    config_file: Optional[str] = Field(
        default=None, description="配置文件路径 (可自动发现)"
    )
    log_level: str = Field(
        default="INFO", description="日志级别: DEBUG/INFO/WARNING/ERROR"
    )
    output_file: Optional[str] = Field(
        default=None, description="报告输出文件路径"
    )
    strict_mode: bool = Field(
        default=False, description="严格模式，未映射字段视为错误"
    )
    skip_empty_rows: bool = Field(
        default=True, description="跳过空行 (默认 True)"
    )
    csv_delimiter: str = Field(
        default=",", description="CSV 分隔符 (默认 ',')"
    )
    csv_encoding: str = Field(
        default="utf-8", description="CSV 编码 (默认 utf-8)"
    )

    def merge_cli_args(self, cli_args: Dict[str, Any]) -> "AppConfig":
        """用 CLI 参数覆盖配置（最高优先级）。"""
        merged = self.model_dump()
        for key, value in cli_args.items():
            if value is not None and hasattr(self, key):
                merged[key] = value
        return AppConfig(**merged)


def _find_config_file(start_dir: Optional[Path] = None) -> Optional[Path]:
    """在当前目录及父目录中查找配置文件。"""
    current = Path(start_dir or Path.cwd()).resolve()
    while True:
        for filename in DEFAULT_CONFIG_FILENAMES:
            candidate = current / filename
            if candidate.exists() and candidate.is_file():
                return candidate
        parent = current.parent
        if parent == current:
            break
        current = parent
    return None


def _load_config_file(path: Path) -> Dict[str, Any]:
    """从 YAML 或 JSON 文件加载配置。"""
    if not path.exists():
        raise FileNotFoundError(f"配置文件不存在: {path}")

    suffix = path.suffix.lower()
    with open(path, "r", encoding="utf-8") as f:
        if suffix in (".yaml", ".yml"):
            data = yaml.safe_load(f)
        elif suffix == ".json":
            data = json.load(f)
        else:
            raise ValueError(
                f"不支持的配置文件格式: {suffix}, 请使用 .yaml/.yml/.json"
            )

    if data is None:
        return {}
    if not isinstance(data, dict):
        raise ValueError(f"配置文件根节点必须是对象(dict)，实际: {type(data).__name__}")
    return data


def _load_env_vars() -> Dict[str, Any]:
    """从环境变量加载配置。"""
    env_config: Dict[str, Any] = {}
    mapping = {
        "MAPPING_FILE": "mapping_file",
        "TARGET_FILE": "target_file",
        "INPUT_FILE": "input_file",
        "SAMPLE_ERRORS": "sample_errors",
        "LIMIT": "limit",
        "DRY_RUN": "dry_run",
        "VERBOSE": "verbose",
        "MACHINE_OUTPUT": "machine_output",
        "COLOR": "color",
        "LOG_LEVEL": "log_level",
        "OUTPUT_FILE": "output_file",
        "STRICT_MODE": "strict_mode",
        "SKIP_EMPTY_ROWS": "skip_empty_rows",
        "CSV_DELIMITER": "csv_delimiter",
        "CSV_ENCODING": "csv_encoding",
    }

    for env_key, config_key in mapping.items():
        full_key = ENV_PREFIX + env_key
        if full_key in os.environ:
            raw_value = os.environ[full_key]
            env_config[config_key] = _parse_env_value(config_key, raw_value)

    return env_config


def _parse_env_value(key: str, raw: str) -> Any:
    """将环境变量字符串值转为正确的类型。"""
    bool_keys = {
        "dry_run", "verbose", "machine_output",
        "color", "strict_mode", "skip_empty_rows",
    }
    int_keys = {"sample_errors", "limit"}

    if key in bool_keys:
        lower = raw.strip().lower()
        if lower in ("1", "true", "yes", "on", "是"):
            return True
        if lower in ("0", "false", "no", "off", "否"):
            return False
        raise ValueError(f"环境变量布尔值无效: {raw}")

    if key in int_keys:
        try:
            return int(raw) if raw else None
        except ValueError:
            raise ValueError(f"环境变量整数值无效: {raw}")

    return raw


def _deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    """深度合并两个字典，override 覆盖 base。"""
    result = dict(base)
    for key, value in override.items():
        if (
            key in result
            and isinstance(result[key], dict)
            and isinstance(value, dict)
        ):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def load_config(
    config_file: Optional[str] = None,
    cli_args: Optional[Dict[str, Any]] = None,
    start_dir: Optional[Path] = None,
) -> AppConfig:
    """加载配置，按优先级合并：

    CLI 参数 > 环境变量 > 配置文件 > 默认值

    Args:
        config_file: 显式指定的配置文件路径
        cli_args: 命令行参数字典
        start_dir: 开始搜索配置文件的目录

    Returns:
        合并后的 AppConfig 对象
    """
    cli_args = cli_args or {}

    file_config: Dict[str, Any] = {}

    resolved_config_path: Optional[Path] = None
    if config_file:
        resolved_config_path = Path(config_file).resolve()
    else:
        resolved_config_path = _find_config_file(start_dir)

    if resolved_config_path:
        file_config = _load_config_file(resolved_config_path)
        file_config.setdefault("config_file", str(resolved_config_path))

    env_config = _load_env_vars()
    merged = _deep_merge(file_config, env_config)

    config = AppConfig(**merged)

    if cli_args:
        config = config.merge_cli_args(cli_args)

    return config
