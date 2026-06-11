"""测试模拟导入引擎 engine.py。"""

from __future__ import annotations

from pathlib import Path

import pytest

from import_dryrun.config import AppConfig
from import_dryrun.engine import DryRunEngine
from import_dryrun.models import ErrorCategory


def _cfg(**overrides) -> AppConfig:
    d = dict(
        mapping_file=None, target_file=None, input_file=None,
        dry_run=True, sample_errors=5, strict_mode=False,
        skip_empty_rows=True, verbose=False, machine_output=False,
        color=False, log_level="INFO", csv_delimiter=",",
        csv_encoding="utf-8",
    )
    d.update(overrides)
    return AppConfig(**d)


class TestDryRunEngineSmall:
    def test_basic_run_with_memory_rows(self, target_schema_users, sample_source_rows):
        from import_dryrun.models import TargetSchema
        schema = TargetSchema(**target_schema_users)
        cfg = _cfg()
        engine = DryRunEngine(cfg, schema=schema)
        result = engine.run(source_rows=sample_source_rows)
        assert result.total_records == 2
        assert result.processed_count == 2
        assert result.skipped_count == 0
        assert result.failed_count == 0
        assert result.target_table == "users"

    def test_run_with_errors(self, target_schema_users, sample_source_rows_errors):
        from import_dryrun.models import TargetSchema
        schema = TargetSchema(**target_schema_users)
        cfg = _cfg()
        engine = DryRunEngine(cfg, schema=schema)
        result = engine.run(source_rows=sample_source_rows_errors)
        assert result.total_records == 3
        assert result.failed_count >= 1
        assert result.processed_count <= 2

    def test_run_from_csv(self, target_users_file: Path, users_valid_csv: Path):
        cfg = _cfg(target_file=str(target_users_file), input_file=str(users_valid_csv))
        engine = DryRunEngine(cfg)
        result = engine.run()
        assert result.total_records == 5
        assert result.processed_count == 5

    def test_run_with_errors_csv(self, target_users_file: Path, users_with_errors_csv: Path):
        cfg = _cfg(target_file=str(target_users_file), input_file=str(users_with_errors_csv))
        engine = DryRunEngine(cfg)
        result = engine.run()
        assert result.total_records >= 8
        assert result.failed_count > 0

    def test_limit_applied(self, target_users_file: Path, users_valid_csv: Path):
        cfg = _cfg(target_file=str(target_users_file), input_file=str(users_valid_csv), limit=3)
        engine = DryRunEngine(cfg)
        result = engine.run()
        assert result.total_records == 3

    def test_primary_key_duplicate(self, target_schema_users):
        from import_dryrun.models import TargetSchema
        schema = TargetSchema(**target_schema_users)
        cfg = _cfg()
        engine = DryRunEngine(cfg, schema=schema)
        rows = [
            {"用户编号": "1", "姓名": "a", "邮箱": "a@b.com"},
            {"用户编号": "1", "姓名": "b", "邮箱": "b@b.com"},
        ]
        result = engine.run(source_rows=rows)
        dup_errs = []
        for r in result.records:
            dup_errs.extend(
                [e for e in r.errors if e.category == ErrorCategory.DUPLICATE_KEY]
            )
        assert len(dup_errs) >= 1

    def test_requires_input(self, target_schema_users):
        from import_dryrun.models import TargetSchema
        schema = TargetSchema(**target_schema_users)
        cfg = _cfg()
        engine = DryRunEngine(cfg, schema=schema)
        with pytest.raises(ValueError):
            engine.run()

    def test_requires_schema(self):
        cfg = _cfg(input_file="/tmp/nope.csv")
        engine = DryRunEngine(cfg)
        with pytest.raises(ValueError):
            engine.run()

    def test_empty_row_skipped(self, target_schema_users):
        from import_dryrun.models import TargetSchema
        schema = TargetSchema(**target_schema_users)
        cfg = _cfg(skip_empty_rows=True)
        engine = DryRunEngine(cfg, schema=schema)
        rows = [
            {"用户编号": "1", "姓名": "x", "邮箱": "a@b.com"},
            {"用户编号": "", "姓名": "", "邮箱": ""},
        ]
        result = engine.run(source_rows=rows)
        assert result.skipped_count == 1

    def test_reset_clears_state(self, target_schema_users):
        from import_dryrun.models import TargetSchema
        schema = TargetSchema(**target_schema_users)
        cfg = _cfg()
        engine = DryRunEngine(cfg, schema=schema)
        rows = [{"用户编号": "1", "姓名": "a", "邮箱": "a@b.com"}]
        r1 = engine.run(source_rows=rows)
        assert r1.processed_count == 1
        engine.reset()
        r2 = engine.run(source_rows=rows)
        assert r2.processed_count == 1
        dup_errs = [
            e
            for rec in r2.records
            for e in rec.errors
            if e.category == ErrorCategory.DUPLICATE_KEY
        ]
        assert len(dup_errs) == 0

    def test_finished_at_set(self, target_schema_users, sample_source_rows):
        from import_dryrun.models import TargetSchema
        schema = TargetSchema(**target_schema_users)
        cfg = _cfg()
        engine = DryRunEngine(cfg, schema=schema)
        result = engine.run(source_rows=sample_source_rows)
        assert result.finished_at is not None
        assert result.duration_seconds >= 0


@pytest.mark.slow
class TestDryRunEngineLarge:
    def test_10k_rows_perf(self, target_users_file: Path, users_large_csv: Path):
        cfg = _cfg(target_file=str(target_users_file), input_file=str(users_large_csv))
        engine = DryRunEngine(cfg)
        result = engine.run()
        assert result.total_records == 10000
        assert result.duration_seconds < 30

    def test_20k_rows_with_limit(self, target_users_file: Path, users_large_20k: Path):
        cfg = _cfg(target_file=str(target_users_file), input_file=str(users_large_20k), limit=5000)
        engine = DryRunEngine(cfg)
        result = engine.run()
        assert result.total_records == 5000
        assert result.limit_applied == 5000

    def test_10k_error_counts(self, target_users_file: Path, users_large_csv: Path):
        cfg = _cfg(target_file=str(target_users_file), input_file=str(users_large_csv))
        engine = DryRunEngine(cfg)
        result = engine.run()
        assert result.processed_count + result.failed_count + result.skipped_count == result.total_records
        assert 8000 <= result.processed_count <= 9500
