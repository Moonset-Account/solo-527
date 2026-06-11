"""测试CLI命令"""

import os
import sys
import pytest
from typer.testing import CliRunner
import tempfile
import shutil

from asset_cleaner.cli import app
from asset_cleaner.deletion_plan import LOCK_FILENAME, UNDO_DIR


runner = CliRunner()


class TestCLI:
    """测试CLI命令"""

    def test_version(self):
        """测试版本命令"""
        result = runner.invoke(app, ["--version"])
        assert result.exit_code == 0
        assert "asset-cleaner" in result.stdout

    def test_help(self):
        """测试帮助命令"""
        result = runner.invoke(app, ["--help"])
        assert result.exit_code == 0
        assert "scan" in result.stdout
        assert "clean" in result.stdout
        assert "undo" in result.stdout

    def test_scan_no_args(self, tmp_path):
        """测试不带参数的scan命令"""
        result = runner.invoke(app, ["scan", str(tmp_path), "--no-progress"])
        assert result.exit_code == 0

    def test_scan_with_unreferenced_files(self, tmp_path):
        """测试扫描包含未引用文件的项目"""
        test_project = tmp_path / "project"
        test_project.mkdir()

        images_dir = test_project / "public" / "images"
        images_dir.mkdir(parents=True)
        (images_dir / "used.png").write_text("used")
        (images_dir / "unused.png").write_text("unused")
        (images_dir / "logo.svg").write_text("<svg></svg>")

        src_dir = test_project / "src"
        src_dir.mkdir()
        (src_dir / "App.tsx").write_text(
            'import logo from "../public/images/logo.svg";\n'
            'const img = require("../public/images/used.png");'
        )

        result = runner.invoke(app, [
            "scan",
            str(test_project),
            "--asset-dir", str(images_dir),
            "--no-progress",
            "--no-gitignore",
        ])

        assert result.exit_code == 0
        assert "未引用资源清单" in result.stdout
        assert "unused.png" in result.stdout

    def test_scan_with_exclude_dir(self, tmp_path):
        """测试使用排除目录扫描"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        (images_dir / "used.png").write_text("used")
        (images_dir / "unused.png").write_text("unused")

        exclude_dir = tmp_path / "images" / "keep"
        exclude_dir.mkdir()
        (exclude_dir / "keep_me.png").write_text("keep")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "App.tsx").write_text('import img from "../images/used.png";')

        result = runner.invoke(app, [
            "scan",
            str(tmp_path),
            "--asset-dir", str(images_dir),
            "--exclude-dir", str(exclude_dir),
            "--no-progress",
            "--no-gitignore",
        ])

        assert result.exit_code == 0
        assert "unused.png" in result.stdout

    def test_scan_with_exclude_ext(self, tmp_path):
        """测试使用排除扩展名扫描"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        (images_dir / "unused.png").write_text("unused")
        (images_dir / "keep.svg").write_text("keep")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "App.tsx").write_text('// No imports')

        result = runner.invoke(app, [
            "scan",
            str(tmp_path),
            "--asset-dir", str(images_dir),
            "--exclude-ext", ".svg",
            "--no-progress",
            "--no-gitignore",
        ])

        assert result.exit_code == 0
        assert "unused.png" in result.stdout

    def test_scan_show_chains(self, tmp_path):
        """测试显示引用链"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        (images_dir / "used.png").write_text("used")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "App.tsx").write_text('import img from "../images/used.png";')

        result = runner.invoke(app, [
            "scan",
            str(tmp_path),
            "--asset-dir", str(images_dir),
            "--show-chains",
            "--no-progress",
            "--no-gitignore",
        ])

        assert result.exit_code == 0
        assert "引用链" in result.stdout

    def test_clean_dry_run(self, tmp_path):
        """测试clean命令dry-run模式"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        (images_dir / "unused.png").write_text("unused content")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "App.tsx").write_text('// No references')

        result = runner.invoke(app, [
            "clean",
            str(tmp_path),
            "--asset-dir", str(images_dir),
            "--no-progress",
            "--no-gitignore",
        ])

        assert result.exit_code == 0
        assert "DRY RUN" in result.stdout
        assert os.path.exists(str(images_dir / "unused.png"))

    def test_clean_apply_with_confirmation(self, tmp_path):
        """测试带确认的clean apply"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        test_file = images_dir / "unused.png"
        test_file.write_text("unused content")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "App.tsx").write_text('// No references')

        result = runner.invoke(app, [
            "clean",
            str(tmp_path),
            "--asset-dir", str(images_dir),
            "--apply",
            "--no-confirm",
            "--no-progress",
            "--no-gitignore",
        ], input="y\n")

        assert result.exit_code == 0

    def test_clean_with_lock_file(self, tmp_path):
        """测试锁定文件检测"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        (images_dir / "unused.png").write_text("unused")

        lock_file = tmp_path / LOCK_FILENAME
        lock_file.write_text('{"plan_id": "test"}')

        result = runner.invoke(app, [
            "clean",
            str(tmp_path),
            "--asset-dir", str(images_dir),
            "--apply",
            "--no-confirm",
            "--no-progress",
            "--no-gitignore",
        ])

        assert result.exit_code != 0
        assert "锁定文件" in result.stdout

    def test_undo_without_operation(self, tmp_path):
        """测试没有操作时的undo"""
        result = runner.invoke(app, ["undo", str(tmp_path)])
        assert result.exit_code == 0
        assert "没有需要撤销" in result.stdout or "撤销完成" in result.stdout

    def test_undo_list(self, tmp_path):
        """测试列出撤销计划"""
        result = runner.invoke(app, ["undo", str(tmp_path), "--list"])
        assert result.exit_code == 0

    def test_init_config(self, tmp_path):
        """测试初始化配置"""
        result = runner.invoke(app, ["init-config", str(tmp_path)])
        assert result.exit_code == 0

        config_file = tmp_path / ".asset-cleaner.yaml"
        assert os.path.exists(str(config_file))

    def test_init_config_already_exists(self, tmp_path):
        """测试配置文件已存在"""
        config_file = tmp_path / ".asset-cleaner.yaml"
        config_file.write_text("existing: true\n")

        result = runner.invoke(app, ["init-config", str(tmp_path)])
        assert result.exit_code != 0

    def test_init_config_force(self, tmp_path):
        """测试强制覆盖配置"""
        config_file = tmp_path / ".asset-cleaner.yaml"
        config_file.write_text("existing: true\n")

        result = runner.invoke(app, ["init-config", str(tmp_path), "--force"])
        assert result.exit_code == 0

    def test_show_config_default(self, tmp_path):
        """测试显示默认配置"""
        result = runner.invoke(app, ["show-config", str(tmp_path)])
        assert result.exit_code == 0
        assert "当前配置" in result.stdout
        assert "未找到配置文件" in result.stdout

    def test_show_config_with_file(self, tmp_path):
        """测试显示带配置文件的配置"""
        config_file = tmp_path / ".asset-cleaner.yaml"
        config_file.write_text("""
asset_dirs:
  - ./images
exclude_extensions:
  - .svg
""")

        result = runner.invoke(app, ["show-config", str(tmp_path)])
        assert result.exit_code == 0
        assert "使用配置文件" in result.stdout
        assert ".svg" in result.stdout

    def test_scan_with_dynamic_references(self, tmp_path):
        """测试扫描包含动态引用的文件"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        (images_dir / "a.png").write_text("a")
        (images_dir / "b.png").write_text("b")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "utils.ts").write_text("""
