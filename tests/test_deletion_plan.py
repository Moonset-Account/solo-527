"""测试删除计划模块"""

import os
import json
import tempfile
import pytest
from datetime import datetime

from asset_cleaner.deletion_plan import (
    DeletionPlanner,
    DeletionPlan,
    DeletionEntry,
    FileInfo,
    calculate_file_hash,
    get_file_info,
    format_size,
    LOCK_FILENAME,
    UNDO_DIR,
)
from asset_cleaner.path_utils import normalize_path


class TestDeletionPlan:
    """测试删除计划"""

    def test_create_plan(self, tmp_path):
        """测试创建删除计划"""
        file1 = tmp_path / "unused1.png"
        file1.write_text("content1")
        file2 = tmp_path / "unused2.png"
        file2.write_text("content2")

        planner = DeletionPlanner(str(tmp_path))
        plan = planner.create_plan(
            [str(file1), str(file2)],
            dry_run=True,
        )

        assert plan.file_count == 2
        assert plan.dry_run is True
        assert plan.applied is False
        assert len(plan.entries) == 2
        assert plan.total_size > 0

    def test_write_and_read_lock_file(self, tmp_path):
        """测试写入和读取锁定文件"""
        test_file = tmp_path / "test.png"
        test_file.write_text("test content")

        planner = DeletionPlanner(str(tmp_path))
        plan = planner.create_plan([str(test_file)], dry_run=False)

        lock_path = planner.write_lock_file(plan)
        assert os.path.exists(lock_path)
        assert LOCK_FILENAME in lock_path

        read_plan = planner.read_lock_file()
        assert read_plan is not None
        assert read_plan.id == plan.id
        assert read_plan.file_count == 1

    def test_apply_plan_dry_run(self, tmp_path):
        """测试dry-run模式应用计划"""
        test_file = tmp_path / "test.png"
        test_file.write_text("test content")

        planner = DeletionPlanner(str(tmp_path))
        plan = planner.create_plan([str(test_file)], dry_run=True)

        applied = planner.apply_plan(plan, create_backup=True)

        assert applied.dry_run is False
        assert os.path.exists(str(test_file))

    def test_apply_plan_with_deletion(self, tmp_path):
        """测试实际删除文件"""
        test_file = tmp_path / "test.png"
        test_file.write_text("test content")

        planner = DeletionPlanner(str(tmp_path))
        plan = planner.create_plan([str(test_file)], dry_run=False)

        planner.write_lock_file(plan)
        applied = planner.apply_plan(plan, create_backup=True)

        assert applied.deleted_count == 1
        assert not os.path.exists(str(test_file))

        undo_dir = tmp_path / UNDO_DIR
        assert undo_dir.exists()

    def test_undo_deletion(self, tmp_path):
        """测试撤销删除"""
        test_file = tmp_path / "test.png"
        original_content = "test content for undo"
        test_file.write_text(original_content)

        planner = DeletionPlanner(str(tmp_path))
        plan = planner.create_plan([str(test_file)], dry_run=False)
        planner.write_lock_file(plan)
        applied = planner.apply_plan(plan, create_backup=True)

        assert applied.deleted_count == 1
        assert not os.path.exists(str(test_file))

        restored, failed = planner.undo_deletion()

        assert restored == 1
        assert failed == 0
        assert os.path.exists(str(test_file))
        assert test_file.read_text() == original_content

    def test_list_undo_plans(self, tmp_path):
        """测试列出撤销计划"""
        test_file = tmp_path / "test.png"
        test_file.write_text("test")

        planner = DeletionPlanner(str(tmp_path))
        plan = planner.create_plan([str(test_file)], dry_run=False)
        planner.write_lock_file(plan)
        planner.apply_plan(plan, create_backup=True)

        plans = planner.list_undo_plans()
        assert len(plans) >= 1

    def test_calculate_file_hash(self, tmp_path):
        """测试计算文件哈希"""
        test_file = tmp_path / "test.txt"
        content = "test content for hash"
        test_file.write_text(content)

        hash1 = calculate_file_hash(str(test_file))
        hash2 = calculate_file_hash(str(test_file))

        assert hash1 == hash2
        assert len(hash1) == 64

    def test_get_file_info(self, tmp_path):
        """测试获取文件信息"""
        test_file = tmp_path / "test.png"
        content = "test content"
        test_file.write_text(content)

        info = get_file_info(str(test_file), str(tmp_path))

        assert info is not None
        assert info.size == len(content)
        assert info.exists is True
        assert "test.png" in info.relative_path

    def test_format_size(self):
        """测试文件大小格式化"""
        assert format_size(500) == "500 B"
        assert format_size(1024) == "1.0 KB"
        assert format_size(1024 * 1024) == "1.0 MB"
        assert format_size(1024 * 1024 * 1024) == "1.0 GB"

    def test_deletion_plan_properties(self):
        """测试DeletionPlan属性"""
        plan = DeletionPlan(
            id="test123",
            created_at=datetime.now().isoformat(),
            root_dir="/test",
        )

        assert plan.file_count == 0
        assert plan.deleted_count == 0
        assert plan.failed_count == 0

        entry1 = DeletionEntry(
            file_info=FileInfo(
                path="/test/1.png",
                relative_path="1.png",
                size=100,
                hash="abc",
            ),
            reason="unused",
            deleted=True,
        )
        entry2 = DeletionEntry(
            file_info=FileInfo(
                path="/test/2.png",
                relative_path="2.png",
                size=200,
                hash="def",
            ),
            reason="unused",
            error="permission denied",
        )

        plan.entries = [entry1, entry2]

        assert plan.file_count == 2
        assert plan.deleted_count == 1
        assert plan.failed_count == 1
        assert plan.total_size == 300

    def test_has_lock_file(self, tmp_path):
        """测试锁定文件检测"""
        planner = DeletionPlanner(str(tmp_path))
        assert planner.has_lock_file() is False

        plan = DeletionPlan(
            id="test",
            created_at=datetime.now().isoformat(),
            root_dir=str(tmp_path),
        )
        planner.write_lock_file(plan)

        assert planner.has_lock_file() is True

    def test_clear_lock_file(self, tmp_path):
        """测试清除锁定文件"""
        planner = DeletionPlanner(str(tmp_path))

        plan = DeletionPlan(
            id="test",
            created_at=datetime.now().isoformat(),
            root_dir=str(tmp_path),
        )
        planner.write_lock_file(plan)

        assert planner.clear_lock_file() is True
        assert planner.has_lock_file() is False
        assert planner.clear_lock_file() is False

    def test_apply_plan_without_backup(self, tmp_path):
        """测试不创建备份的删除"""
        test_file = tmp_path / "test.png"
        test_file.write_text("test content")

        planner = DeletionPlanner(str(tmp_path))
        plan = planner.create_plan([str(test_file)], dry_run=False)
        planner.write_lock_file(plan)

        applied = planner.apply_plan(plan, create_backup=False)

        assert applied.deleted_count == 1
        assert not os.path.exists(str(test_file))

        undo_dir = tmp_path / UNDO_DIR
        backup_files = list(undo_dir.glob("*")) if undo_dir.exists() else []
        assert len([f for f in backup_files if f.suffix not in ('.gitignore', '.json')]) == 0

    def test_nonexistent_file_in_plan(self, tmp_path):
        """测试计划中包含不存在的文件"""
        real_file = tmp_path / "real.png"
        real_file.write_text("real")
        nonexistent = tmp_path / "nonexistent.png"

        planner = DeletionPlanner(str(tmp_path))
        plan = planner.create_plan([str(real_file), str(nonexistent)])

        assert plan.file_count == 1

    def test_undo_with_plan_id(self, tmp_path):
        """测试指定计划ID撤销"""
        test_file = tmp_path / "test.png"
        test_file.write_text("test")

        planner = DeletionPlanner(str(tmp_path))
        plan = planner.create_plan([str(test_file)], dry_run=False)
        planner.write_lock_file(plan)
        applied = planner.apply_plan(plan, create_backup=True)

        assert not os.path.exists(str(test_file))

        restored, failed = planner.undo_deletion(plan_id=plan.id)

        assert restored == 1
        assert os.path.exists(str(test_file))
