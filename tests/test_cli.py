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
        assert rc == ExitCode.VALIDATION_ERRORS
        assert data["valid"] is False
        codes = {i["code"] for i in data["issues"]}
        assert "UNKNOWN_COLUMN" in codes
        unknown_issues = [i for i in data["issues"] if i["code"] == "UNKNOWN_COLUMN"]
        assert len(unknown_issues) > 0
        assert all(i["severity"] == "error" for i in unknown_issues)

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

    def test_help_flag_outputs_help_text(self, capsys):
        rc = main(["--help"])
        assert rc == ExitCode.SUCCESS
        captured = capsys.readouterr()
        assert "usage:" in captured.out
        assert "csv-validator" in captured.out

    def test_help_flag_short_form(self, capsys):
        rc = main(["-h"])
        assert rc == ExitCode.SUCCESS
        captured = capsys.readouterr()
        assert "usage:" in captured.out

    def test_version_flag(self, capsys):
        rc = main(["--version"])
        assert rc == ExitCode.SUCCESS
        captured = capsys.readouterr()
        assert "csv-validator" in captured.out
        assert "1.0.0" in captured.out

    def test_missing_schema_arg_returns_cli_error_json(self, capsys):
        rc = main(["data.csv"])
        assert rc == ExitCode.CLI_ERROR
        captured = capsys.readouterr()
        assert captured.out == ""
        err = json.loads(captured.err)
        assert set(err.keys()) == {"status", "error_type", "message", "exit_code"}
        assert err["status"] == "error"
        assert err["exit_code"] == ExitCode.CLI_ERROR

    def test_invalid_format_arg_returns_cli_error_json(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        rc = main(["--schema", schema, "-f", "xml", "data.csv"])
        assert rc == ExitCode.CLI_ERROR
        captured = capsys.readouterr()
        err = json.loads(captured.err)
        assert err["status"] == "error"
        assert err["exit_code"] == ExitCode.CLI_ERROR

    def test_unknown_argument_returns_cli_error_json(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        rc = main(["--schema", schema, "--unknown-flag", "data.csv"])
        assert rc == ExitCode.CLI_ERROR
        captured = capsys.readouterr()
        err = json.loads(captured.err)
        assert err["status"] == "error"
        assert err["exit_code"] == ExitCode.CLI_ERROR

    def test_missing_option_value_returns_cli_error_json(self, capsys):
        rc = main(["--schema"])
        assert rc == ExitCode.CLI_ERROR
        captured = capsys.readouterr()
        err = json.loads(captured.err)
        assert err["status"] == "error"
        assert err["exit_code"] == ExitCode.CLI_ERROR

    def test_argparse_error_json_output_stable_fields(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        rc = main(["--schema", schema, "-f", "json", "--format", "xml", "data.csv"])
        assert rc == ExitCode.CLI_ERROR
        captured = capsys.readouterr()
        assert captured.out == ""
        err = json.loads(captured.err)
        assert set(err.keys()) == {"status", "error_type", "message", "exit_code"}
        assert err["status"] == "error"
        assert err["error_type"] == "ArgumentError"
        assert err["exit_code"] == ExitCode.CLI_ERROR
        assert isinstance(err["message"], str)
        assert len(err["message"]) > 0

    def test_argparse_error_missing_schema_json_output(self, capsys):
        rc = main(["-f", "json", "data.csv"])
        assert rc == ExitCode.CLI_ERROR
        captured = capsys.readouterr()
        err = json.loads(captured.err)
        assert err["exit_code"] == ExitCode.CLI_ERROR
        assert "schema" in err["message"].lower() or "required" in err["message"].lower()

    def test_argparse_error_unknown_arg_json_output(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        rc = main(["--schema", schema, "-f", "json", "--bogus", "data.csv"])
        assert rc == ExitCode.CLI_ERROR
        captured = capsys.readouterr()
        err = json.loads(captured.err)
        assert err["status"] == "error"
        assert err["exit_code"] == ExitCode.CLI_ERROR

    def test_argparse_error_missing_value_json_output(self, capsys):
        rc = main(["-f", "json", "--schema"])
        assert rc == ExitCode.CLI_ERROR
        captured = capsys.readouterr()
        err = json.loads(captured.err)
        assert err["status"] == "error"
        assert err["exit_code"] == ExitCode.CLI_ERROR

    def test_argparse_error_with_report_flag_json_output(self, capsys):
        rc = main(["--report", "out.json", "--format", "xml", "data.csv"])
        assert rc == ExitCode.CLI_ERROR
        captured = capsys.readouterr()
        err = json.loads(captured.err)
        assert err["exit_code"] == ExitCode.CLI_ERROR

    def test_argparse_error_with_explicit_f_human_outputs_json(self, capsys):
        rc = main(["-f", "human", "data.csv"])
        assert rc == ExitCode.CLI_ERROR
        captured = capsys.readouterr()
        assert captured.out == ""
        err = json.loads(captured.err)
        assert set(err.keys()) == {"status", "error_type", "message", "exit_code"}
        assert err["status"] == "error"
        assert err["exit_code"] == ExitCode.CLI_ERROR

    def test_argparse_error_with_explicit_format_human_outputs_json(self, capsys):
        rc = main(["--format=human", "data.csv"])
        assert rc == ExitCode.CLI_ERROR
        captured = capsys.readouterr()
        err = json.loads(captured.err)
        assert err["status"] == "error"
        assert err["exit_code"] == ExitCode.CLI_ERROR

    def test_detect_output_format_helper(self):
        from csv_validator.cli import _detect_output_format
        assert _detect_output_format(["data.csv"]) == "json"
        assert _detect_output_format(["-f", "json", "data.csv"]) == "json"
        assert _detect_output_format(["-f", "human", "data.csv"]) == "json"
        assert _detect_output_format(["--format=human", "data.csv"]) == "json"
        assert _detect_output_format(["-f", "xml", "data.csv"]) == "json"
        assert _detect_output_format(["--report", "out.json"]) == "json"
        assert _detect_output_format(["--schema"]) == "json"
        assert _detect_output_format(None) == "json"

    def test_quiet_mode_on_success(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        csv_file = os.path.join(EXAMPLES_DIR, "orders_valid.csv")
        rc = main(["--schema", schema, "-q", "-f", "human", csv_file])
        captured = capsys.readouterr()
        assert captured.out == ""
        assert rc == ExitCode.SUCCESS

    def test_human_format_report_works_for_validation(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        csv_file = os.path.join(EXAMPLES_DIR, "orders_valid.csv")
        rc = main(["--schema", schema, "-f", "human", csv_file])
        assert rc == ExitCode.SUCCESS
        captured = capsys.readouterr()
        assert "CSV校验结果" in captured.out
        assert "通过" in captured.out
        assert "总行数" in captured.out

    def test_human_format_report_works_for_validation_errors(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        csv_file = os.path.join(EXAMPLES_DIR, "orders_invalid.csv")
        rc = main(["--schema", schema, "-f", "human", csv_file])
        assert rc == ExitCode.VALIDATION_ERRORS
        captured = capsys.readouterr()
        assert "CSV校验结果" in captured.out
        assert "失败" in captured.out
        assert "问题明细" in captured.out

    def test_format_human_short_flag_for_validation(self, capsys):
        schema = os.path.join(EXAMPLES_DIR, "schema_orders.json")
        csv_file = os.path.join(EXAMPLES_DIR, "orders_valid.csv")
        rc = main(["--schema", schema, "--format=human", csv_file])
        assert rc == ExitCode.SUCCESS
        captured = capsys.readouterr()
        assert "CSV校验结果" in captured.out

    def test_strict_mode_with_unknown_column_only(self, capsys):
        schema_dict = {
            "fields": [
                {"name": "id", "type": "integer", "required": True},
                {"name": "name", "type": "string"},
            ]
        }
        import tempfile
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as sfp:
            json.dump(schema_dict, sfp)
            schema_path = sfp.name
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".csv", delete=False, encoding="utf-8"
        ) as cfp:
            cfp.write("id,name,extra_col\n1,Alice,foo\n")
            csv_path = cfp.name
        try:
            rc = main(["--schema", schema_path, "--strict", "-f", "json", csv_path])
            assert rc == ExitCode.VALIDATION_ERRORS
            captured = capsys.readouterr()
            data = json.loads(captured.out)
            assert data["valid"] is False
            assert data["error_count"] == 1
            assert data["warning_count"] == 0
            assert data["issues"][0]["code"] == "UNKNOWN_COLUMN"
            assert data["issues"][0]["severity"] == "error"
        finally:
            os.unlink(schema_path)
            os.unlink(csv_path)
