"""Unit tests for config module."""

import json
import os
import tempfile
from pathlib import Path
from unittest import mock

import pytest
import yaml

from backup_checker.config import (
    SUPPORTED_HASH_ALGORITHMS,
    Config,
    NotificationConfig,
    build_config,
    dict_to_config,
    load_config_file,
    load_env_vars,
)
from backup_checker.exceptions import ConfigError


@pytest.fixture
def temp_dir():
    """Create a temporary directory for testing."""
    with tempfile.TemporaryDirectory() as td:
        yield Path(td)


@pytest.fixture
def sample_config_dict():
    """Return a sample configuration dictionary."""
    return {
        "manifest_path": "/path/to/manifest.yaml",
        "backup_dir": "/path/to/backup",
        "hash_algorithm": "sha256",
        "retention_days": 30,
        "check_integrity": True,
        "check_missing": True,
        "check_expired": True,
        "fail_on_expired": False,
        "notification": {
            "enabled": True,
            "channels": ["webhook", "email"],
            "webhook_url": "https://example.com/webhook",
            "notify_on": ["failure", "error"],
        },
    }


class TestConfig:
    """Test Config dataclass."""

    def test_default_values(self):
        config = Config()
        assert config.hash_algorithm == "sha256"
        assert config.retention_days == 30
        assert config.dry_run is False
        assert config.check_integrity is True
        assert config.check_missing is True
        assert config.check_expired is True
        assert config.fail_on_expired is False

    def test_to_dict(self, sample_config_dict):
        config = dict_to_config(sample_config_dict)
        data = config.to_dict()
        assert data["manifest_path"] == "/path/to/manifest.yaml"
        assert data["hash_algorithm"] == "sha256"
        assert data["retention_days"] == 30
        assert data["notification"]["enabled"] is True

    def test_validate_valid_config(self, temp_dir):
        manifest_file = temp_dir / "manifest.yaml"
        manifest_file.write_text("files: []")
        backup_dir = temp_dir / "backup"
        backup_dir.mkdir()

        config = Config(
            manifest_path=str(manifest_file),
            backup_dir=str(backup_dir),
            hash_algorithm="sha256",
            retention_days=30,
        )
        config.validate()

    def test_validate_invalid_hash_algorithm(self):
        config = Config(hash_algorithm="invalid")
        with pytest.raises(ConfigError) as exc_info:
            config.validate()
        assert "Unsupported hash algorithm" in str(exc_info.value)

    def test_validate_negative_retention(self):
        config = Config(retention_days=-1)
        with pytest.raises(ConfigError) as exc_info:
            config.validate()
        assert "positive" in str(exc_info.value)

    def test_validate_missing_manifest(self, temp_dir):
        config = Config(manifest_path=str(temp_dir / "nonexistent.yaml"))
        with pytest.raises(ConfigError) as exc_info:
            config.validate()
        assert "not found" in str(exc_info.value)

    def test_validate_invalid_backup_dir(self, temp_dir):
        config = Config(backup_dir=str(temp_dir / "nonexistent"))
        with pytest.raises(ConfigError) as exc_info:
            config.validate()
        assert "not found" in str(exc_info.value)


class TestNotificationConfig:
    """Test NotificationConfig dataclass."""

    def test_default_values(self):
        nc = NotificationConfig()
        assert nc.enabled is False
        assert nc.channels == []
        assert nc.notify_on == ["failure", "error"]
        assert nc.smtp_port == 587
        assert nc.smtp_use_tls is True


class TestLoadConfigFile:
    """Test loading configuration from files."""

    def test_load_yaml_config(self, temp_dir):
        config_data = {"hash_algorithm": "sha512", "retention_days": 60}
        config_file = temp_dir / "config.yaml"
        config_file.write_text(yaml.dump(config_data))

        loaded = load_config_file(config_file)
        assert loaded["hash_algorithm"] == "sha512"
        assert loaded["retention_days"] == 60

    def test_load_json_config(self, temp_dir):
        config_data = {"hash_algorithm": "md5", "retention_days": 15}
        config_file = temp_dir / "config.json"
        config_file.write_text(json.dumps(config_data))

        loaded = load_config_file(config_file)
        assert loaded["hash_algorithm"] == "md5"
        assert loaded["retention_days"] == 15

    def test_load_invalid_yaml(self, temp_dir):
        config_file = temp_dir / "config.yaml"
        config_file.write_text("invalid: [yaml: [")
        with pytest.raises(ConfigError):
            load_config_file(config_file)

    def test_load_invalid_json(self, temp_dir):
        config_file = temp_dir / "config.json"
        config_file.write_text("{invalid json}")
        with pytest.raises(ConfigError):
            load_config_file(config_file)

    def test_load_unsupported_format(self, temp_dir):
        config_file = temp_dir / "config.txt"
        config_file.write_text("some text")
        with pytest.raises(ConfigError) as exc_info:
            load_config_file(config_file)
        assert "Unsupported configuration file format" in str(exc_info.value)

    def test_load_nonexistent_file(self, temp_dir):
        with pytest.raises(ConfigError):
            load_config_file(temp_dir / "nonexistent.yaml")


