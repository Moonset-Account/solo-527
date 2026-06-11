"""Configuration management module.

Priority order (highest to lowest):
1. Command line arguments
2. Environment variables (BACKUP_CHECKER_*)
3. Configuration file (YAML/JSON)
4. Default values
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

import yaml

from .exceptions import ConfigError

DEFAULT_HASH_ALGORITHM = "sha256"
DEFAULT_RETENTION_DAYS = 30
DEFAULT_MANIFEST_FILENAME = "manifest.yaml"

SUPPORTED_HASH_ALGORITHMS = {"md5", "sha1", "sha224", "sha256", "sha384", "sha512"}

MANIFEST_SCHEMA = {
    "type": "object",
    "required": ["files"],
    "properties": {
        "version": {"type": ["string", "null"]},
        "created_at": {"type": ["string", "null"]},
        "backup_id": {"type": ["string", "null"]},
        "description": {"type": ["string", "null"]},
        "hash_algorithm": {"type": ["string", "null"]},
        "files": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["path", "hash"],
                "properties": {
                    "path": {"type": "string"},
                    "hash": {"type": "string"},
                    "size": {"type": ["integer", "null"], "minimum": 0},
                    "created_at": {"type": ["string", "null"]},
                    "modified_at": {"type": ["string", "null"]},
                    "permissions": {"type": ["string", "null"]},
                    "owner": {"type": ["string", "null"]},
                    "group": {"type": ["string", "null"]},
                },
            },
        },
    },
}


@dataclass
class NotificationConfig:
    """Notification configuration."""

    enabled: bool = False
    channels: list[str] = field(default_factory=list)
    webhook_url: str | None = None
    email_from: str | None = None
    email_to: list[str] = field(default_factory=list)
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_use_tls: bool = True
    notify_on: list[str] = field(default_factory=lambda: ["failure", "error"])


@dataclass
class Config:
    """Main configuration class."""

    manifest_path: str | None = None
    backup_dir: str | None = None
    hash_algorithm: str = DEFAULT_HASH_ALGORITHM
    retention_days: int = DEFAULT_RETENTION_DAYS
    dry_run: bool = False
    verbose: bool = False
    json_output: bool = False
    output_file: str | None = None
    check_integrity: bool = True
    check_missing: bool = True
    check_expired: bool = True
    fail_on_expired: bool = False
    fail_on_missing: bool = True
    fail_on_integrity: bool = True
    notification: NotificationConfig = field(default_factory=NotificationConfig)
    extra: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert configuration to dictionary."""
        data = asdict(self)
        return data

    def validate(self) -> None:
        """Validate configuration values."""
        if self.hash_algorithm not in SUPPORTED_HASH_ALGORITHMS:
            raise ConfigError(
                f"Unsupported hash algorithm: {self.hash_algorithm}. "
                f"Supported: {', '.join(sorted(SUPPORTED_HASH_ALGORITHMS))}",
                details={"algorithm": self.hash_algorithm, "supported": sorted(SUPPORTED_HASH_ALGORITHMS)},
            )

        if self.retention_days < 1:
            raise ConfigError(
                f"Retention days must be positive: {self.retention_days}",
                details={"retention_days": self.retention_days},
            )

        if self.manifest_path and not Path(self.manifest_path).exists():
            raise ConfigError(
                f"Manifest file not found: {self.manifest_path}",
                details={"manifest_path": self.manifest_path},
            )

        if self.backup_dir and not Path(self.backup_dir).is_dir():
            raise ConfigError(
                f"Backup directory not found: {self.backup_dir}",
                details={"backup_dir": self.backup_dir},
            )


