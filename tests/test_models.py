"""测试数据模型 models.py。"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from import_dryrun.models import (
    ErrorCategory,
    FieldMapping,
    FieldType,
    TargetSchema,
    ImportError,
    ImportRecord,
    ImportResult,
    ErrorGroup,
)


class TestErrorCategory:
    def test_labels_are_all_present(self):
        for cat in ErrorCategory:
            assert isinstance(cat.label, str)
            assert len(cat.label) > 0

    def test_category_values(self):
        assert ErrorCategory.MISSING_REQUIRED.value == "missing_required"
        assert ErrorCategory.TYPE_MISMATCH.value == "type_mismatch"
        assert ErrorCategory.INVALID_FORMAT.value == "invalid_format"


class TestFieldMapping:
    def test_defaults(self):
        m = FieldMapping(source="a", target="b")
        assert m.required is False
        assert m.field_type == FieldType.STRING
        assert m.transform is None
        assert m.default is None
        assert m.is_primary_key is False

    def test_with_all_fields(self):
        m = FieldMapping(
            source="src",
            target="dst",
            required=True,
            field_type="integer",
            transform="int(value)",
            default=0,
            allowed_values=[1, 2, 3],
            description="测试",
            min_value=0,
            max_value=100,
            regex=r"\d+",
            is_primary_key=True,
        )
        assert m.required is True
        assert m.field_type == FieldType.INTEGER
        assert m.transform == "int(value)"
        assert m.is_primary_key is True

    def test_invalid_extra_field_rejected(self):
        with pytest.raises(ValidationError):
            FieldMapping(source="a", target="b", nonexistent="x")

    def test_invalid_type_rejected(self):
        with pytest.raises(ValidationError):
            FieldMapping(source="a", target="b", field_type="not_a_type")


class TestTargetSchema:
    def _base_fields(self):
        return [
            FieldMapping(source="a", target="a_out", required=True),
            FieldMapping(source="b", target="b_out", required=False),
        ]

    def test_creation(self):
        s = TargetSchema(table_name="t", fields=self._base_fields())
        assert s.table_name == "t"
        assert len(s.fields) == 2

    def test_duplicate_target_raises(self):
        dup = [
            FieldMapping(source="a", target="x"),
            FieldMapping(source="b", target="x"),
        ]
        with pytest.raises(ValidationError):
            TargetSchema(table_name="t", fields=dup)

    def test_get_required_fields(self):
        s = TargetSchema(table_name="t", fields=self._base_fields())
        reqs = s.get_required_fields()
        assert len(reqs) == 1
        assert reqs[0].target == "a_out"

    def test_get_field(self):
        s = TargetSchema(table_name="t", fields=self._base_fields())
        assert s.get_field("a_out") is not None
        assert s.get_field("not_exist") is None

    def test_get_field_by_source(self):
        s = TargetSchema(table_name="t", fields=self._base_fields())
        assert s.get_field_by_source("a") is not None
        assert s.get_field_by_source("z") is None


class TestImportError:
    def test_hashable_for_grouping(self):
        e1 = ImportError(category=ErrorCategory.MISSING_REQUIRED, message="x")
        e2 = ImportError(category=ErrorCategory.MISSING_REQUIRED, message="x")
        assert hash(e1) == hash(e2)
        assert len({e1, e2}) == 1


class TestImportRecord:
    def test_is_valid_no_errors(self):
        r = ImportRecord(row_number=1, source_data={"a": 1})
        assert r.is_valid is True

    def test_is_invalid_with_errors(self):
        r = ImportRecord(
            row_number=1,
            source_data={"a": 1},
            errors=[ImportError(category=ErrorCategory.UNKNOWN_ERROR, message="err")],
        )
        assert r.is_valid is False

    def test_is_invalid_when_skipped(self):
        r = ImportRecord(row_number=1, source_data={}, skipped=True)
        assert r.is_valid is False


class TestImportResult:
    def test_finalize_counts(self):
        r = ImportResult(target_table="t")
        r.records = [
            ImportRecord(row_number=1, source_data={}),
            ImportRecord(row_number=2, source_data={}, skipped=True, skip_reason="空"),
            ImportRecord(
                row_number=3,
                source_data={},
                errors=[ImportError(category=ErrorCategory.UNKNOWN_ERROR, message="x")],
            ),
        ]
        r.finalize()
        assert r.processed_count == 1
        assert r.skipped_count == 1
        assert r.failed_count == 1


class TestErrorGroup:
    def test_key_tuple(self):
        g = ErrorGroup(
            category=ErrorCategory.MISSING_REQUIRED,
            target_field="f1",
        )
        assert g.key == (ErrorCategory.MISSING_REQUIRED, "f1")
