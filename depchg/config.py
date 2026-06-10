"""配置文件加载模块。

优先级: CLI参数 > 环境变量 > 配置文件 > 默认值
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from .exceptions import ConfigError


DEFAULT_CONFIG_FILENAMES = [
    ".depchg.yaml",
    ".depchg.yml",
    ".depchg.json",
    "pyproject.toml",
]


@dataclass
class AppConfig:
    """应用配置。"""
    before: Optional[str] = None
    after: Optional[str] = None
    output_format: str = "table"
    output_file: Optional[str] = None
    markdown: bool = False
    include_license: bool = True
    include_risk: bool = True
    include_changelog: bool = True
    only_direct: bool = False
    minimal_risk_level: str = "low"
    changelog: Optional[str] = None
    changelog_text: Optional[str] = None
    changelog_base_urls: Dict[str, str] = field(default_factory=dict)
    ignored_packages: List[str] = field(default_factory=list)
    license_allowlist: List[str] = field(default_factory=list)
    license_blocklist: List[str] = field(default_factory=list)
    log_level: str = "WARNING"
    log_json: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _load_yaml_config(path: Path) -> Dict[str, Any]:
    """加载 YAML 配置文件。"""
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if data is None:
        return {}
    if not isinstance(data, dict):
        raise ConfigError(
            f"配置文件 {path} 格式错误: 根节点必须是对象/字典",
            suggestion="请检查 YAML 格式，确保最外层是键值对结构。"
        )
    return data.get("depchg", data)


def _load_json_config(path: Path) -> Dict[str, Any]:
    """加载 JSON 配置文件。"""
    import json
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ConfigError(
            f"配置文件 {path} 格式错误: 根节点必须是对象/字典",
            suggestion="请检查 JSON 格式，确保最外层是 {} 对象。"
        )
    return data.get("depchg", data)


def _load_pyproject_config(path: Path) -> Dict[str, Any]:
    """从 pyproject.toml 加载配置。"""
    try:
        import tomllib
        with open(path, "rb") as f:
            data = tomllib.load(f)
    except ImportError:
        try:
            import tomli as tomllib
            with open(path, "rb") as f:
                data = tomllib.load(f)
        except ImportError:
            return {}

    return data.get("tool", {}).get("depchg", {})


def find_config_file(search_dir: Optional[str] = None) -> Optional[Path]:
    """在目录中搜索配置文件。"""
    base = Path(search_dir) if search_dir else Path.cwd()

    for filename in DEFAULT_CONFIG_FILENAMES:
        path = base / filename
        if path.exists() and path.is_file():
            return path

    for parent in base.parents:
        for filename in DEFAULT_CONFIG_FILENAMES:
            path = parent / filename
            if path.exists() and path.is_file():
                return path

    return None


def load_config_file(path: Optional[str] = None) -> Dict[str, Any]:
    """加载配置文件，返回配置字典。"""
    if path:
        config_path = Path(path)
        if not config_path.exists():
            raise ConfigError(
                f"指定的配置文件不存在: {path}",
                suggestion=f"请确认路径是否正确，当前工作目录: {os.getcwd()}"
            )
    else:
        config_path = find_config_file()
        if config_path is None:
            return {}

    suffix = config_path.suffix.lower()
    try:
        if suffix in (".yaml", ".yml"):
            return _load_yaml_config(config_path)
        elif suffix == ".json":
            return _load_json_config(config_path)
        elif suffix == ".toml":
            return _load_pyproject_config(config_path)
        else:
            raise ConfigError(
                f"不支持的配置文件格式: {suffix}",
                suggestion="支持的配置文件格式: .yaml, .yml, .json, .toml (pyproject.toml)"
            )
    except ConfigError:
        raise
    except Exception as e:
        raise ConfigError(
            f"读取配置文件 {config_path} 时出错: {type(e).__name__}: {e}",
            suggestion="请检查配置文件格式是否正确，文件是否可读。"
        ) from e


def _apply_env_overrides(config: AppConfig) -> None:
    """从环境变量覆盖配置。"""
    env_map = {
        "DEPCHG_BEFORE": ("before", str),
        "DEPCHG_AFTER": ("after", str),
        "DEPCHG_OUTPUT_FORMAT": ("output_format", str),
        "DEPCHG_OUTPUT_FILE": ("output_file", str),
        "DEPCHG_MARKDOWN": ("markdown", lambda v: v.lower() in ("1", "true", "yes")),
        "DEPCHG_INCLUDE_LICENSE": ("include_license", lambda v: v.lower() in ("1", "true", "yes")),
        "DEPCHG_INCLUDE_RISK": ("include_risk", lambda v: v.lower() in ("1", "true", "yes")),
        "DEPCHG_INCLUDE_CHANGELOG": ("include_changelog", lambda v: v.lower() in ("1", "true", "yes")),
        "DEPCHG_ONLY_DIRECT": ("only_direct", lambda v: v.lower() in ("1", "true", "yes")),
        "DEPCHG_MINIMAL_RISK_LEVEL": ("minimal_risk_level", str),
        "DEPCHG_CHANGELOG": ("changelog", str),
        "DEPCHG_LOG_LEVEL": ("log_level", str),
        "DEPCHG_LOG_JSON": ("log_json", lambda v: v.lower() in ("1", "true", "yes")),
    }

    for env_key, (attr, converter) in env_map.items():
        if env_key in os.environ:
            try:
                value = converter(os.environ[env_key])
                setattr(config, attr, value)
            except Exception as e:
                raise ConfigError(
                    f"环境变量 {env_key} 格式错误: {os.environ[env_key]}: {e}",
                    suggestion=f"请检查 {env_key} 的值格式是否正确。"
                )


def build_config(
    config_file: Optional[str] = None,
    cli_overrides: Optional[Dict[str, Any]] = None,
) -> AppConfig:
    """构建完整的配置对象，应用优先级规则。

    优先级: CLI参数 > 环境变量 > 配置文件 > 默认值
    """
    file_cfg = load_config_file(config_file)
    config = AppConfig()

    for key, value in file_cfg.items():
        if hasattr(config, key):
            setattr(config, key, value)

    _apply_env_overrides(config)

    if cli_overrides:
        for key, value in cli_overrides.items():
            if value is not None and hasattr(config, key):
                setattr(config, key, value)

    return config
