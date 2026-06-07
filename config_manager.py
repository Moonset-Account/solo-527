"""
配置管理模块
处理注释、定时报表、权限配置的持久化
"""
import json
import os
from datetime import datetime
from typing import Dict, List, Optional


CONFIG_DIR = "config"
ANNOTATIONS_FILE = os.path.join(CONFIG_DIR, "annotations.json")
SCHEDULE_FILE = os.path.join(CONFIG_DIR, "schedule_config.json")
PERMISSION_FILE = os.path.join(CONFIG_DIR, "permission_config.json")


def _ensure_config_dir():
    """确保配置目录存在"""
    os.makedirs(CONFIG_DIR, exist_ok=True)


def load_annotations() -> Dict[str, dict]:
    """加载注释"""
    _ensure_config_dir()
    if os.path.exists(ANNOTATIONS_FILE):
        with open(ANNOTATIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_annotations(annotations: Dict[str, dict]):
    """保存注释"""
    _ensure_config_dir()
    with open(ANNOTATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(annotations, f, ensure_ascii=False, indent=2)


def add_annotation(visit_id: str, comment: str, author: str = "运营分析员") -> dict:
    """添加注释"""
    annotations = load_annotations()
    annotation = {
        "visit_id": visit_id,
        "comment": comment,
        "author": author,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    annotations[visit_id] = annotation
    save_annotations(annotations)
    return annotation


def get_annotation(visit_id: str) -> Optional[dict]:
    """获取单条注释"""
    annotations = load_annotations()
    return annotations.get(visit_id)


def load_schedule_config() -> dict:
    """加载定时报表配置"""
    _ensure_config_dir()
    if os.path.exists(SCHEDULE_FILE):
        with open(SCHEDULE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "frequency": "daily",
        "format": "xlsx",
        "email": "",
        "enabled": False,
        "last_run": None
    }


def save_schedule_config(config: dict):
    """保存定时报表配置"""
    _ensure_config_dir()
    config["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(SCHEDULE_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def load_permission_config() -> dict:
    """加载权限配置"""
    _ensure_config_dir()
    if os.path.exists(PERMISSION_FILE):
        with open(PERMISSION_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "current_role": "admin",
        "desensitize": True,
        "allow_export": True,
        "allowed_depts": [],
        "allowed_doctors": [],
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


def save_permission_config(config: dict):
    """保存权限配置"""
    _ensure_config_dir()
    config["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(PERMISSION_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def apply_permission_filter(df, permission_config: dict):
    """根据权限配置过滤数据"""
    role = permission_config.get("current_role", "admin")
    
    filtered = df.copy()
    
    if role == "dept_head":
        allowed_depts = permission_config.get("allowed_depts", [])
        if allowed_depts:
            filtered = filtered[filtered["dept_name"].isin(allowed_depts)]
    
    elif role == "doctor":
        allowed_doctors = permission_config.get("allowed_doctors", [])
        if allowed_doctors:
            filtered = filtered[filtered["doctor_name"].isin(allowed_doctors)]
    
    elif role == "analyst":
        pass
    
    if permission_config.get("desensitize", True) and "doctor_name" in filtered.columns:
        filtered["doctor_name"] = filtered["doctor_name"].apply(
            lambda x: x[0] + "医生" if isinstance(x, str) and len(x) > 0 else x
        )
    
    return filtered
