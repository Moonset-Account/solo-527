"""测试路径工具模块"""

import os
import sys
import tempfile
import pytest
from pathlib import Path

from asset_cleaner.path_utils import (
    normalize_path,
    normalize_relative,
    is_image_file,
    is_style_file,
    is_code_file,
    is_markdown_file,
    is_build_file,
    is_scannable_file,
    safe_walk,
    collect_files,
    ScanProgress,
    match_extension,
    get_extension,
    IMAGE_EXTENSIONS,
)


class TestPathUtils:
    """测试路径工具函数"""

    def test_normalize_path_absolute(self):
        """测试绝对路径归一化"""
        with tempfile.TemporaryDirectory() as tmpdir:
            test_file = os.path.join(tmpdir, "test", "..", "file.png")
            normalized = normalize_path(test_file)
            assert normalized.endswith("/file.png")
            assert ".." not in normalized

    def test_normalize_path_posix_separators(self):
        """测试路径使用正斜杠"""
        if sys.platform == 'win32':
            test_path = "C:\\Users\\test\\file.png"
        else:
            test_path = "/home/test\\file.png"
        normalized = normalize_path(test_path)
        assert "\\" not in normalized

    def test_normalize_relative(self):
        """测试相对路径归一化"""
        with tempfile.TemporaryDirectory() as tmpdir:
            subdir = os.path.join(tmpdir, "subdir")
            os.makedirs(subdir)
            test_file = os.path.join(subdir, "file.png")
            rel = normalize_relative(test_file, tmpdir)
            assert rel == "subdir/file.png"

    def test_is_image_file(self):
        """测试图片文件判断"""
        assert is_image_file("test.png")
        assert is_image_file("test.JPG")
        assert is_image_file("test.svg")
        assert not is_image_file("test.txt")
        assert not is_image_file("test.js")

    def test_is_style_file(self):
        """测试样式文件判断"""
        assert is_style_file("test.css")
        assert is_style_file("test.scss")
        assert not is_style_file("test.png")

    def test_is_code_file(self):
        """测试代码文件判断"""
        assert is_code_file("test.tsx")
        assert is_code_file("test.js")
        assert is_code_file("test.vue")
        assert not is_code_file("test.css")

    def test_is_markdown_file(self):
        """测试Markdown文件判断"""
        assert is_markdown_file("test.md")
        assert is_markdown_file("test.mdx")
        assert not is_markdown_file("test.txt")

    def test_is_build_file(self):
        """测试构建产物判断"""
        assert is_build_file("test.js")
        assert is_build_file("asset-manifest.json")
        assert is_build_file("test.html")

    def test_is_scannable_file(self):
        """测试可扫描文件判断"""
        assert is_scannable_file("test.tsx")
        assert is_scannable_file("test.css")
        assert is_scannable_file("test.md")
        assert not is_scannable_file("test.png")

    def test_safe_walk_basic(self):
        """测试安全目录遍历"""
        with tempfile.TemporaryDirectory() as tmpdir:
            os.makedirs(os.path.join(tmpdir, "dir1"))
            os.makedirs(os.path.join(tmpdir, "dir2"))
            with open(os.path.join(tmpdir, "file1.txt"), "w") as f:
                f.write("test")
            with open(os.path.join(tmpdir, "dir1", "file2.txt"), "w") as f:
                f.write("test")

            progress = ScanProgress()
            files = list(safe_walk(tmpdir, progress))

            assert len(files) >= 3

    def test_safe_walk_symlink_loop(self, tmp_path):
        """测试软链接循环检测"""
        if sys.platform == 'win32':
            pytest.skip("Skipping symlink test on Windows")

        real_dir = tmp_path / "real_dir"
        real_dir.mkdir()
        (real_dir / "file.txt").write_text("test")

        subdir = tmp_path / "subdir"
        subdir.mkdir()

        loop_link = subdir / "loop_link"

        try:
            os.symlink(str(tmp_path), str(loop_link), target_is_directory=True)
        except (OSError, PermissionError):
            pytest.skip("Cannot create symlinks")

        progress = ScanProgress()
        list(safe_walk(tmp_path, progress))

        assert len(progress.symlink_loops) >= 1

    def test_collect_files(self):
        """测试文件收集"""
        with tempfile.TemporaryDirectory() as tmpdir:
            for i in range(5):
                with open(os.path.join(tmpdir, f"file{i}.png"), "w") as f:
                    f.write("test")

            progress = ScanProgress()
            files = collect_files(tmpdir, progress)

            assert len(files) == 5
            assert all(f.endswith(".png") for f in files)

    def test_match_extension(self):
        """测试扩展名匹配"""
        assert match_extension("test.png", {".png", ".jpg"})
        assert not match_extension("test.txt", {".png", ".jpg"})

    def test_get_extension(self):
        """测试获取扩展名"""
        assert get_extension("test.PNG") == ".png"
        assert get_extension("path/to/file.TsX") == ".tsx"

    def test_scan_progress_tracking(self):
        """测试进度追踪"""
        progress = ScanProgress()
        progress.increment()
        progress.increment()
        assert progress.processed_files == 2

        progress.add_skipped("test.txt", "reason")
        assert len(progress.skipped_files) == 1

        progress.add_symlink_loop("link", "loop detected")
        assert len(progress.symlink_loops) == 1