class TestEnvVars:
    """Test loading configuration from environment variables."""

    def test_load_env_vars(self):
        env_vars = {
            "BACKUP_CHECKER_MANIFEST": "/env/manifest.yaml",
            "BACKUP_CHECKER_BACKUP_DIR": "/env/backup",
            "BACKUP_CHECKER_HASH_ALGORITHM": "sha512",
            "BACKUP_CHECKER_RETENTION_DAYS": "60",
            "BACKUP_CHECKER_DRY_RUN": "true",
            "BACKUP_CHECKER_VERBOSE": "1",
            "BACKUP_CHECKER_JSON_OUTPUT": "yes",
            "BACKUP_CHECKER_FAIL_ON_EXPIRED": "true",
        }
        with mock.patch.dict(os.environ, env_vars, clear=True):
            loaded = load_env_vars()
            assert loaded["manifest_path"] == "/env/manifest.yaml"
            assert loaded["backup_dir"] == "/env/backup"
            assert loaded["hash_algorithm"] == "sha512"
            assert loaded["retention_days"] == 60
            assert loaded["dry_run"] is True
            assert loaded["verbose"] is True
            assert loaded["json_output"] is True
            assert loaded["fail_on_expired"] is True

    def test_load_env_notification_config(self):
        env_vars = {
            "BACKUP_CHECKER_NOTIFY_ENABLED": "true",
            "BACKUP_CHECKER_NOTIFY_WEBHOOK": "https://env.webhook",
            "BACKUP_CHECKER_NOTIFY_CHANNELS": "webhook,email",
            "BACKUP_CHECKER_NOTIFY_ON": "failure,expired,missing",
        }
        with mock.patch.dict(os.environ, env_vars, clear=True):
            loaded = load_env_vars()
            assert loaded["notification"]["enabled"] is True
            assert loaded["notification"]["webhook_url"] == "https://env.webhook"
            assert loaded["notification"]["channels"] == ["webhook", "email"]
            assert loaded["notification"]["notify_on"] == ["failure", "expired", "missing"]

    def test_load_env_empty(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            loaded = load_env_vars()
            assert loaded == {}


class TestBuildConfig:
    """Test building configuration with priority."""

    def test_config_priority_cli_overrides_all(self, temp_dir):
        manifest_file = temp_dir / "manifest.yaml"
        manifest_file.write_text("files: []")
        backup_dir = temp_dir / "backup"
        backup_dir.mkdir()

        config_file = temp_dir / "config.yaml"
        config_file.write_text(yaml.dump({
            "manifest_path": str(manifest_file),
            "backup_dir": str(backup_dir),
            "hash_algorithm": "md5",
        }))

        env_vars = {
            "BACKUP_CHECKER_HASH_ALGORITHM": "sha1",
        }

        cli_args = {"hash_algorithm": "sha512"}

        with mock.patch.dict(os.environ, env_vars):
            config = build_config(config_file, cli_args)
            assert config.hash_algorithm == "sha512"

    def test_config_priority_env_overrides_file(self, temp_dir):
        manifest_file = temp_dir / "manifest.yaml"
        manifest_file.write_text("files: []")
        backup_dir = temp_dir / "backup"
        backup_dir.mkdir()

        config_file = temp_dir / "config.yaml"
        config_file.write_text(yaml.dump({
            "manifest_path": str(manifest_file),
            "backup_dir": str(backup_dir),
            "hash_algorithm": "md5",
        }))

        env_vars = {
            "BACKUP_CHECKER_HASH_ALGORITHM": "sha1",
        }

        with mock.patch.dict(os.environ, env_vars):
            config = build_config(config_file, {})
            assert config.hash_algorithm == "sha1"

    def test_config_uses_file_values(self, temp_dir):
        manifest_file = temp_dir / "manifest.yaml"
        manifest_file.write_text("files: []")
        backup_dir = temp_dir / "backup"
        backup_dir.mkdir()

        config_file = temp_dir / "config.yaml"
        config_file.write_text(yaml.dump({
            "manifest_path": str(manifest_file),
            "backup_dir": str(backup_dir),
            "retention_days": 90,
            "fail_on_expired": True,
        }))

        config = build_config(config_file, {})
        assert config.retention_days == 90
        assert config.fail_on_expired is True


class TestSupportedAlgorithms:
    """Test supported hash algorithms."""

    def test_supported_algorithms(self):
        expected = {"md5", "sha1", "sha224", "sha256", "sha384", "sha512"}
        assert expected == SUPPORTED_HASH_ALGORITHMS

    @pytest.mark.parametrize("algo", ["md5", "sha1", "sha256", "sha512"])
    def test_valid_algorithms(self, algo):
        assert algo in SUPPORTED_HASH_ALGORITHMS

    @pytest.mark.parametrize("algo", ["invalid", "crc32", "SHA256", ""])
    def test_invalid_algorithms(self, algo):
        assert algo not in SUPPORTED_HASH_ALGORITHMS
