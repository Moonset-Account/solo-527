"""CSV校验引擎单元测试。"""

import io

import pytest

from csv_validator.errors import ValidationErrorCode, ValidationSeverity
from csv_validator.schema import Schema, SchemaLoader
from csv_validator.validator import CSVValidator


SIMPLE_SCHEMA_DICT = {
    "fields": [
        {"name": "id", "type": "integer", "required": True, "unique": True},
        {"name": "name", "type": "string", "required": True},
        {"name": "role", "type": "string", "enum": ["admin", "viewer"]},
        {"name": "age", "type": "integer", "min_value": 0, "max_value": 150},
        {"name": "email", "type": "string", "pattern": r"^[^@]+@[^@]+\.[^@]+$"},
        {"name": "active", "type": "boolean"},
        {"name": "created", "type": "date", "format": "%Y-%m-%d"},
    ],
    "unique_keys": [["id", "name"]],
    "strict": False,
}


def _make_validator(**overrides) -> CSVValidator:
    schema = SchemaLoader.from_dict({**SIMPLE_SCHEMA_DICT, **overrides})
    return CSVValidator(schema=schema)


class TestHeaderValidation:
    def test_missing_required_column(self):
        v = _make_validator()
        csv_data = "wrong_col,name\n1,Alice\n"
        result = v.validate_string(csv_data)
        codes = [i.code for i in result.issues]
        assert ValidationErrorCode.MISSING_REQUIRED_COLUMN in codes

    def test_unknown_column_not_strict(self):
        v = _make_validator(strict=False)
        csv_data = "id,name,extra_col\n1,Alice,foo\n"
        result = v.validate_string(csv_data)
        assert ValidationErrorCode.UNKNOWN_COLUMN not in [i.code for i in result.issues]
        assert result.valid is True

    def test_unknown_column_strict_mode(self):
        v = _make_validator(strict=True)
        csv_data = "id,name,extra_col\n1,Alice,foo\n"
        result = v.validate_string(csv_data)
        codes = [i.code for i in result.issues]
        assert ValidationErrorCode.UNKNOWN_COLUMN in codes
        assert result.valid is False

    def test_unknown_column_strict_is_error_severity(self):
        v = _make_validator(strict=True)
        csv_data = "id,name,extra_col\n1,Alice,foo\n"
        result = v.validate_string(csv_data)
        unknown_issues = [
            i for i in result.issues
            if i.code == ValidationErrorCode.UNKNOWN_COLUMN
        ]
        assert len(unknown_issues) == 1
        assert unknown_issues[0].severity == ValidationSeverity.ERROR
        assert result.error_count == 1
        assert result.warning_count == 0

    def test_strict_from_cli_overrides_schema(self):
        schema = SchemaLoader.from_dict({**SIMPLE_SCHEMA_DICT, "strict": False})
        v = CSVValidator(schema=schema, strict=True)
        csv_data = "id,name,extra\n1,Alice,x\n"
        result = v.validate_string(csv_data)
        assert ValidationErrorCode.UNKNOWN_COLUMN in [i.code for i in result.issues]
        assert result.valid is False

    def test_empty_file(self):
        v = _make_validator()
        result = v.validate_string("")
        assert result.valid is False
        assert ValidationErrorCode.EMPTY_FILE in [i.code for i in result.issues]