export function loadImage(name: string) {
  return import(`../images/${name}.png`);
}
""")

        result = runner.invoke(app, [
            "scan",
            str(tmp_path),
            "--asset-dir", str(images_dir),
            "--no-progress",
            "--no-gitignore",
        ])

        assert result.exit_code == 0
        assert "动态引用" in result.stdout or "dynamic" in result.stdout.lower()

    def test_scan_nonexistent_directory(self):
        """测试扫描不存在的目录"""
        result = runner.invoke(app, ["scan", "/nonexistent/path"])
        assert result.exit_code != 0
        assert "错误" in result.stdout

    def test_scan_with_ignore_pattern(self, tmp_path):
        """测试使用忽略模式扫描"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        (images_dir / "used.png").write_text("used")
        (images_dir / "unused.png").write_text("unused")

        node_modules = tmp_path / "node_modules"
        node_modules.mkdir()
        (node_modules / "fake.png").write_text("fake")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "App.tsx").write_text('import img from "../images/used.png";')

        result = runner.invoke(app, [
            "scan",
            str(tmp_path),
            "--asset-dir", str(images_dir),
            "--ignore", "node_modules/",
            "--no-progress",
            "--no-gitignore",
        ])

        assert result.exit_code == 0
        assert "unused.png" in result.stdout

    def test_clean_force(self, tmp_path):
        """测试强制clean忽略锁定文件"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        test_file = images_dir / "unused.png"
        test_file.write_text("unused content")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "App.tsx").write_text('// No references')

        lock_file = tmp_path / LOCK_FILENAME
        lock_file.write_text('{"plan_id": "test"}')

        result = runner.invoke(app, [
            "clean",
            str(tmp_path),
            "--asset-dir", str(images_dir),
            "--apply",
            "--no-confirm",
            "--force",
            "--no-progress",
            "--no-gitignore",
            "--no-backup",
        ], input="y\n")

        assert result.exit_code == 0
