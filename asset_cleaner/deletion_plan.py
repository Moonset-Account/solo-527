"""删除计划管理 - 安全的文件删除机制"""

import os
import json
import shutil
import tempfile
import hashlib
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass, field, asdict

from .path_utils import normalize_path, normalize_relative


LOCK_FILENAME = ".asset-cleaner-lock.json"
UNDO_DIR = ".asset-cleaner-undo"


@dataclass
class FileInfo:
    """文件信息"""
    path: str
    relative_path: str
    size: int
    hash: str
    exists: bool = True


@dataclass
class DeletionEntry:
    """删除条目"""
    file_info: FileInfo
    reason: str
    backup_path: Optional[str] = None
    deleted: bool = False
    error: Optional[str] = None


@dataclass
class DeletionPlan:
    """删除计划"""
    id: str
    created_at: str
    root_dir: str
    entries: List[DeletionEntry] = field(default_factory=list)
    dry_run: bool = True
    applied: bool = False

    @property
    def file_count(self) -> int:
        return len(self.entries)

    @property
    def deleted_count(self) -> int:
        return sum(1 for e in self.entries if e.deleted)

    @property
    def failed_count(self) -> int:
        return sum(1 for e in self.entries if e.error is not None)

    @property
    def total_size(self) -> int:
        return sum(e.file_info.size for e in self.entries if e.file_info)


def calculate_file_hash(file_path: str, chunk_size: int = 8192) -> str:
    """计算文件SHA256哈希"""
    sha256 = hashlib.sha256()
    try:
        with open(file_path, 'rb') as f:
            while chunk := f.read(chunk_size):
                sha256.update(chunk)
        return sha256.hexdigest()
    except (OSError, IOError):
        return ""


def get_file_info(file_path: str, root_dir: str) -> Optional[FileInfo]:
    """获取文件信息"""
    abs_path = normalize_path(file_path)
    try:
        stat = os.stat(abs_path)
        return FileInfo(
            path=abs_path,
            relative_path=normalize_relative(abs_path, root_dir),
            size=stat.st_size,
            hash=calculate_file_hash(abs_path),
            exists=True,
        )
    except (OSError, IOError):
        return None