class TestRowValidation:
    def test_valid_data_passes(self):
        v = _make_validator()
        csv_data = (
            "id,name,role,age,email,active,created\n"
            "1,Alice,admin,30,alice@example.com,true,2025-01-01\n"
            "2,Bob,viewer,25,bob@example.com,false,2025-02-15\n"
        )
        result = v.validate_string(csv_data)
        assert result.valid is True
        assert result.total_rows == 2
        assert result.total_columns == 7

    def test_missing_required_value(self):
        v = _make_validator()
        csv_data = "id,name,role,age,email,active,created\n,Alice,admin,30,a@b.com,true,2025-01-01\n"
        result = v.validate_string(csv_data)
        codes = [i.code for i in result.issues]
        assert ValidationErrorCode.MISSING_VALUE in codes
        assert any(i.column == "id" for i in result.issues)

    def test_type_mismatch_integer(self):
        v = _make_validator()
        csv_data = "id,name,role,age,email,active,created\nnot_int,Alice,admin,30,a@b.com,true,2025-01-01\n"
        result = v.validate_string(csv_data)
        assert any(i.code == ValidationErrorCode.TYPE_MISMATCH and i.column == "id" for i in result.issues)

    def test_invalid_enum(self):
        v = _make_validator()
        csv_data = "id,name,role,age,email,active,created\n1,Alice,superuser,30,a@b.com,true,2025-01-01\n"
        result = v.validate_string(csv_data)
        assert any(i.code == ValidationErrorCode.INVALID_ENUM for i in result.issues)

    def test_pattern_mismatch(self):
        v = _make_validator()
        csv_data = "id,name,role,age,email,active,created\n1,Alice,admin,30,not-an-email,true,2025-01-01\n"
        result = v.validate_string(csv_data)
        assert any(i.code == ValidationErrorCode.INVALID_FORMAT for i in result.issues)

    def test_value_below_min(self):
        v = _make_validator()
        csv_data = "id,name,role,age,email,active,created\n1,Alice,admin,-5,a@b.com,true,2025-01-01\n"
        result = v.validate_string(csv_data)
        assert any(i.code == ValidationErrorCode.VALUE_OUT_OF_RANGE for i in result.issues)

    def test_value_above_max(self):
        v = _make_validator()
        csv_data = "id,name,role,age,email,active,created\n1,Alice,admin,999,a@b.com,true,2025-01-01\n"
        result = v.validate_string(csv_data)
        assert any(i.code == ValidationErrorCode.VALUE_OUT_OF_RANGE for i in result.issues)

    def test_duplicate_single_unique_key(self):
        v = _make_validator()
        csv_data = (
            "id,name,role,age,email,active,created\n"
            "1,Alice,admin,30,a@b.com,true,2025-01-01\n"
            "1,Bob,viewer,25,b@b.com,false,2025-02-15\n"
        )
        result = v.validate_string(csv_data)
        assert any(
            i.code == ValidationErrorCode.DUPLICATE_KEY and i.column == "id"
            for i in result.issues
        )

    def test_duplicate_composite_unique_key(self):
        v = _make_validator()
        csv_data = (
            "id,name,role,age,email,active,created\n"
            "1,Alice,admin,30,a@b.com,true,2025-01-01\n"
            "1,Alice,viewer,25,aa@b.com,false,2025-02-15\n"
        )
        result = v.validate_string(csv_data)
        assert any(
            i.code == ValidationErrorCode.DUPLICATE_KEY and "id" in str(i.column)
            for i in result.issues
        )

    def test_boolean_variants(self):
        v = _make_validator()
        for val in ["true", "false", "1", "0", "yes", "no", "是", "否"]:
            csv_data = f"id,name,role,age,email,active,created\n1,Alice,admin,30,a@b.com,{val},2025-01-01\n"
            result = v.validate_string(csv_data)
            assert not any(
                i.code == ValidationErrorCode.TYPE_MISMATCH and i.column == "active"
                for i in result.issues
            )

    def test_invalid_boolean(self):
        v = _make_validator()
        csv_data = "id,name,role,age,email,active,created\n1,Alice,admin,30,a@b.com,maybe,2025-01-01\n"
        result = v.validate_string(csv_data)
        assert any(
            i.code == ValidationErrorCode.TYPE_MISMATCH and i.column == "active"
            for i in result.issues
        )

    def test_date_invalid_format(self):
        v = _make_validator()
        csv_data = "id,name,role,age,email,active,created\n1,Alice,admin,30,a@b.com,true,2025/01/01\n"
        result = v.validate_string(csv_data)
        assert any(
            i.code == ValidationErrorCode.TYPE_MISMATCH and i.column == "created"
            for i in result.issues
        )

    def test_max_errors_stops_collection(self):
        schema = SchemaLoader.from_dict({"fields": [{"name": "id", "type": "integer", "required": True}]})
        v = CSVValidator(schema=schema, max_errors=3)
        lines = ["id"] + [f"x{i}" for i in range(10)]
        csv_data = "\n".join(lines) + "\n"
        result = v.validate_string(csv_data)
        assert result.error_count <= 3


class TestRealExamples:
    def test_example_valid_orders(self):
        from csv_validator.schema import SchemaLoader
        import os
        schema_path = os.path.join(os.path.dirname(__file__), "..", "examples", "schema_orders.json")
        csv_path = os.path.join(os.path.dirname(__file__), "..", "examples", "orders_valid.csv")
        schema = SchemaLoader.from_file(schema_path)
        v = CSVValidator(schema=schema)
        result = v.validate_file(csv_path)
        assert result.valid is True, f"Expected valid but got issues: {[i.to_dict() for i in result.issues]}"

    def test_example_invalid_orders_has_errors(self):
        from csv_validator.schema import SchemaLoader
        import os
        schema_path = os.path.join(os.path.dirname(__file__), "..", "examples", "schema_orders.json")
        csv_path = os.path.join(os.path.dirname(__file__), "..", "examples", "orders_invalid.csv")
        schema = SchemaLoader.from_file(schema_path)
        v = CSVValidator(schema=schema)
        result = v.validate_file(csv_path)
        assert result.valid is False
        assert result.error_count > 0
        expected_codes = {
            ValidationErrorCode.DUPLICATE_KEY,
            ValidationErrorCode.INVALID_FORMAT,
            ValidationErrorCode.TYPE_MISMATCH,
            ValidationErrorCode.VALUE_OUT_OF_RANGE,
            ValidationErrorCode.MISSING_VALUE,
            ValidationErrorCode.INVALID_ENUM,
        }
        actual_codes = {i.code for i in result.issues}
        assert expected_codes & actual_codes, f"Missing expected codes. Got: {actual_codes}"

    def test_example_valid_users(self):
        from csv_validator.schema import SchemaLoader
        import os
        schema_path = os.path.join(os.path.dirname(__file__), "..", "examples", "schema_users.json")
        csv_path = os.path.join(os.path.dirname(__file__), "..", "examples", "users_valid.csv")
        schema = SchemaLoader.from_file(schema_path)
        v = CSVValidator(schema=schema)
        result = v.validate_file(csv_path)
        assert result.valid is True
