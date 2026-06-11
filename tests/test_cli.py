"""测试命令行入口 cli.py。"""

from __future__ import annotations

from pathlib import Path

import pytest
from click.testing import CliRunner

from import_dryrun import __version__
from import_dryrun.cli import main


class TestCliHelp:
    def test_help(self):
        runner = CliRunner()
        result = runner.invoke(main, ["--help"])
        assert result.exit_code == 0
        assert "数据导入 Dry-Run" in result.output

    def test_version(self):
        runner = CliRunner()
        r = runner.invoke(main, ["--version"])
        assert r.exit_code == 0
        assert __version__ in r.output


class TestCliRequiredArgs:
    def test_no_args_exits_2(self):
        runner = CliRunner()
        r = runner.invoke(main, [])
        assert r.exit_code == 2

    def test_only_mapping_no_input_exits_2(self, mapping_users_file: Path):
        runner = CliRunner()
        r = runner.invoke(main, ["-m", str(mapping_users_file)])
        assert r.exit_code == 2
        assert "--input" in r.output.lower() or "输入" in r.output


class TestCliRun:
    def test_valid_csv(self, target_users_file: Path, users_valid_csv: Path):
        runner = CliRunner()
        r = runner.invoke(main, [
            "-t", str(target_users_file),
            "-i", str(users_valid_csv),
            "--no-color",
        ])
        assert r.exit_code == 0 or r.exit_code == 0
        out = r.output
        assert "处理成功" in out or "processed" in out or "5" in out

    def test_valid_csv_mapping(self, mapping_users_file: Path, users_valid_csv: Path):
        runner = CliRunner()
        r = runner.invoke(main, [
            "-m", str(mapping_users_file),
            "-i", str(users_valid_csv),
            "--no-color",
        ])
        assert r.exit_code == 0

    def test_errors_csv_exit_1(self, target_users_file: Path, users_with_errors_csv: Path):
        runner = CliRunner()
        r = runner.invoke(main, [
            "-t", str(target_users_file),
            "-i", str(users_with_errors_csv),
            "--no-color",
            "--sample-errors", "2",
        ])
        assert r.exit_code == 1

    def test_machine_json_output(self, target_users_file: Path, users_valid_csv: Path):
        runner = CliRunner()
        r = runner.invoke(main, [
            "-t", str(target_users_file),
            "-i", str(users_valid_csv),
            "--json",
        ])
        import json
        data = json.loads(r.output)
        assert "summary" in data
        assert data["summary"]["total_records"] == 5

    def test_limit_option(self, target_users_file: Path, users_valid_csv: Path):
        runner = CliRunner()
        r = runner.invoke(main, [
            "-t", str(target_users_file),
            "-i", str(users_valid_csv),
            "-l", "3",
            "--no-color",
        ])
        assert "3" in r.output

    def test_output_file(self, tmp_path: Path, target_users_file: Path, users_valid_csv: Path):
        out_file = tmp_path / "report.txt"
        runner = CliRunner()
        r = runner.invoke(main, [
            "-t", str(target_users_file),
            "-i", str(users_valid_csv),
            "-o", str(out_file),
            "--no-color",
        ])
        assert r.exit_code == 0
        assert out_file.exists()

    def test_strict_mode(self, target_users_file: Path, users_with_errors_csv: Path):
        runner = CliRunner()
        r = runner.invoke(main, [
            "-t", str(target_users_file),
            "-i", str(users_with_errors_csv),
            "--strict",
            "--no-color",
            "--sample-errors", "1",
        ])
        assert r.exit_code == 1


class TestCliEnvConfigFile:
    def test_config_file(self, config_file_complete: Path, users_valid_csv: Path, tmp_path: Path,
                        monkeypatch):
        import yaml
        monkeypatch.chdir(tmp_path)
        with open(config_file_complete, encoding="utf-8") as f:
            cfg_data = yaml.safe_load(f)
        cfg_data.pop("input_file", None)
        p = tmp_path / "import-dryrun.yaml"
        with open(p, "w", encoding="utf-8") as f:
            yaml.safe_dump(cfg_data, f, allow_unicode=True)
        runner = CliRunner()
        r = runner.invoke(main, [
            "-i", str(users_valid_csv),
            "--no-color",
        ])
        assert r.exit_code == 0


class TestCliErrorHandling:
    def test_nonexistent_input(self, target_users_file: Path, tmp_path: Path):
        runner = CliRunner()
        r = runner.invoke(main, [
            "-t", str(target_users_file),
            "-i", str(tmp_path / "nope.csv"),
        ])
        assert r.exit_code == 2
