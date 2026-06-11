"""测试错误分组与修复建议模块 errors.py。"""

from __future__ import annotations

import pytest

from import_dryrun.errors import ErrorGrouper, RepairAdvisor, CATEGORY_SUGGESTIONS
from import_dryrun.models import (
    ErrorCategory,
    ImportError,
    ImportRecord,
    ImportResult,
    TargetSchema,
)


def _make_err(category: ErrorCategory, target: str = None, row: int = 1, msg: str = "msg") -> ImportError:
    return ImportError(category=category, target_field=target, row_number=row, message=msg)


class TestErrorGrouper:
    def test_groups_by_category_and_field(self):
        errors = [
            _make_err(ErrorCategory.MISSING_REQUIRED, "a", 1),
            _make_err(ErrorCategory.MISSING_REQUIRED, "a", 2),
            _make_err(ErrorCategory.MISSING_REQUIRED, "b", 3),
            _make_err(ErrorCategory.TYPE_MISMATCH, "a", 4),
        ]
        groups = ErrorGrouper(sample_count=10).group_errors(errors)
        assert len(groups) == 3
        counts = {(g.category, g.target_field): g.count for g in groups}
        assert counts[(ErrorCategory.MISSING_REQUIRED, "a")] == 2
        assert counts[(ErrorCategory.MISSING_REQUIRED, "b")] == 1
        assert counts[(ErrorCategory.TYPE_MISMATCH, "a")] == 1

    def test_sample_count_limited(self):
        errors = [_make_err(ErrorCategory.MISSING_REQUIRED, "f", i) for i in range(20)]
        groups = ErrorGrouper(sample_count=3).group_errors(errors)
        assert groups[0].count == 20
        assert len(groups[0].sample_errors) == 3

    def test_sorted_by_count_desc(self):
        errors = [
            *[_make_err(ErrorCategory.MISSING_REQUIRED, "a", i) for i in range(5)],
            *[_make_err(ErrorCategory.TYPE_MISMATCH, "b", i) for i in range(2)],
            *[_make_err(ErrorCategory.UNKNOWN_ERROR, None, i) for i in range(10)],
        ]
        groups = ErrorGrouper().group_errors(errors)
        assert [g.count for g in groups] == [10, 5, 2]

    def test_group_from_result(self, sample_source_rows_errors, target_schema_users):
        from import_dryrun.engine import DryRunEngine
        from import_dryrun.config import AppConfig
        from import_dryrun.models import TargetSchema
        cfg = AppConfig(
            mapping_file=None, target_file=None, input_file=None,
            dry_run=True, sample_errors=5, strict_mode=False,
            skip_empty_rows=True, verbose=False, machine_output=False,
            color=False, log_level="INFO", csv_delimiter=",", csv_encoding="utf-8",
        )
        schema = TargetSchema(**target_schema_users)
        engine = DryRunEngine(cfg, schema=schema)
        result = engine.run(source_rows=sample_source_rows_errors)
        groups = ErrorGrouper().group_result(result)
        assert isinstance(groups, list)
        assert len(groups) > 0

    def test_suggestions_populated(self):
        errors = [_make_err(ErrorCategory.MISSING_REQUIRED, "f", 1, "m1"),
                  _make_err(ErrorCategory.MISSING_REQUIRED, "f", 2, "m2")]
        errors[0].suggestion = "修正第1行"
        errors[1].suggestion = "修正第2行"
        groups = ErrorGrouper().group_errors(errors)
        assert groups[0].suggestion is not None
        assert "具体修复建议" in groups[0].suggestion


class TestRepairAdvisor:
    def test_no_errors_summary(self):
        advisor = RepairAdvisor()
        s = advisor.generate_summary([])
        assert "数据质量良好" in s
        assert "✅  状态: 通过" in RepairAdvisor._build_overall_recommendation(0, 0)

    def test_high_priority_ranked_first(self):
        errors = [
            *[_make_err(ErrorCategory.UNMAPPED_FIELD, "x", i) for i in range(5)],
            *[_make_err(ErrorCategory.MISSING_REQUIRED, "pk", i) for i in range(3)],
        ]
        groups = ErrorGrouper().group_errors(errors)
        advisor = RepairAdvisor()
        s = advisor.generate_summary(groups)
        assert "高严重度" in s

    def test_some_errors_small(self):
        errors = [_make_err(ErrorCategory.UNMAPPED_FIELD, "x", 1)]
        groups = ErrorGrouper().group_errors(errors)
        advisor = RepairAdvisor()
        s = advisor.generate_summary(groups)
        assert "非关键问题" in s

    def test_many_errors(self):
        errors = [_make_err(ErrorCategory.MISSING_REQUIRED, "f", i) for i in range(30)]
        groups = ErrorGrouper().group_errors(errors)
        advisor = RepairAdvisor()
        s = advisor.generate_summary(groups)
        assert "错误较多" in s

    def test_field_actions(self):
        errors = [
            _make_err(ErrorCategory.MISSING_REQUIRED, "user_id"),
            _make_err(ErrorCategory.TYPE_MISMATCH, "age"),
            _make_err(ErrorCategory.DUPLICATE_KEY, "email"),
        ]
        groups = ErrorGrouper().group_errors(errors)
        advisor = RepairAdvisor()
        actions = advisor.list_field_actions(groups)
        assert len(actions) == 3
        fields = {a["field"] for a in actions}
        assert {"user_id", "age", "email"} <= fields


def test_all_categories_have_suggestions():
    for cat in ErrorCategory:
        assert cat in CATEGORY_SUGGESTIONS
        assert len(CATEGORY_SUGGESTIONS[cat]) > 0
