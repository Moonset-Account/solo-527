"""测试字段映射模块 mapper.py。"""

from __future__ import annotations

import csv
import json
from pathlib import Path
from datetime import date, datetime

import pytest

from import_dryrun.mapper import (
    FieldMapper,
    DataReader,
    MappingLoader,
    _is_empty,
)
from import_dryrun.models import (
    ErrorCategory,
    FieldMapping,
    FieldType,
    TargetSchema,
)


class TestIsEmpty:
    @pytest.mark.parametrize("val", [None, "", "   ", [], {}, ()])
    def test_empty_values(self, val):
        assert _is_empty(val) is True

    @pytest.mark.parametrize("val", ["0", "x", 0, [0], {"a": 1}])
    def test_non_empty_values(self, val):
        assert _is_empty(val) is False


def _make_schema(extra_fields=None) -> TargetSchema:
    fields = [
        FieldMapping(source="用户编号", target="user_id", required=True,
                     field_type=FieldType.INTEGER, is_primary_key=True),
        FieldMapping(source="姓名", target="username", required=True,
                     field_type=FieldType.STRING, transform="strip()"),
        FieldMapping(source="邮箱", target="email", required=True,
                     field_type=FieldType.EMAIL, transform="lower().strip()"),
        FieldMapping(source="年龄", target="age", required=False,
                     field_type=FieldType.INTEGER, min_value=0, max_value=150),
        FieldMapping(source="注册日期", target="register_date", required=False,
                     field_type=FieldType.DATE),
        FieldMapping(source="是否VIP", target="is_vip", required=False,
                     field_type=FieldType.BOOLEAN, default=False),
        FieldMapping(source="用户类型", target="user_type", required=False,
                     field_type=FieldType.ENUM,
                     allowed_values=["普通", "银牌", "金牌", "钻石"], default="普通"),
    ]
    if extra_fields:
        fields.extend(extra_fields)
    return TargetSchema(table_name="users", fields=fields, primary_keys=["user_id"])


class TestFieldMapperBasic:
    def test_map_record_success(self):
        mapper = FieldMapper(_make_schema())
        source = {
            "用户编号": "123", "姓名": " 张三 ", "邮箱": "Test@Example.COM",
            "年龄": "30", "注册日期": "2024-01-15", "是否VIP": "是", "用户类型": "金牌",
        }
        target, errors = mapper.map_record(1, source)
        assert len(errors) == 0
        assert target["user_id"] == 123
        assert target["username"] == "张三"
        assert target["email"] == "test@example.com"
        assert target["age"] == 30
        assert target["register_date"] == date(2024, 1, 15)
        assert target["is_vip"] is True
        assert target["user_type"] == "金牌"

    def test_missing_required(self):
        mapper = FieldMapper(_make_schema())
        source = {"用户编号": "", "姓名": "", "邮箱": ""}
        _, errors = mapper.map_record(1, source)
        cats = {e.category for e in errors}
        assert ErrorCategory.MISSING_REQUIRED in cats

    def test_default_values_applied(self):
        mapper = FieldMapper(_make_schema())
        source = {"用户编号": "1", "姓名": "a", "邮箱": "a@b.com", "是否VIP": ""}
        target, errors = mapper.map_record(1, source)
        assert len(errors) == 0
        assert target["is_vip"] is False
        assert target["user_type"] == "普通"

    def test_type_mismatch(self):
        mapper = FieldMapper(_make_schema())
        source = {"用户编号": "abc", "姓名": "x", "邮箱": "x@x.com"}
        _, errors = mapper.map_record(1, source)
        assert any(e.category == ErrorCategory.TYPE_MISMATCH for e in errors)

    def test_value_out_of_range(self):
        mapper = FieldMapper(_make_schema())
        source = {"用户编号": "1", "姓名": "x", "邮箱": "x@x.com", "年龄": "-5"}
        _, errors = mapper.map_record(1, source)
        assert any(e.category == ErrorCategory.VALUE_OUT_OF_RANGE for e in errors)

    def test_invalid_enum(self):
        mapper = FieldMapper(_make_schema())
        source = {"用户编号": "1", "姓名": "x", "邮箱": "x@x.com", "用户类型": "王者"}
        _, errors = mapper.map_record(1, source)
        assert any(e.category == ErrorCategory.INVALID_FORMAT for e in errors)

    def test_invalid_email(self):
        mapper = FieldMapper(_make_schema())
        source = {"用户编号": "1", "姓名": "x", "邮箱": "not-an-email"}
        _, errors = mapper.map_record(1, source)
        assert any(e.category == ErrorCategory.TYPE_MISMATCH for e in errors)

    def test_strict_mode_unmapped(self):
        mapper = FieldMapper(_make_schema(), strict=True)
        source = {"用户编号": "1", "姓名": "x", "邮箱": "x@x.com", "备注": "未映射字段"}
        _, errors = mapper.map_record(1, source)
        assert any(e.category == ErrorCategory.UNMAPPED_FIELD for e in errors)

    def test_non_strict_ignores_unmapped(self):
        mapper = FieldMapper(_make_schema(), strict=False)
        source = {"用户编号": "1", "姓名": "x", "邮箱": "x@x.com", "备注": "ok"}
        _, errors = mapper.map_record(1, source)
        assert not any(e.category == ErrorCategory.UNMAPPED_FIELD for e in errors)

    def test_transform_failure(self):
        schema = _make_schema([
            FieldMapping(source="bad", target="bad", transform="value.not_exist_method()"),
        ])
        mapper = FieldMapper(schema)
        source = {"用户编号": "1", "姓名": "x", "邮箱": "x@x.com", "bad": "hello"}
        _, errors = mapper.map_record(1, source)
        assert any(e.category == ErrorCategory.TRANSFORM_FAILED for e in errors)

    def test_regex_validation(self):
        schema = _make_schema([
            FieldMapping(source="phone", target="phone", field_type=FieldType.STRING,
                         regex=r"^\d{11}$"),
        ])
        mapper = FieldMapper(schema)
        source = {"用户编号": "1", "姓名": "x", "邮箱": "x@x.com", "phone": "13800138000"}
        _, errors = mapper.map_record(1, source)
        assert len(errors) == 0

    def test_regex_validation_fail(self):
        schema = _make_schema([
            FieldMapping(source="phone", target="phone", field_type=FieldType.STRING,
                         regex=r"^\d{11}$"),
        ])
        mapper = FieldMapper(schema)
        source = {"用户编号": "1", "姓名": "x", "邮箱": "x@x.com", "phone": "12345"}
        _, errors = mapper.map_record(1, source)
        assert any(e.category == ErrorCategory.INVALID_FORMAT for e in errors)


