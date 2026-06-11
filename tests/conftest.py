"""
pytest 配置和共享夹具。
"""

from __future__ import annotations

import json
import os
import csv
from pathlib import Path
from typing import Any, Dict, Generator, List

import pytest
import yaml


# ----------------------------------------------------------------------
#  目标表结构夹具
# ----------------------------------------------------------------------
@pytest.fixture
def target_schema_users():
    """标准用户表结构。"""
    return {
        "table_name": "users",
        "description": "用户主表",
        "primary_keys": ["user_id"],
        "unique_constraints": [["email"]],
        "fields": [
            {
                "source": "用户编号",
                "target": "user_id",
                "required": True,
                "field_type": "integer",
                "is_primary_key": True,
                "description": "用户ID",
            },
            {
                "source": "姓名",
                "target": "username",
                "required": True,
                "field_type": "string",
                "transform": "strip()",
                "min_value": None,
                "max_value": None,
            },
            {
                "source": "邮箱",
                "target": "email",
                "required": True,
                "field_type": "email",
                "transform": "lower().strip()",
            },
            {
                "source": "年龄",
                "target": "age",
                "required": False,
                "field_type": "integer",
                "min_value": 0,
                "max_value": 150,
            },
            {
                "source": "注册日期",
                "target": "register_date",
                "required": False,
                "field_type": "date",
            },
            {
                "source": "是否VIP",
                "target": "is_vip",
                "required": False,
                "field_type": "boolean",
                "default": False,
            },
            {
                "source": "用户类型",
                "target": "user_type",
                "required": False,
                "field_type": "enum",
                "allowed_values": ["普通", "银牌", "金牌", "钻石"],
                "default": "普通",
            },
        ],
    }


@pytest.fixture
def mapping_users_file(target_schema_users, tmp_path: Path) -> Path:
    """临时 mapping YAML 文件。"""
    p = tmp_path / "mapping_users.yaml"
    with open(p, "w", encoding="utf-8") as f:
        yaml.safe_dump(target_schema_users["fields"], f, allow_unicode=True)
    return p


@pytest.fixture
def target_users_file(target_schema_users, tmp_path: Path) -> Path:
    """临时 target YAML 文件。"""
    p = tmp_path / "target_users.yaml"
    with open(p, "w", encoding="utf-8") as f:
        yaml.safe_dump(target_schema_users, f, allow_unicode=True)
    return p


# ----------------------------------------------------------------------
#  小样本数据夹具
# ----------------------------------------------------------------------
@pytest.fixture
def users_valid_csv(tmp_path: Path) -> Path:
    """完全合法的 5 行 CSV。"""
    p = tmp_path / "users_valid.csv"
    with open(p, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["用户编号", "姓名", "邮箱", "年龄", "注册日期", "是否VIP", "用户类型"])
        writer.writerow(["1", "张三", "Zhang@example.com", "28", "2024-01-15", "是", "金牌"])
        writer.writerow(["2", " 李四 ", "Lisi@test.cn", "35", "2023/06/01", "否", "普通"])
        writer.writerow(["3", "王五", "wangwu@example.com", "42", "20220312", "", "银牌"])
        writer.writerow(["4", "赵六", "zhaoliu@example.com", "", "2024-05-20", "true", "钻石"])
        writer.writerow(["5", "孙七", "sunqi@example.com", "19", "2025-02-28", "false", "普通"])
    return p


@pytest.fixture
def users_with_errors_csv(tmp_path: Path) -> Path:
    """包含各种常见错误的 10 行 CSV。"""
    p = tmp_path / "users_with_errors.csv"
    with open(p, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["用户编号", "姓名", "邮箱", "年龄", "注册日期", "是否VIP", "用户类型", "备注"])
        writer.writerow(["1", "张三", "invalid-email", "28", "2024-01-15", "是", "金牌", "正常用户"])
        writer.writerow(["", "李四", "lisi@test.cn", "35", "2023/06/01", "否", "普通", "缺少必填"])
        writer.writerow(["3", "", "wangwu@example.com", "42", "not-a-date", "", "银牌", "缺少姓名"])
        writer.writerow(["4", "赵六", "dup@dup.com", "-5", "2024-05-20", "true", "铂金", "负值年龄"])
        writer.writerow(["1", "重复1号", "dup@dup.com", "999", "2025-01-01", "false", "普通", "主键重复"])
        writer.writerow(["6", "钱七", "qianqi@example.com", "30", "2024-02-29", "是", "普通", "无效日期"])
        writer.writerow(["7", "  ", "user7@example.com", "200", "2024-02-01", "", "", "超年龄越界"])
        writer.writerow(["8", "孙八", "sun8@example.com", "abc", "2024/13/40", "否", "普通", "类型错误"])
        writer.writerow(["", "", "", "", "", "", "", ""])
        writer.writerow(["10", "周十", "zhou10@example.com", "25", "2024-06-01", "yes", "银牌", "合法"])
    return p


@pytest.fixture
def users_valid_json(tmp_path: Path) -> Path:
    p = tmp_path / "users_valid.json"
    data = [
        {"用户编号": 1, "姓名": "张三", "邮箱": "zhang@example.com", "年龄": 28, "注册日期": "2024-01-15", "是否VIP": True, "用户类型": "金牌"},
        {"用户编号": 2, "姓名": "李四", "邮箱": "lisi@test.cn", "年龄": 35, "注册日期": "2023-06-01", "是否VIP": False, "用户类型": "普通"},
    ]
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    return p


