"""测试报告生成器 report.py。"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from import_dryrun.config import AppConfig
from import_dryrun.engine import DryRunEngine
from import_dryrun.models import TargetSchema
from import_dryrun.report import ReportGenerator


def _cfg(**overrides) -> AppConfig:
    d = dict(
        mapping_file=None, target_file=None, input_file=None,
        dry_run=True, sample_errors=5, strict_mode=False,
        skip_empty_rows=True, verbose=False, machine_output=False,
        color=False, log_level="INFO", csv_delimiter=",", csv_encoding="utf-8",
    )
    d.update(overrides)
    return AppConfig(**d)


def _run(target_schema_users, rows):
    schema = TargetSchema(**target_schema_users)
    cfg = _cfg()
    engine = DryRunEngine(cfg, schema=schema)
    return engine.run(source_rows=rows), cfg


class TestReportPlain:
    def test_plain_no_errors(self, target_schema_users, sample_source_rows):
        result, cfg = _run(target_schema_users, sample_source_rows)
        reporter = ReportGenerator(cfg)
        text = reporter.generate(result)
        assert "总记录数" in text
        assert "处理成功: 2" in text
        assert "失败: 0" in text

    def test_plain_with_errors(self, target_schema_users, sample_source_rows_errors):
        result, cfg = _run(target_schema_users, sample_source_rows_errors)
        reporter = ReportGenerator(cfg)
        text = reporter.generate(result)
        assert "错误分组统计" in text
        assert "修复建议" in text


class TestReportJson:
    def test_json_structure(self, target_schema_users, sample_source_rows):
        result, _ = _run(target_schema_users, sample_source_rows)
        cfg = _cfg(machine_output=True)
        reporter = ReportGenerator(cfg)
        text = reporter.generate(result)
        data = json.loads(text)
        assert "summary" in data
        assert "error_groups" in data
        assert "repair_summary" in data
        assert "field_actions" in data
        assert data["summary"]["total_records"] == 2
        assert data["summary"]["processed_count"] == 2

    def test_json_verbose_has_records(self, target_schema_users, sample_source_rows):
        result, _ = _run(target_schema_users, sample_source_rows)
        cfg = _cfg(machine_output=True, verbose=True)
        reporter = ReportGenerator(cfg)
        data = json.loads(reporter.generate(result))
        assert "records" in data
        assert len(data["records"]) == 2


class TestReportColored:
    def test_color_rich(self, target_schema_users, sample_source_rows):
        result, _ = _run(target_schema_users, sample_source_rows)
        cfg = _cfg(color=True)
        reporter = ReportGenerator(cfg)
        text = reporter.generate(result)
        assert len(text) > 0

    def test_verbose_colored(self, target_schema_users, sample_source_rows_errors):
        result, _ = _run(target_schema_users, sample_source_rows_errors)
        cfg = _cfg(color=True, verbose=True)
        reporter = ReportGenerator(cfg)
        text = reporter.generate(result)
        assert "行 #" in text


class TestReportWrite:
    def test_write_to_file(self, tmp_path: Path, target_schema_users, sample_source_rows):
        result, cfg = _run(target_schema_users, sample_source_rows)
        reporter = ReportGenerator(cfg)
        out = tmp_path / "sub" / "report.txt"
        reporter.write_to_file(result, str(out))
        assert out.exists()
        content = out.read_text(encoding="utf-8")
        assert "总记录数" in content or "summary" in content or "处理" in content