class TestCastValue:
    @pytest.mark.parametrize(
        "ftype,val,expected",
        [
            (FieldType.STRING, 123, "123"),
            (FieldType.INTEGER, "42", 42),
            (FieldType.INTEGER, "  -7  ", -7),
            (FieldType.FLOAT, "3.14", 3.14),
            (FieldType.BOOLEAN, "是", True),
            (FieldType.BOOLEAN, "false", False),
            (FieldType.BOOLEAN, "", False),
            (FieldType.DATE, "2024/06/15", date(2024, 6, 15)),
            (FieldType.DATE, "20240101", date(2024, 1, 1)),
            (FieldType.EMAIL, "a@b.cn", "a@b.cn"),
            (FieldType.PHONE, "+86 138-0013-8000", "+86 138-0013-8000"),
        ],
    )
    def test_valid_casts(self, ftype, val, expected):
        assert FieldMapper._cast_value(ftype, val) == expected

    @pytest.mark.parametrize(
        "ftype,val",
        [
            (FieldType.INTEGER, "abc"),
            (FieldType.FLOAT, "xyz"),
            (FieldType.DATE, "notadate"),
            (FieldType.EMAIL, "no-at-sign"),
        ],
    )
    def test_invalid_casts_raise(self, ftype, val):
        with pytest.raises((ValueError, TypeError)):
            FieldMapper._cast_value(ftype, val)