class DeletionPlanner:
    """删除计划管理器"""

    def __init__(self, root_dir: str | os.PathLike):
        self.root_dir = normalize_path(root_dir)
        self.undo_dir = os.path.join(self.root_dir, UNDO_DIR)
        self.lock_file = os.path.join(self.root_dir, LOCK_FILENAME)

    def create_plan(
        self,
        files: List[str],
        reasons: Optional[Dict[str, str]] = None,
        dry_run: bool = True,
    ) -> DeletionPlan:
        """创建删除计划"""
        reasons = reasons or {}
        plan_id = datetime.now().strftime("%Y%m%d_%H%M%S")

        entries: List[DeletionEntry] = []

        for file_path in files:
            file_info = get_file_info(file_path, self.root_dir)
            if file_info is None:
                continue

            reason = reasons.get(file_path, "未引用的资源文件")
            entries.append(DeletionEntry(
                file_info=file_info,
                reason=reason,
            ))

        plan = DeletionPlan(
            id=plan_id,
            created_at=datetime.now().isoformat(),
            root_dir=self.root_dir,
            entries=entries,
            dry_run=dry_run,
        )

        return plan

    def write_lock_file(self, plan: DeletionPlan) -> str:
        """将计划写入锁定文件"""
        lock_data = {
            "plan_id": plan.id,
            "created_at": plan.created_at,
            "root_dir": plan.root_dir,
            "dry_run": plan.dry_run,
            "applied": plan.applied,
            "total_size": plan.total_size,
            "entries": [
                {
                    "path": e.file_info.path,
                    "relative_path": e.file_info.relative_path,
                    "size": e.file_info.size,
                    "hash": e.file_info.hash,
                    "reason": e.reason,
                    "backup_path": e.backup_path,
                    "deleted": e.deleted,
                    "error": e.error,
                }
                for e in plan.entries
            ],
        }

        with open(self.lock_file, 'w', encoding='utf-8') as f:
            json.dump(lock_data, f, indent=2, ensure_ascii=False)

        return self.lock_file

    def read_lock_file(self) -> Optional[DeletionPlan]:
        """从锁定文件读取计划"""
        if not os.path.exists(self.lock_file):
            return None

        try:
            with open(self.lock_file, 'r', encoding='utf-8') as f:
                lock_data = json.load(f)

            entries = [
                DeletionEntry(
                    file_info=FileInfo(
                        path=e["path"],
                        relative_path=e["relative_path"],
                        size=e["size"],
                        hash=e["hash"],
                    ),
                    reason=e["reason"],
                    backup_path=e.get("backup_path"),
                    deleted=e.get("deleted", False),
                    error=e.get("error"),
                )
                for e in lock_data["entries"]
            ]

            return DeletionPlan(
                id=lock_data["plan_id"],
                created_at=lock_data["created_at"],
                root_dir=lock_data["root_dir"],
                entries=entries,
                dry_run=lock_data.get("dry_run", True),
                applied=lock_data.get("applied", False),
            )
        except (json.JSONDecodeError, KeyError, OSError):
            return None

    def apply_plan(
        self,
        plan: DeletionPlan,
        create_backup: bool = True,
    ) -> DeletionPlan:
        """应用删除计划"""
        if plan.dry_run:
            plan.dry_run = False
            self.write_lock_file(plan)
            return plan

        if create_backup:
            self._ensure_undo_dir()

        for entry in plan.entries:
            if entry.deleted or entry.error:
                continue

            try:
                if create_backup:
                    backup_path = self._create_backup(entry.file_info)
                    entry.backup_path = backup_path

                os.remove(entry.file_info.path)
                entry.deleted = True

            except OSError as e:
                entry.error = str(e)

        plan.applied = True
        self.write_lock_file(plan)
        if create_backup:
            self._create_undo_manifest(plan)

        return plan

    def undo_deletion(self, plan_id: Optional[str] = None) -> Tuple[int, int]:
        """撤销删除"""
        if plan_id:
            plan = self._load_undo_plan(plan_id)
        else:
            plan = self.read_lock_file()

        if plan is None:
            return 0, 0

        restored = 0
        failed = 0

        for entry in plan.entries:
            if not entry.deleted or not entry.backup_path:
                continue

            try:
                if os.path.exists(entry.backup_path):
                    dest_dir = os.path.dirname(entry.file_info.path)
                    os.makedirs(dest_dir, exist_ok=True)
                    shutil.move(entry.backup_path, entry.file_info.path)
                    entry.deleted = False
                    restored += 1
                else:
                    failed += 1
            except OSError:
                failed += 1

        if restored > 0:
            self.write_lock_file(plan)

        return restored, failed

    def list_undo_plans(self) -> List[str]:
        """列出可用的撤销计划"""
        if not os.path.exists(self.undo_dir):
            return []

        plans = []
        for item in os.listdir(self.undo_dir):
            if item.endswith('.json'):
                plan_id = item.replace('.json', '')
                plans.append(plan_id)

        return sorted(plans, reverse=True)

    def _ensure_undo_dir(self) -> None:
        """确保撤销目录存在"""
        os.makedirs(self.undo_dir, exist_ok=True)

        gitignore_path = os.path.join(self.undo_dir, '.gitignore')
        if not os.path.exists(gitignore_path):
            with open(gitignore_path, 'w') as f:
                f.write("# 自动生成 - Asset Cleaner 撤销目录\n*\n!.gitignore\n")

    def _create_backup(self, file_info: FileInfo) -> str:
        """创建文件备份"""
        self._ensure_undo_dir()
        rel_path = file_info.relative_path.replace('/', '_').replace('\\', '_')
        backup_name = f"{file_info.hash}_{rel_path}"
        backup_path = os.path.join(self.undo_dir, backup_name)

        if not os.path.exists(backup_path):
            shutil.copy2(file_info.path, backup_path)

        return backup_path

    def _create_undo_manifest(self, plan: DeletionPlan) -> None:
        """创建撤销清单"""
        self._ensure_undo_dir()
        manifest_path = os.path.join(self.undo_dir, f"{plan.id}.json")

        manifest = {
            "plan_id": plan.id,
            "created_at": plan.created_at,
            "applied_at": datetime.now().isoformat(),
            "entries": [
                {
                    "original_path": e.file_info.path,
                    "relative_path": e.file_info.relative_path,
                    "backup_path": e.backup_path,
                    "size": e.file_info.size,
                    "hash": e.file_info.hash,
                    "deleted": e.deleted,
                    "error": e.error,
                }
                for e in plan.entries
            ],
        }

        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

    def _load_undo_plan(self, plan_id: str) -> Optional[DeletionPlan]:
        """从撤销清单加载计划"""
        manifest_path = os.path.join(self.undo_dir, f"{plan_id}.json")
        if not os.path.exists(manifest_path):
            return None

        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)

            entries = [
                DeletionEntry(
                    file_info=FileInfo(
                        path=e["original_path"],
                        relative_path=e["relative_path"],
                        size=e["size"],
                        hash=e["hash"],
                        exists=not e["deleted"],
                    ),
                    reason="撤销删除",
                    backup_path=e.get("backup_path"),
                    deleted=e.get("deleted", False),
                    error=e.get("error"),
                )
                for e in manifest["entries"]
            ]

            return DeletionPlan(
                id=plan_id,
                created_at=manifest["created_at"],
                root_dir=self.root_dir,
                entries=entries,
                dry_run=False,
                applied=True,
            )
        except (json.JSONDecodeError, KeyError, OSError):
            return None

    def clear_lock_file(self) -> bool:
        """清除锁定文件"""
        if os.path.exists(self.lock_file):
            try:
                os.remove(self.lock_file)
                return True
            except OSError:
                return False
        return False

    def has_lock_file(self) -> bool:
        """检查是否存在锁定文件"""
        return os.path.exists(self.lock_file)


def format_size(size_bytes: int) -> str:
    """格式化文件大小"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"