def _load_yaml_file(path: Path) -> dict[str, Any]:
    """Load configuration from YAML file."""
    try:
        with open(path, encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return data or {}
    except yaml.YAMLError as e:
        raise ConfigError(f"Invalid YAML configuration file: {e}", details={"path": str(path)}) from e
    except OSError as e:
        raise ConfigError(f"Cannot read configuration file: {e}", details={"path": str(path)}) from e


def _load_json_file(path: Path) -> dict[str, Any]:
    """Load configuration from JSON file."""
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data or {}
    except json.JSONDecodeError as e:
        raise ConfigError(f"Invalid JSON configuration file: {e}", details={"path": str(path)}) from e
    except OSError as e:
        raise ConfigError(f"Cannot read configuration file: {e}", details={"path": str(path)}) from e


def load_config_file(path: str | Path) -> dict[str, Any]:
    """Load configuration from a file (YAML or JSON)."""
    path = Path(path)
    if not path.exists():
        raise ConfigError(f"Configuration file not found: {path}", details={"path": str(path)})

    suffix = path.suffix.lower()
    if suffix in (".yaml", ".yml"):
        return _load_yaml_file(path)
    elif suffix == ".json":
        return _load_json_file(path)
    else:
        raise ConfigError(
            f"Unsupported configuration file format: {suffix}. Use .yaml, .yml, or .json",
            details={"path": str(path), "supported": [".yaml", ".yml", ".json"]},
        )


def find_default_config_file() -> Path | None:
    """Find default configuration file in standard locations."""
    search_paths = [
        Path.cwd() / "backup-checker.yaml",
        Path.cwd() / "backup-checker.yml",
        Path.cwd() / "backup-checker.json",
        Path.cwd() / ".backup-checker.yaml",
        Path.cwd() / ".backup-checker.yml",
        Path.cwd() / ".backup-checker.json",
        Path.home() / ".config" / "backup-checker" / "config.yaml",
        Path.home() / ".config" / "backup-checker" / "config.yml",
        Path.home() / ".config" / "backup-checker" / "config.json",
        Path("/etc/backup-checker/config.yaml"),
        Path("/etc/backup-checker/config.yml"),
        Path("/etc/backup-checker/config.json"),
    ]
    for path in search_paths:
        if path.exists():
            return path
    return None


def load_env_vars() -> dict[str, Any]:
    """Load configuration from environment variables."""
    env_data: dict[str, Any] = {}
    prefix = "BACKUP_CHECKER_"

    env_map = {
        "MANIFEST": "manifest_path",
        "BACKUP_DIR": "backup_dir",
        "HASH_ALGORITHM": "hash_algorithm",
        "RETENTION_DAYS": "retention_days",
        "DRY_RUN": "dry_run",
        "VERBOSE": "verbose",
        "JSON_OUTPUT": "json_output",
        "OUTPUT_FILE": "output_file",
        "CHECK_INTEGRITY": "check_integrity",
        "CHECK_MISSING": "check_missing",
        "CHECK_EXPIRED": "check_expired",
        "FAIL_ON_EXPIRED": "fail_on_expired",
        "FAIL_ON_MISSING": "fail_on_missing",
        "FAIL_ON_INTEGRITY": "fail_on_integrity",
        "NOTIFY_ENABLED": ("notification", "enabled"),
        "NOTIFY_WEBHOOK": ("notification", "webhook_url"),
        "NOTIFY_EMAIL_FROM": ("notification", "email_from"),
        "NOTIFY_SMTP_HOST": ("notification", "smtp_host"),
        "NOTIFY_SMTP_PORT": ("notification", "smtp_port"),
    }

    for env_key, config_key in env_map.items():
        env_value = os.environ.get(prefix + env_key)
        if env_value is not None:
            if isinstance(config_key, tuple):
                if "notification" not in env_data:
                    env_data["notification"] = {}
                if env_key == "NOTIFY_ENABLED":
                    env_data["notification"][config_key[1]] = env_value.lower() in ("1", "true", "yes")
                elif env_key == "NOTIFY_SMTP_PORT":
                    env_data["notification"][config_key[1]] = int(env_value)
                else:
                    env_data["notification"][config_key[1]] = env_value
            else:
                if env_key in ("DRY_RUN", "VERBOSE", "JSON_OUTPUT", "CHECK_INTEGRITY", "CHECK_MISSING",
                               "CHECK_EXPIRED", "FAIL_ON_EXPIRED", "FAIL_ON_MISSING", "FAIL_ON_INTEGRITY"):
                    env_data[config_key] = env_value.lower() in ("1", "true", "yes")
                elif env_key in ("RETENTION_DAYS",):
                    env_data[config_key] = int(env_value)
                else:
                    env_data[config_key] = env_value

    notify_on = os.environ.get(prefix + "NOTIFY_ON")
    if notify_on:
        if "notification" not in env_data:
            env_data["notification"] = {}
        env_data["notification"]["notify_on"] = [s.strip() for s in notify_on.split(",")]

    notify_channels = os.environ.get(prefix + "NOTIFY_CHANNELS")
    if notify_channels:
        if "notification" not in env_data:
            env_data["notification"] = {}
        env_data["notification"]["channels"] = [s.strip() for s in notify_channels.split(",")]

    notify_email_to = os.environ.get(prefix + "NOTIFY_EMAIL_TO")
    if notify_email_to:
        if "notification" not in env_data:
            env_data["notification"] = {}
        env_data["notification"]["email_to"] = [s.strip() for s in notify_email_to.split(",")]

    return env_data


def _deep_merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    """Deep merge two dictionaries. Values in override take precedence."""
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def dict_to_config(data: dict[str, Any]) -> Config:
    """Convert dictionary to Config object."""
    notification_data = data.pop("notification", {})
    notification = NotificationConfig(**notification_data) if notification_data else NotificationConfig()
    return Config(notification=notification, **data)


def build_config(
    config_file: str | Path | None = None,
    cli_args: dict[str, Any] | None = None,
    logger: logging.Logger | None = None,
) -> Config:
    """Build configuration by merging all sources.

    Priority: CLI args > Environment vars > Config file > Defaults

    Args:
        config_file: Path to configuration file
        cli_args: Command line arguments dictionary
        logger: Logger instance for debugging

    Returns:
        Merged and validated Config object
    """
    result: dict[str, Any] = {}

    if config_file:
        if logger:
            logger.debug(f"Loading configuration from file: {config_file}")
        file_data = load_config_file(config_file)
        result = _deep_merge(result, file_data)
    else:
        default_config = find_default_config_file()
        if default_config:
            if logger:
                logger.debug(f"Using default configuration file: {default_config}")
            file_data = load_config_file(default_config)
            result = _deep_merge(result, file_data)

    env_data = load_env_vars()
    if env_data and logger:
        logger.debug(f"Loaded {len(env_data)} configuration values from environment")
    result = _deep_merge(result, env_data)

    if cli_args:
        filtered_args = {k: v for k, v in cli_args.items() if v is not None and k != "config"}
        if filtered_args and logger:
            logger.debug(f"Applying {len(filtered_args)} CLI arguments")
        result = _deep_merge(result, filtered_args)

    config = dict_to_config(result)
    config.validate()
    return config