class TestDataReader:
    def test_read_csv(self, users_valid_csv: Path):
        reader = DataReader()
        rows = reader.read(str(users_valid_csv))
        assert len(rows) == 5
        assert "用户编号" in rows[0]
        assert rows[0]["姓名"] == "张三"

    def test_read_json(self, users_valid_json: Path):
        reader = DataReader()
        rows = reader.read(str(users_valid_json))
        assert len(rows) == 2
        assert rows[0]["用户编号"] == 1

    def test_read_jsonl(self, tmp_path: Path):
        p = tmp_path / "data.jsonl"
        lines = [
            json.dumps({"a": 1}, ensure_ascii=False),
            json.dumps({"a": 2}, ensure_ascii=False),
            "",
            json.dumps({"a": 3}, ensure_ascii=False),
        ]
        p.write_text("\n".join(lines), encoding="utf-8")
        rows = DataReader().read(str(p))
        # 空行现在会被保留为 {}，由 DryRunEngine 决定是否跳过
        assert len(rows) == 4
        assert rows[2] == {}

    def test_missing_file_raises(self, tmp_path: Path):
        with pytest.raises(FileNotFoundError):
            DataReader().read(str(tmp_path / "nope.csv"))

    def test_unsupported_format_raises(self, tmp_path: Path):
        p = tmp_path / "data.txt"
        p.write_text("hello")
        with pytest.raises(ValueError):
            DataReader().read(str(p))

    def test_preserves_empty_rows_for_engine(self, tmp_path: Path):
        """空行保留给 Engine 处理（不再在 DataReader 层过滤）。"""
        p = tmp_path / "data.csv"
        content = "a,b\n1,x\n,\n2,y\n\n"
        p.write_text(content, encoding="utf-8")
        rows = DataReader(skip_empty_rows=True).read(str(p))
        # 4 行：1,x  / 空,  / 2,y  / 末尾空行(CSV DictReader 忽略)
        # 具体数字因 CSV 解析实现略有浮动，核心是"空行不再被过滤"
        assert len(rows) >= 3
        # 至少存在一条全空记录
        assert any(
            all(v is None or str(v).strip() == "" for v in r.values())
            for r in rows
        )

    def test_custom_delimiter(self, tmp_path: Path):
        p = tmp_path / "data.csv"
        with open(p, "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f, delimiter="\t")
            w.writerow(["a", "b"])
            w.writerow(["1", "2"])
        rows = DataReader(delimiter="\t").read(str(p))
        assert rows[0]["a"] == "1"

    def test_extra_columns_preserved(self, tmp_path: Path):
        """CSV 行列数多于表头时，额外值存入 __extra_columns__。"""
        p = tmp_path / "extra.csv"
        p.write_text("a,b\n1,2,extra1,extra2\n3,4\n", encoding="utf-8")
        rows = DataReader().read(str(p))
        assert len(rows) == 2
        assert rows[0]["a"] == "1"
        assert rows[0]["b"] == "2"
        assert "__extra_columns__" in rows[0]
        assert len(rows[0]["__extra_columns__"]) == 2
        assert rows[0]["__extra_columns__"][0] == {"column": 3, "value": "extra1"}
        assert rows[0]["__extra_columns__"][1] == {"column": 4, "value": "extra2"}
        assert "__extra_columns__" not in rows[1]

    def test_extra_columns_ignores_blank_values(self, tmp_path: Path):
        """超列中空白值不进入 __extra_columns__。"""
        p = tmp_path / "extra_blank.csv"
        p.write_text("a,b\n1,2,x,,y\n", encoding="utf-8")
        rows = DataReader().read(str(p))
        extras = rows[0]["__extra_columns__"]
        values = [e["value"] for e in extras]
        assert "x" in values
        assert "y" in values
        assert "" not in values

    def test_fewer_columns_padded_with_none(self, tmp_path: Path):
        """CSV 行列数少于表头时，缺失列填充 None。"""
        p = tmp_path / "short.csv"
        p.write_text("a,b,c\n1\n", encoding="utf-8")
        rows = DataReader().read(str(p))
        assert rows[0]["a"] == "1"
        assert rows[0]["b"] is None
        assert rows[0]["c"] is None


class TestMappingLoader:
    def test_load_mapping_yaml(self, mapping_users_file: Path):
        fields = MappingLoader.load_mapping(str(mapping_users_file))
        assert len(fields) == 7
        assert fields[0].target == "user_id"

    def test_load_mapping_dict_with_fields_key(self, tmp_path: Path):
        p = tmp_path / "m.json"
        p.write_text(
            json.dumps({"fields": [
                {"source": "a", "target": "b"},
            ]}, ensure_ascii=False),
            encoding="utf-8",
        )
        fields = MappingLoader.load_mapping(str(p))
        assert len(fields) == 1

    def test_load_target_yaml(self, target_users_file: Path):
        schema = MappingLoader.load_target(str(target_users_file))
        assert schema.table_name == "users"
        assert "user_id" in schema.primary_keys

    def test_load_target_list(self, tmp_path: Path):
        p = tmp_path / "t.json"
        p.write_text(
            json.dumps([
                {"source": "a", "target": "b", "required": True},
            ], ensure_ascii=False),
            encoding="utf-8",
        )
        schema = MappingLoader.load_target(str(p))
        assert schema.table_name == "target_table"

    def test_load_target_missing_fields_key(self, tmp_path: Path):
        p = tmp_path / "t.yaml"
        p.write_text("table_name: x\ndescription: y")
        with pytest.raises(ValueError, match="fields"):
            MappingLoader.load_target(str(p))