# ----------------------------------------------------------------------
#  大批量样本夹具 (10000 条，其中 10% 有错误)
# ----------------------------------------------------------------------
@pytest.fixture
def users_large_csv(tmp_path: Path) -> Path:
    """10000 行批量数据，含 1000 条错误。"""
    p = tmp_path / "users_large.csv"
    user_types = ["普通", "银牌", "金牌", "钻石"]
    with open(p, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["用户编号", "姓名", "邮箱", "年龄", "注册日期", "是否VIP", "用户类型"])
        for i in range(1, 10001):
            uid = i
            name = f"用户{i}"
            email = f"user{i}@example.com"
            age = 20 + (i % 60)
            month = (i % 12) + 1
            day = ((i * 3) % 28) + 1
            date_str = f"2024-{month:02d}-{day:02d}"
            vip = "是" if i % 3 == 0 else "否"
            ut = user_types[i % 4]

            if i % 10 == 0:
                if i % 30 == 0:
                    name = "  "
                elif i % 50 == 0:
                    email = f"bad-email-{i}"
                elif i % 70 == 0:
                    age = -i
                elif i % 90 == 0:
                    ut = "未知等级"
                else:
                    uid = ""

            writer.writerow([
                str(uid) if uid != "" else "",
                name,
                email,
                str(age),
                date_str,
                vip,
                ut,
            ])
    return p


@pytest.fixture
def users_large_20k(tmp_path: Path) -> Path:
    """20000 行批量，含 2000 条错误，用于性能测试。"""
    p = tmp_path / "users_large_20k.csv"
    user_types = ["普通", "银牌", "金牌", "钻石"]
    with open(p, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["用户编号", "姓名", "邮箱", "年龄", "注册日期", "是否VIP", "用户类型"])
        for i in range(1, 20001):
            name = f"用户{i}"
            email = f"user{i}@corp.example.com"
            age = 18 + (i % 55)
            m = (i % 12) + 1
            d = ((i * 7) % 28) + 1
            date_str = f"2024-{m:02d}-{d:02d}"
            vip = "true" if i % 4 == 0 else "false"
            ut = user_types[i % len(user_types)]

            error_flag = i % 10 == 0
            writer.writerow([
                "" if (error_flag and i % 40 == 0) else str(i),
                "   " if (error_flag and i % 60 == 0) else name,
                f"notemail{i}" if (error_flag and i % 50 == 0) else email,
                "abc" if (error_flag and i % 80 == 0) else str(age),
                date_str,
                vip,
                "外星等级" if (error_flag and i % 100 == 0) else ut,
            ])
    return p


# ----------------------------------------------------------------------
#  配置文件夹具
# ----------------------------------------------------------------------
@pytest.fixture
def config_file_complete(
    tmp_path: Path, mapping_users_file: Path, target_users_file: Path
) -> Path:
    """完整的配置文件示例。"""
    p = tmp_path / "import-dryrun.yaml"
    data = {
        "mapping_file": str(mapping_users_file),
        "target_file": str(target_users_file),
        "sample_errors": 3,
        "limit": 100,
        "verbose": False,
        "dry_run": True,
        "strict_mode": False,
        "skip_empty_rows": True,
    }
    with open(p, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, allow_unicode=True)
    return p


@pytest.fixture
def config_file_json(tmp_path: Path) -> Path:
    """JSON 格式配置文件。"""
    p = tmp_path / ".import-dryrun.json"
    data = {
        "sample_errors": 7,
        "verbose": True,
        "strict_mode": True,
    }
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return p


# ----------------------------------------------------------------------
#  环境变量隔离
# ----------------------------------------------------------------------
@pytest.fixture
def clean_env(monkeypatch) -> Generator[None, None, None]:
    """清除所有 IMPORTDRYRUN_ 环境变量。"""
    to_remove = [k for k in os.environ if k.startswith("IMPORTDRYRUN_")]
    for k in to_remove:
        monkeypatch.delenv(k, raising=False)
    yield


# ----------------------------------------------------------------------
#  内存数据行夹具 (不涉及文件 I/O)
# ----------------------------------------------------------------------
@pytest.fixture
def sample_source_rows() -> List[Dict[str, Any]]:
    """内存中的源数据，便于快速单元测试。"""
    return [
        {"用户编号": "101", "姓名": "测试用户", "邮箱": "t1@t.com", "年龄": "30", "注册日期": "2024-06-01", "是否VIP": "是", "用户类型": "普通"},
        {"用户编号": "102", "姓名": "测试2号", "邮箱": "t2@t.com", "年龄": "25", "注册日期": "2024-06-02", "是否VIP": "否", "用户类型": "金牌"},
    ]


@pytest.fixture
def sample_source_rows_errors() -> List[Dict[str, Any]]:
    """带各种错误的内存数据。"""
    return [
        {"用户编号": "", "姓名": "", "邮箱": "bademail", "年龄": "-1", "注册日期": "2024/13/40", "是否VIP": "maybe", "用户类型": "王者"},
        {"用户编号": "201", "姓名": " ", "邮箱": "good@ok.com", "年龄": "30", "注册日期": "2024-01-01", "是否VIP": "true", "用户类型": "普通"},
        {"用户编号": "201", "姓名": "重复号", "邮箱": "dup@ok.com", "年龄": "20", "注册日期": "2024-01-02", "是否VIP": "false", "用户类型": "银牌"},
    ]
