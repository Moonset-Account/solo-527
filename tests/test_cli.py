"""CLI接口单元测试。"""

import io
import json
import os
import sys
import tempfile

import pytest

from csv_validator.cli import main, build_parser
from csv_validator.errors import ExitCode


EXAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "examples")


class TestCLIParser:
    def test_parser_accepts_required_args(self):
        parser = build_parser()
        args = parser.parse_args(["--schema", "s.json", "data.csv"])
        assert args.schema == "s.json"
        assert args.input == "data.csv"

    def test_strict_flag(self):
        parser = build_parser()
        args = parser.parse_args(["--schema", "s.json", "--strict", "data.csv"])
        assert args.strict is True

    def test_format_flag(self):
        parser = build_parser()
        args = parser.parse_args(["--schema", "s.json", "-f", "json", "data.csv"])
        assert args.format == "json"


class TestCLIExecution:
    def test_valid_csv_exit_zero(self):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        csv_file = os.path.join(EXAMPLES_DIR, "orders_valid.csv")
        rc = main(["--schema", schema, "-f", "json", "-q", csv_file])
        assert rc == ExitCode.SUCCESS

    def test_invalid_csv_exit_one(self):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        csv_file = os.path.join(EXAMPLES_DIR, "orders_invalid.csv")
        rc = main(["--schema", schema, "-f", "json", "-q", csv_file])
        assert rc == ExitCode.VALIDATION_ERRORS

    def test_json_output_machine_readable(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        csv_file = os.path.join(EXAMPLES_DIR, "orders_valid.csv")
        rc = main(["--schema", schema, "-f", "json", csv_file])
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert data["valid"] is True
        assert "total_rows" in data
        assert "issues" in data
        assert rc == ExitCode.SUCCESS

    def test_dry_run_success(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        rc = main(["--schema", schema, "--dry-run"])
        captured = capsys.readouterr()
        assert rc == ExitCode.SUCCESS
        assert "Schema加载无误" in captured.out or "dry_run_ok" in captured.out

    def test_dry_run_json(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        rc = main(["--schema", schema, "--dry-run", "-f", "json"])
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert data["status"] == "dry_run_ok"
        assert "schema" in data
        assert rc == ExitCode.SUCCESS

    def test_missing_schema_exit_code(self):
        rc = main(["--schema", "/nonexistent.json", "-q", "dummy.csv"])
        assert rc == ExitCode.SCHEMA_ERROR

    def test_missing_input_file(self):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        rc = main(["--schema", schema, "-q", "/nonexistent.csv"])
        assert rc == ExitCode.IO_ERROR

    def test_report_option_outputs_json_file(self):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        csv_file = os.path.join(EXAMPLES_DIR, "orders_valid.csv")
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as fp:
            report_path = fp.name
        try:
            rc = main(["--schema", schema, "--report", report_path, csv_file])
            assert rc == ExitCode.SUCCESS
            with open(report_path, "r", encoding="utf-8") as fp:
                data = json.load(fp)
            assert data["valid"] is True
        finally:
            os.unlink(report_path)

    def test_strict_mode_detects_unknown(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        csv_file = os.path.join(EXAMPLES_DIR, "orders_invalid.csv")
        rc = main(["--schema", schema, "--strict", "-f", "json", csv_file])
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        codes = {i["code"] for i in data["issues"]}
        assert "UNKNOWN_COLUMN" in codes or rc == ExitCode.VALIDATION_ERRORS

    def test_fix_preview_in_report(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        csv_file = os.path.join(EXAMPLES_DIR, "orders_invalid.csv")
        rc = main(["--schema", schema, "--fix-preview", "-f", "json", csv_file])
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert "fix_preview" in data

    def test_stdin_input(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        csv_path = os.path.join(EXAMPLES_DIR, "orders_valid.csv")
        with open(csv_path, "r", encoding="utf-8") as fp:
            csv_content = fp.read()
        original_stdin = sys.stdin
        sys.stdin = io.StringIO(csv_content)
        try:
            rc = main(["--schema", schema, "-f", "json", "-"])
        finally:
            sys.stdin = original_stdin
        captured = capsys.readouterr()
        data = json.loads(captured.out)
        assert data["valid"] is True
        assert rc == ExitCode.SUCCESS

    def test_version_flag(self, capsys):
        with pytest.raises(SystemExit) as exc:
            main(["--version"])
        assert exc.value.code == 0

    def test_quiet_mode_on_success(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        csv_file = os.path.join(EXAMPLES_DIR, "orders_valid.csv")
        rc = main(["--schema", schema, "-q", "-f", "human", csv_file])
        captured = capsys.readouterr()
        assert captured.out == ""
        assert rc == ExitCode.SUCCESS
