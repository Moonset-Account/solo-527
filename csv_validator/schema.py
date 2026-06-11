"""Schema定义与加载模块。

Schema定义CSV文件的结构和校验规则，包括：
- 列名与字段类型
- 必填/选填标记
- 枚举值范围
- 唯一键组合
- 数值范围、正则格式等附加约束

Schema以JSON格式存储，支持从文件或字符串加载。
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional, Tuple

from csv_validator.errors import ValidationError, ExitCode


SUPPORTED_TYPES = {"string", "integer", "float", "boolean", "date", "datetime"}


@dataclass
class FieldSchema:
    """单个字段的Schema定义。

    Attributes:
        name: 列名（CSV表头中的字段名）
        type: 数据类型，见 SUPPORTED_TYPES
        required: 是否必填
        unique: 是否唯一键（单字段唯一）
        enum: 允许的枚举值列表
        min_value: 数值最小值（int/float）
        max_value: 数值最大值（int/float）
        pattern: 正则表达式模式（string类型）
        format: 日期时间格式字符串（如 "%Y-%m-%d"）
        description: 字段描述
    """

    name: str
    type: str = "string"
    required: bool = False
    unique: bool = False
    enum: Optional[List[Any]] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    pattern: Optional[str] = None
    format: Optional[str] = None
    description: str = ""

    def __post_init__(self) -> None:
        """初始化后验证字段定义的合法性。"""
        if self.type not in SUPPORTED_TYPES:
            raise ValidationError(
                f"字段[{self.name}]的类型不支持: {self.type}. "
                f"支持的类型: {', '.join(sorted(SUPPORTED_TYPES))}",
                exit_code=ExitCode.SCHEMA_ERROR,
            )
        if self.pattern:
            try:
                re.compile(self.pattern)
            except re.error as e:
                raise ValidationError(
                    f"字段[{self.name}]的正则表达式无效: {e}",
                    exit_code=ExitCode.SCHEMA_ERROR,
                )

    def to_dict(self) -> Dict[str, Any]:
        result = {
            "name": self.name,
            "type": self.type,
            "required": self.required,
            "unique": self.unique,
        }
        if self.enum is not None:
            result["enum"] = self.enum
        if self.min_value is not None:
            result["min_value"] = self.min_value
        if self.max_value is not None:
            result["max_value"] = self.max_value
        if self.pattern is not None:
            result["pattern"] = self.pattern
        if self.format is not None:
            result["format"] = self.format
        if self.description:
            result["description"] = self.description
        return result


@dataclass
class Schema:
    """CSV文件的完整Schema定义。

    Attributes:
        fields: 所有字段的定义列表（有序）
        unique_keys: 多字段组合唯一键（可选），例如 [["order_id"], ["user_id", "order_date"]]
        strict: 是否严格模式：不允许Schema中未定义的列
        description: Schema描述
    """

    fields: List[FieldSchema]
    unique_keys: List[List[str]] = field(default_factory=list)
    strict: bool = False
    description: str = ""

    def get_field(self, name: str) -> Optional[FieldSchema]:
        """按列名查找字段定义。"""
        for f in self.fields:
            if f.name == name:
                return f
        return None

    @property
    def field_names(self) -> List[str]:
        """所有字段名列表。"""
        return [f.name for f in self.fields]

    @property
    def required_fields(self) -> List[str]:
        """必填字段名列表。"""
        return [f.name for f in self.fields if f.required]

    @property
    def unique_fields(self) -> List[str]:
        """声明为单字段唯一的字段名列表。"""
        return [f.name for f in self.fields if f.unique]

    def to_dict(self) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "fields": [f.to_dict() for f in self.fields],
        }
        if self.unique_keys:
            result["unique_keys"] = self.unique_keys
        if self.strict:
            result["strict"] = self.strict
        if self.description:
            result["description"] = self.description
        return result


class SchemaLoader:
    """Schema加载器：从JSON文件或字典构造Schema对象。"""

    @classmethod
    def from_file(cls, path: str) -> Schema:
        """从JSON文件加载Schema。

        Args:
            path: Schema JSON文件路径

        Raises:
            ValidationError: 文件不存在或JSON格式错误或Schema定义非法
        """
        try:
            with open(path, "r", encoding="utf-8") as fp:
                data = json.load(fp)
        except FileNotFoundError:
            raise ValidationError(
                f"Schema文件不存在: {path}",
                exit_code=ExitCode.SCHEMA_ERROR,
            )
        except json.JSONDecodeError as e:
            raise ValidationError(
                f"Schema文件不是合法JSON: {e}",
                exit_code=ExitCode.SCHEMA_ERROR,
            )
        except OSError as e:
            raise ValidationError(
                f"读取Schema文件失败: {e}",
                exit_code=ExitCode.IO_ERROR,
            )
        return cls.from_dict(data)

    @classmethod
    def from_string(cls, json_str: str) -> Schema:
        """从JSON字符串加载Schema。"""
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValidationError(
                f"Schema JSON解析失败: {e}",
                exit_code=ExitCode.SCHEMA_ERROR,
            )
        return cls.from_dict(data)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Schema:
        """从字典构造Schema对象。

        数据结构示例::

            {
                "fields": [
                    {"name": "id", "type": "integer", "required": true, "unique": true},
                    {"name": "status", "type": "string", "enum": ["active", "inactive"]}
                ],
                "unique_keys": [["user_id", "order_id"]],
                "strict": false,
                "description": "订单数据Schema"
            }
        """
        if "fields" not in data or not isinstance(data["fields"], list):
            raise ValidationError(
                "Schema必须包含 'fields' 列表",
                exit_code=ExitCode.SCHEMA_ERROR,
            )

        fields: List[FieldSchema] = []
        field_names: set = set()
        for idx, field_data in enumerate(data["fields"]):
            if not isinstance(field_data, dict):
                raise ValidationError(
                    f"fields[{idx}] 必须是对象",
                    exit_code=ExitCode.SCHEMA_ERROR,
                )
            if "name" not in field_data:
                raise ValidationError(
                    f"fields[{idx}] 缺少必填属性 'name'",
                    exit_code=ExitCode.SCHEMA_ERROR,
                )
            name = field_data["name"]
            if name in field_names:
                raise ValidationError(
                    f"重复的字段名: {name}",
                    exit_code=ExitCode.SCHEMA_ERROR,
                )
            field_names.add(name)
            fields.append(FieldSchema(**{k: v for k, v in field_data.items() if k in FieldSchema.__dataclass_fields__}))

        unique_keys: List[List[str]] = []
        if "unique_keys" in data:
            if not isinstance(data["unique_keys"], list):
                raise ValidationError(
                    "'unique_keys' 必须是列表",
                    exit_code=ExitCode.SCHEMA_ERROR,
                )
            for idx, uk in enumerate(data["unique_keys"]):
                if not isinstance(uk, list) or not all(isinstance(x, str) for x in uk):
                    raise ValidationError(
                        f"unique_keys[{idx}] 必须是字符串列表",
                        exit_code=ExitCode.SCHEMA_ERROR,
                    )
                for col in uk:
                    if col not in field_names:
                        raise ValidationError(
                            f"unique_keys[{idx}] 包含未定义的字段: {col}",
                            exit_code=ExitCode.SCHEMA_ERROR,
                        )
                unique_keys.append(uk)

        strict = bool(data.get("strict", False))
        description = data.get("description", "")
        return Schema(fields=fields, unique_keys=unique_keys, strict=strict, description=description)
