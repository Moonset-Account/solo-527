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
        # 含 1 条空行，应计入 total_records 并标记为 skipped
        assert result.total_records >= 9
        assert result.skipped_count >= 1
        assert result.failed_count > 0
        assert (result.processed_count + result.skipped_count + result.failed_count
                == result.total_records)

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

    def test_extra_columns_unmapped_field_non_strict(self, target_schema_users):
        """非严格模式下，超列数据仍生成 UNMAPPED_FIELD 错误（仅提醒）。"""
        from import_dryrun.models import TargetSchema
        schema = TargetSchema(**target_schema_users)
        cfg = _cfg(strict_mode=False)
        engine = DryRunEngine(cfg, schema=schema)
        rows = [
            {"用户编号": "1", "姓名": "a", "邮箱": "a@b.com",
             "__extra_columns__": [{"column": 4, "value": "extra_val"}]},
        ]
        result = engine.run(source_rows=rows)
        unmapped = [
            e for r in result.records for e in r.errors
            if e.category == ErrorCategory.UNMAPPED_FIELD
        ]
        assert len(unmapped) == 1
        assert "超列" in unmapped[0].target_field
        assert "仅提醒" in unmapped[0].message

    def test_extra_columns_unmapped_field_strict(self, target_schema_users):
        """严格模式下，超列数据生成 UNMAPPED_FIELD 错误（视为错误）。"""
        from import_dryrun.models import TargetSchema
        schema = TargetSchema(**target_schema_users)
        cfg = _cfg(strict_mode=True)
        engine = DryRunEngine(cfg, schema=schema)
        rows = [
            {"用户编号": "1", "姓名": "a", "邮箱": "a@b.com",
             "__extra_columns__": [
                 {"column": 4, "value": "x1"},
                 {"column": 5, "value": "x2"},
             ]},
        ]
        result = engine.run(source_rows=rows)
        unmapped = [
            e for r in result.records for e in r.errors
            if e.category == ErrorCategory.UNMAPPED_FIELD and "超列" in (e.target_field or "")
        ]
        assert len(unmapped) == 2
        assert any("视为错误" in e.message for e in unmapped)

    def test_extra_columns_preserved_in_source_data(self, target_schema_users):
        """超列信息保留在 source_data 中，供 verbose 输出使用。"""
        from import_dryrun.models import TargetSchema
        schema = TargetSchema(**target_schema_users)
        cfg = _cfg()
        engine = DryRunEngine(cfg, schema=schema)
        rows = [
            {"用户编号": "1", "姓名": "a", "邮箱": "a@b.com",
             "__extra_columns__": [{"column": 4, "value": "surprise"}]},
        ]
        result = engine.run(source_rows=rows)
        assert "__extra_columns__" in result.records[0].source_data

    def test_extra_columns_from_csv_file(self, target_users_file: Path, tmp_path: Path):
        """端到端：CSV 文件含超列行，Engine 生成 UNMAPPED_FIELD 错误。"""
        csv_path = tmp_path / "extra_cols.csv"
        csv_path.write_text(
            "用户编号,姓名,邮箱,年龄,等级\n"
            "1,张三,a@a.com,28,VIP,bonus1,bonus2\n"
            "2,李四,b@b.com,30,普通\n",
            encoding="utf-8",
        )
        cfg = _cfg(target_file=str(target_users_file), input_file=str(csv_path))
        engine = DryRunEngine(cfg)
        result = engine.run()
        unmapped = [
            e for r in result.records for e in r.errors
            if e.category == ErrorCategory.UNMAPPED_FIELD and "超列" in (e.target_field or "")
        ]
        assert len(unmapped) == 2

    def test_trailing_delimiter_empty_row_counted_as_skipped(self, target_schema_users):
        """尾部分隔符的空行（如 ',,,\n'）应进入 skipped_count，而非失败。"""
        from import_dryrun.models import TargetSchema
        schema = TargetSchema(**target_schema_users)
        cfg = _cfg(skip_empty_rows=True)
        engine = DryRunEngine(cfg, schema=schema)
        rows = [
            {"用户编号": "1", "姓名": "x", "邮箱": "a@b.com"},
            {"用户编号": "", "姓名": "", "邮箱": "", "年龄": ""},
            {"用户编号": "2", "姓名": "y", "邮箱": "c@d.com"},
        ]
        result = engine.run(source_rows=rows)
        assert result.total_records == 3
        assert result.skipped_count == 1
        assert result.processed_count == 2
        assert result.failed_count == 0

    def test_extra_columns_all_blank_no_unmapped_errors(self, target_users_file: Path, tmp_path: Path):
        """超列全空白时，不产生 UNMAPPED_FIELD 错误；且带空白超列的空行仍算 skipped。"""
        csv_path = tmp_path / "mixed.csv"
        csv_path.write_text(
            "用户编号,姓名,邮箱\n"
            "1,张三,a@a.com\n"
            ",, , , ,\n"
            "2,李四,b@b.com,real_extra\n",
            encoding="utf-8",
        )
        cfg = _cfg(
            target_file=str(target_users_file),
            input_file=str(csv_path),
            skip_empty_rows=True,
            strict_mode=True,
        )
        engine = DryRunEngine(cfg)
        result = engine.run()
        # 第 2 行是空行（只有空白和尾部空白分隔符）→ skipped
        # 第 3 行有一个非空超列 real_extra → 1 个 UNMAPPED_FIELD(超列) 错误
        assert result.total_records == 3
        assert result.skipped_count == 1
        unmapped_extra = [
            e for r in result.records for e in r.errors
            if e.category == ErrorCategory.UNMAPPED_FIELD and "超列" in (e.target_field or "")
        ]
        assert len(unmapped_extra) == 1
        assert "real_extra" in unmapped_extra[0].message

    def test_blank_headers_with_nonempty_extras_not_skipped(self, target_users_file: Path, tmp_path: Path):
        """表头字段全为空但存在非空超列值 → 不被当作空行跳过，应生成 UNMAPPED_FIELD。"""
        csv_path = tmp_path / "blank_headers_with_extra.csv"
        csv_path.write_text(
            "用户编号,姓名,邮箱\n"
            ",,,surprise_value\n"
            ",, ,   , , \n"
            "1,张三,a@a.com\n",
            encoding="utf-8",
        )
        cfg = _cfg(
            target_file=str(target_users_file),
            input_file=str(csv_path),
            skip_empty_rows=True,
            strict_mode=True,
        )
        engine = DryRunEngine(cfg)
        result = engine.run()
        # 第 1 行：表头全空但有非空超列 surprise_value → 不 skipped，应有 UNMAPPED_FIELD
        # 第 2 行：全空（含空白超列，已被过滤）→ skipped
        # 第 3 行：正常 → processed
        assert result.total_records == 3
        assert result.skipped_count == 1
        assert result.processed_count == 1
        # 有超列的行应为 failed（有 UNMAPPED_FIELD 错误）或 failed 取决于是否有其他错误
        # 严格模式下 superise_value 是超列 → UNMAPPED_FIELD；同时表头全空可能触发 MISSING_REQUIRED
        assert result.failed_count >= 1
        unmapped_extra = [
            e for r in result.records for e in r.errors
            if e.category == ErrorCategory.UNMAPPED_FIELD and "超列" in (e.target_field or "")
        ]
        assert len(unmapped_extra) == 1
        assert "surprise_value" in unmapped_extra[0].message

    def test_blank_headers_with_blank_extras_still_skipped(self, target_schema_users):
        """表头全空且 __extra_columns__ 不存在（或为空）时，仍按空行 skipped。"""
        from import_dryrun.models import TargetSchema
        schema = TargetSchema(**target_schema_users)
        cfg = _cfg(skip_empty_rows=True)
        engine = DryRunEngine(cfg, schema=schema)
        rows = [
            {"用户编号": "", "姓名": "", "邮箱": ""},
            {"用户编号": "1", "姓名": "x", "邮箱": "a@b.com"},
        ]
        result = engine.run(source_rows=rows)
        assert result.skipped_count == 1
        assert result.processed_count == 1


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
