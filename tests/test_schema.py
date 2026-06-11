"""Schema解析相关单元测试。"""

import json
import os
import tempfile

import pytest

from csv_validator.errors import ValidationError, ExitCode
from csv_validator.schema import (
    FieldSchema,
    Schema,
    SchemaLoader,
    SUPPORTED_TYPES,
)


SAMPLE_SCHEMA_DICT = {
    "description": "测试Schema",
    "strict": False,
    "fields": [
        {"name": "id", "type": "integer", "required": True, "unique": True},
        {"name": "name", "type": "string", "required": True},
        {"name": "status", "type": "string", "enum": ["a", "b", "c"]},
        {"name": "amount", "type": "float", "min_value": 0, "max_value": 1000},
        {"name": "email", "type": "string", "pattern": r"^[^@]+@[^@]+\.[^@]+$"},
        {"name": "created", "type": "date", "format": "%Y/%m/%d"},
    ],
    "unique_keys": [["id", "name"]],
}


class TestFieldSchema:
    def test_basic_creation(self):
        f = FieldSchema(name="id", type="integer")
        assert f.name == "id"
        assert f.type == "integer"
        assert f.required is False
        assert f.unique is False

    def test_unsupported_type_raises(self):
        with pytest.raises(ValidationError) as exc:
            FieldSchema(name="x", type="fake_type")
        assert exc.value.exit_code == ExitCode.SCHEMA_ERROR

    def test_invalid_pattern_raises(self):
        with pytest.raises(ValidationError) as exc:
            FieldSchema(name="x", type="string", pattern="[invalid(")
        assert exc.value.exit_code == ExitCode.SCHEMA_ERROR

    def test_all_supported_types_are_valid(self):
        for t in SUPPORTED_TYPES:
            f = FieldSchema(name="f", type=t)
            assert f.type == t

    def test_to_dict_includes_relevant_fields(self):
        f = FieldSchema(
            name="x", type="integer", required=True, unique=True,
            enum=[1, 2], min_value=0, max_value=10,
            pattern=r"\d+", format="%Y", description="测试",
        )
        d = f.to_dict()
        assert d["name"] == "x"
        assert d["enum"] == [1, 2]
        assert d["min_value"] == 0
        assert d["max_value"] == 10
        assert d["pattern"] == r"\d+"
        assert d["format"] == "%Y"
        assert d["description"] == "测试"

    def test_to_dict_excludes_default_none(self):
        f = FieldSchema(name="x")
        d = f.to_dict()
        assert "enum" not in d
        assert "min_value" not in d
        assert "pattern" not in d


class TestSchema:
    def test_get_field_found(self):
        s = Schema(fields=[FieldSchema(name="a"), FieldSchema(name="b")])
        assert s.get_field("a").name == "a"
        assert s.get_field("b").name == "b"

    def test_get_field_not_found(self):
        s = Schema(fields=[FieldSchema(name="a")])
        assert s.get_field("c") is None

    def test_field_names(self):
        s = Schema(fields=[FieldSchema(name="a"), FieldSchema(name="b")])
        assert s.field_names == ["a", "b"]

    def test_required_fields(self):
        s = Schema(fields=[
            FieldSchema(name="a", required=True),
            FieldSchema(name="b"),
            FieldSchema(name="c", required=True),
        ])
        assert s.required_fields == ["a", "c"]

    def test_unique_fields(self):
        s = Schema(fields=[
            FieldSchema(name="a", unique=True),
            FieldSchema(name="b"),
        ])
        assert s.unique_fields == ["a"]


class TestSchemaLoaderFromDict:
    def test_load_basic(self):
        s = SchemaLoader.from_dict(SAMPLE_SCHEMA_DICT)
        assert len(s.fields) == 6
        assert s.description == "测试Schema"
        assert s.strict is False
        assert s.unique_keys == [["id", "name"]]

    def test_missing_fields_key(self):
        with pytest.raises(ValidationError) as exc:
            SchemaLoader.from_dict({"no_fields": 1})
        assert exc.value.exit_code == ExitCode.SCHEMA_ERROR

    def test_duplicate_field_names(self):
        with pytest.raises(ValidationError):
            SchemaLoader.from_dict({
                "fields": [{"name": "x"}, {"name": "x"}],
            })

    def test_field_without_name(self):
        with pytest.raises(ValidationError):
            SchemaLoader.from_dict({
                "fields": [{"type": "string"}],
            })

    def test_unique_keys_with_undefined_field(self):
        with pytest.raises(ValidationError):
            SchemaLoader.from_dict({
                "fields": [{"name": "a"}],
                "unique_keys": [["a", "missing"]],
            })

    def test_invalid_unique_keys_structure(self):
        with pytest.raises(ValidationError):
            SchemaLoader.from_dict({
                "fields": [{"name": "a"}],
                "unique_keys": "not a list",
            })

    def test_strict_mode_from_schema(self):
        s = SchemaLoader.from_dict({
            "fields": [{"name": "a"}],
            "strict": True,
        })
        assert s.strict is True


class TestSchemaLoaderFromFile:
    def test_load_from_file(self):
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as fp:
            json.dump(SAMPLE_SCHEMA_DICT, fp, ensure_ascii=False)
            path = fp.name
        try:
            s = SchemaLoader.from_file(path)
            assert len(s.fields) == 6
            assert s.description == "测试Schema"
        finally:
            os.unlink(path)

    def test_file_not_found(self):
        with pytest.raises(ValidationError) as exc:
            SchemaLoader.from_file("/nonexistent/path.json")
        assert exc.value.exit_code == ExitCode.SCHEMA_ERROR

    def test_invalid_json(self):
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as fp:
            fp.write("{this is not json}")
            path = fp.name
        try:
            with pytest.raises(ValidationError) as exc:
                SchemaLoader.from_file(path)
            assert exc.value.exit_code == ExitCode.SCHEMA_ERROR
        finally:
            os.unlink(path)


class TestSchemaLoaderFromString:
    def test_load_from_string(self):
        s = SchemaLoader.from_string(json.dumps(SAMPLE_SCHEMA_DICT))
        assert len(s.fields) == 6

    def test_invalid_string_json(self):
        with pytest.raises(ValidationError):
            SchemaLoader.from_string("not json")
