"""测试配置加载模块 config.py。"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest
import yaml

from import_dryrun.config import (
    AppConfig,
    _find_config_file,
    _load_config_file,
    _load_env_vars,
    _parse_env_value,
    load_config,
)


class TestParseEnvValue:
    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("true", True), ("1", True), ("yes", True), ("on", True), ("是", True),
            ("false", False), ("0", False), ("no", False), ("off", False), ("否", False),
        ],
    )
    def test_bool_values(self, raw, expected):
        assert _parse_env_value("dry_run", raw) is expected

    def test_bool_invalid_raises(self):
        with pytest.raises(ValueError):
            _parse_env_value("dry_run", "notabool")

    def test_int_values(self):
        assert _parse_env_value("limit", "123") == 123
        assert _parse_env_value("limit", "") is None

    def test_int_invalid_raises(self):
        with pytest.raises(ValueError):
            _parse_env_value("limit", "abc")

    def test_string_passthrough(self):
        assert _parse_env_value("mapping_file", "/path/file.yaml") == "/path/file.yaml"


class TestLoadEnvVars:
    def test_all_env_keys_mapped(self, clean_env, monkeypatch):
        monkeypatch.setenv("IMPORTDRYRUN_MAPPING_FILE", "m.yaml")
        monkeypatch.setenv("IMPORTDRYRUN_TARGET_FILE", "t.yaml")
        monkeypatch.setenv("IMPORTDRYRUN_INPUT_FILE", "i.csv")
        monkeypatch.setenv("IMPORTDRYRUN_SAMPLE_ERRORS", "3")
        monkeypatch.setenv("IMPORTDRYRUN_LIMIT", "50")
        monkeypatch.setenv("IMPORTDRYRUN_DRY_RUN", "true")
        monkeypatch.setenv("IMPORTDRYRUN_VERBOSE", "1")
        monkeypatch.setenv("IMPORTDRYRUN_MACHINE_OUTPUT", "yes")
        monkeypatch.setenv("IMPORTDRYRUN_COLOR", "false")
        monkeypatch.setenv("IMPORTDRYRUN_LOG_LEVEL", "DEBUG")
        monkeypatch.setenv("IMPORTDRYRUN_OUTPUT_FILE", "out.txt")
        monkeypatch.setenv("IMPORTDRYRUN_STRICT_MODE", "true")
        monkeypatch.setenv("IMPORTDRYRUN_SKIP_EMPTY_ROWS", "0")
        monkeypatch.setenv("IMPORTDRYRUN_CSV_DELIMITER", ";")
        monkeypatch.setenv("IMPORTDRYRUN_CSV_ENCODING", "gbk")

        result = _load_env_vars()
        assert result["mapping_file"] == "m.yaml"
        assert result["target_file"] == "t.yaml"
        assert result["input_file"] == "i.csv"
        assert result["sample_errors"] == 3
        assert result["limit"] == 50
        assert result["dry_run"] is True
        assert result["verbose"] is True
        assert result["machine_output"] is True
        assert result["color"] is False
        assert result["log_level"] == "DEBUG"
        assert result["output_file"] == "out.txt"
        assert result["strict_mode"] is True
        assert result["skip_empty_rows"] is False
        assert result["csv_delimiter"] == ";"
        assert result["csv_encoding"] == "gbk"


class TestConfigFileLoad:
    def test_load_yaml(self, tmp_path: Path):
        p = tmp_path / "cfg.yaml"
        with open(p, "w", encoding="utf-8") as f:
            yaml.safe_dump({"sample_errors": 9, "verbose": True}, f)
        data = _load_config_file(p)
        assert data["sample_errors"] == 9
        assert data["verbose"] is True

    def test_load_json(self, tmp_path: Path):
        p = tmp_path / "cfg.json"
        with open(p, "w", encoding="utf-8") as f:
            json.dump({"limit": 100, "strict_mode": False}, f)
        data = _load_config_file(p)
        assert data["limit"] == 100
        assert data["strict_mode"] is False

    def test_missing_file_raises(self, tmp_path: Path):
        with pytest.raises(FileNotFoundError):
            _load_config_file(tmp_path / "not_exists.yaml")

    def test_unsupported_format_raises(self, tmp_path: Path):
        p = tmp_path / "cfg.txt"
        p.write_text("hello")
        with pytest.raises(ValueError, match="不支持的配置文件格式"):
            _load_config_file(p)

    def test_empty_yaml_returns_empty_dict(self, tmp_path: Path):
        p = tmp_path / "empty.yaml"
        p.write_text("")
        assert _load_config_file(p) == {}

    def test_root_not_dict_raises(self, tmp_path: Path):
        p = tmp_path / "list.yaml"
        p.write_text("- 1\n- 2")
        with pytest.raises(ValueError):
            _load_config_file(p)


class TestFindConfigFile:
    def test_finds_in_current_dir(self, tmp_path: Path, monkeypatch):
        p = tmp_path / "import-dryrun.yaml"
        p.write_text("sample_errors: 5")
        monkeypatch.chdir(tmp_path)
        assert _find_config_file(tmp_path) == p

    def test_finds_dot_file(self, tmp_path: Path, monkeypatch):
        p = tmp_path / ".import-dryrun.json"
        p.write_text("{}")
        monkeypatch.chdir(tmp_path)
        assert _find_config_file(tmp_path) == p

    def test_finds_in_parent_dir(self, tmp_path: Path, monkeypatch):
        p = tmp_path / "import-dryrun.yml"
        p.write_text("{}")
        sub = tmp_path / "a" / "b"
        sub.mkdir(parents=True)
        assert _find_config_file(sub) == p

    def test_none_when_not_found(self, tmp_path: Path):
        assert _find_config_file(tmp_path) is None


class TestLoadConfigIntegration:
    def test_defaults(self, clean_env, tmp_path: Path, monkeypatch):
        monkeypatch.chdir(tmp_path)
        cfg = load_config()
        assert cfg.dry_run is True
        assert cfg.sample_errors == 5
        assert cfg.limit is None
        assert cfg.verbose is False
        assert cfg.strict_mode is False

    def test_cli_overrides_everything(self, clean_env, config_file_complete: Path, monkeypatch):
        monkeypatch.setenv("IMPORTDRYRUN_SAMPLE_ERRORS", "7")
        monkeypatch.setenv("IMPORTDRYRUN_VERBOSE", "true")
        cfg = load_config(
            config_file=str(config_file_complete),
            cli_args={"sample_errors": 99, "verbose": False, "limit": 5},
        )
        assert cfg.sample_errors == 99
        assert cfg.verbose is False
        assert cfg.limit == 5
        assert cfg.dry_run is True

    def test_env_overrides_config_file(self, clean_env, config_file_complete: Path, monkeypatch):
        monkeypatch.setenv("IMPORTDRYRUN_SAMPLE_ERRORS", "33")
        cfg = load_config(config_file=str(config_file_complete))
        assert cfg.sample_errors == 33
        assert cfg.strict_mode is False

    def test_explicit_config_file(self, clean_env, config_file_complete: Path, monkeypatch):
        monkeypatch.chdir(Path(config_file_complete).parent.parent)
        cfg = load_config(config_file=str(config_file_complete))
        assert cfg.limit == 100
        assert cfg.config_file is not None


class TestMergeCliArgs:
    def test_merge_overrides_only_non_none(self):
        cfg = AppConfig(sample_errors=5, limit=100, verbose=False)
        merged = cfg.merge_cli_args({"sample_errors": None, "verbose": True, "new_key": "ignored"})
        assert merged.sample_errors == 5
        assert merged.verbose is True
        assert merged.limit == 100
