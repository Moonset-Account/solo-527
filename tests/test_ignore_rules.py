"""测试忽略规则模块"""

import os
import tempfile
import pytest

from asset_cleaner.ignore_rules import IgnoreMatcher, IgnoreRule
from asset_cleaner.path_utils import normalize_path


class TestIgnoreRules:
    """测试忽略规则"""

    def test_basic_ignore_pattern(self):
        """测试基本忽略模式"""
        with tempfile.TemporaryDirectory() as tmpdir:
            matcher = IgnoreMatcher(tmpdir, patterns=["*.log"])

            assert matcher.is_ignored(os.path.join(tmpdir, "test.log"))
            assert not matcher.is_ignored(os.path.join(tmpdir, "test.txt"))

    def test_gitignore_style_patterns(self):
        """测试.gitignore风格模式"""
        with tempfile.TemporaryDirectory() as tmpdir:
            matcher = IgnoreMatcher(
                tmpdir,
                patterns=[
                    "node_modules/",
                    "*.tmp",
                    "!important.tmp",
                ],
                use_gitignore=False,
            )

            assert matcher.is_ignored(os.path.join(tmpdir, "node_modules", "file.js"))
            assert matcher.is_ignored(os.path.join(tmpdir, "cache.tmp"))

    def test_exclude_dirs(self):
        """测试排除目录"""
        with tempfile.TemporaryDirectory() as tmpdir:
            exclude_dir = os.path.join(tmpdir, "exclude_me")
            os.makedirs(exclude_dir)

            matcher = IgnoreMatcher(
                tmpdir,
                exclude_dirs=[exclude_dir],
                use_gitignore=False,
            )

            test_file = os.path.join(exclude_dir, "test.png")
            assert matcher.is_ignored(test_file)

    def test_exclude_extensions(self):
        """测试排除扩展名"""
        with tempfile.TemporaryDirectory() as tmpdir:
            matcher = IgnoreMatcher(
                tmpdir,
                exclude_extensions=[".svg", ".ico"],
                use_gitignore=False,
            )

            assert matcher.is_ignored(os.path.join(tmpdir, "logo.svg"))
            assert matcher.is_ignored(os.path.join(tmpdir, "favicon.ICO"))
            assert not matcher.is_ignored(os.path.join(tmpdir, "photo.png"))

    def test_filter_files(self):
        """测试文件过滤"""
        with tempfile.TemporaryDirectory() as tmpdir:
            matcher = IgnoreMatcher(
                tmpdir,
                patterns=["*.log"],
                use_gitignore=False,
            )

            files = [
                os.path.join(tmpdir, "a.png"),
                os.path.join(tmpdir, "b.log"),
                os.path.join(tmpdir, "c.jpg"),
                os.path.join(tmpdir, "d.log"),
            ]

            filtered = matcher.filter_files(files)
            assert len(filtered) == 2
            assert all(not f.endswith(".log") for f in filtered)

    def test_negation_patterns(self):
        """测试否定模式"""
        with tempfile.TemporaryDirectory() as tmpdir:
            matcher = IgnoreMatcher(
                tmpdir,
                patterns=[
                    "*.txt",
                    "!important.txt",
                ],
                use_gitignore=False,
            )

            assert matcher.is_ignored(os.path.join(tmpdir, "other.txt"))

    def test_gitignore_loading(self):
        """测试.gitignore加载"""
        with tempfile.TemporaryDirectory() as tmpdir:
            gitignore = os.path.join(tmpdir, ".gitignore")
            with open(gitignore, "w") as f:
                f.write("node_modules/\n")
                f.write("*.log\n")

            matcher = IgnoreMatcher(tmpdir, use_gitignore=True)

            assert matcher.is_ignored(os.path.join(tmpdir, "node_modules", "index.js"))
            assert matcher.is_ignored(os.path.join(tmpdir, "debug.log"))
            assert not matcher.is_ignored(os.path.join(tmpdir, "src", "index.ts"))

    def test_ignore_rule_repr(self):
        """测试IgnoreRule字符串表示"""
        rule = IgnoreRule("*.png", source="test")
        repr_str = repr(rule)
        assert "*.png" in repr_str
        assert "test" in repr_str

    def test_get_rules_and_excludes(self):
        """测试获取规则和排除项"""
        with tempfile.TemporaryDirectory() as tmpdir:
            exclude_dir = os.path.join(tmpdir, "skip")
            os.makedirs(exclude_dir)

            matcher = IgnoreMatcher(
                tmpdir,
                patterns=["*.log"],
                exclude_dirs=[exclude_dir],
                exclude_extensions=[".svg"],
                use_gitignore=False,
            )

            assert len(matcher.get_rules()) > 0
            assert len(matcher.get_exclude_dirs()) == 1
            assert ".svg" in matcher.get_exclude_extensions()

    def test_relative_exclude_dir(self):
        """测试相对路径排除目录"""
        with tempfile.TemporaryDirectory() as tmpdir:
            matcher = IgnoreMatcher(
                tmpdir,
                exclude_dirs=["public/favicons"],
                use_gitignore=False,
            )

            test_file = os.path.join(tmpdir, "public", "favicons", "icon.png")
            assert matcher.is_ignored(test_file)
