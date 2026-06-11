"""测试配置模块"""

import os
import tempfile
import pytest

from asset_cleaner.config import (
    CleanerConfig,
    find_config_file,
    load_config,
    create_default_config,
    CONFIG_FILENAMES,
)
from asset_cleaner.path_utils import normalize_path


class TestConfig:
    """测试配置模块"""

    def test_default_config(self, tmp_path):
        """测试默认配置"""
        config = CleanerConfig.default(str(tmp_path))

        assert config.root_dir == normalize_path(str(tmp_path))
        assert len(config.asset_dirs) == 1
        assert config.use_gitignore is True
        assert config.dry_run is True
        assert config.create_backup is True

    def test_merge_config(self, tmp_path):
        """测试配置合并"""
        config = CleanerConfig.default(str(tmp_path))

        overrides = {
            "asset_dirs": ["/custom/assets"],
            "exclude_extensions": [".svg"],
            "dry_run": False,
        }

        merged = config.merge(overrides)

        assert "/custom/assets" in merged.asset_dirs
        assert ".svg" in merged.exclude_extensions
        assert merged.dry_run is False

    def test_find_config_file(self, tmp_path):
        """测试查找配置文件"""
        config_file = tmp_path / ".asset-cleaner.yaml"
        config_file.write_text("asset_dirs:\n  - ./images\n")

        found = find_config_file(str(tmp_path))
        assert found is not None
        assert ".asset-cleaner.yaml" in found

    def test_find_config_file_not_found(self, tmp_path):
        """测试找不到配置文件"""
        found = find_config_file(str(tmp_path))
        assert found is None

    def test_load_config_yaml(self, tmp_path):
        """测试加载YAML配置"""
        config_file = tmp_path / ".asset-cleaner.yaml"
        config_file.write_text("""
asset_dirs:
  - ./public/images
  - ./src/assets

ignore_patterns:
  - node_modules/
  - dist/

exclude_dirs:
  - ./public/favicons

exclude_extensions:
  - .svg
  - .ico

use_gitignore: false
dry_run: false
create_backup: true
""")

        config = load_config(str(tmp_path))

        assert len(config.asset_dirs) == 2
        assert "node_modules/" in config.ignore_patterns
        assert len(config.exclude_extensions) == 2
        assert config.use_gitignore is False
        assert config.dry_run is False

    def test_load_config_with_absolute_asset_dirs(self, tmp_path):
        """测试绝对路径资产目录"""
        abs_dir = str(tmp_path / "absolute" / "assets")
        os.makedirs(abs_dir)

        config_file = tmp_path / ".asset-cleaner.yaml"
        config_file.write_text(f"""
asset_dirs:
  - {abs_dir}
""")

        config = load_config(str(tmp_path))

        assert len(config.asset_dirs) == 1
        assert normalize_path(abs_dir) in config.asset_dirs

    def test_load_config_with_relative_exclude_dirs(self, tmp_path):
        """测试相对路径排除目录"""
        config_file = tmp_path / ".asset-cleaner.yaml"
        config_file.write_text("""
exclude_dirs:
  - ./public/favicons
  - ./src/assets/fonts
""")

        config = load_config(str(tmp_path))

        assert len(config.exclude_dirs) == 2
        favicons_dir = normalize_path(str(tmp_path / "public" / "favicons"))
        assert favicons_dir in config.exclude_dirs

    def test_create_default_config(self, tmp_path):
        """测试创建默认配置"""
        config_path = str(tmp_path / ".asset-cleaner.yaml")
        created = create_default_config(config_path)

        assert os.path.exists(created)

        with open(created, 'r') as f:
            content = f.read()

        assert "asset_dirs" in content
        assert "ignore_patterns" in content
        assert "exclude_dirs" in content

    def test_create_default_config_already_exists(self, tmp_path):
        """测试配置文件已存在时创建失败"""
        config_path = str(tmp_path / ".asset-cleaner.yaml")
        create_default_config(config_path)

        with pytest.raises(SystemExit):
            create_default_config(config_path)

    def test_load_config_with_specified_path(self, tmp_path):
        """测试加载指定路径的配置"""
        custom_config = tmp_path / "custom-config.yaml"
        custom_config.write_text("""
exclude_extensions:
  - .custom
""")

        config = load_config(str(tmp_path), config_path=str(custom_config))

        assert ".custom" in config.exclude_extensions

    def test_config_show_options(self, tmp_path):
        """测试配置显示选项"""
        config_file = tmp_path / ".asset-cleaner.yaml"
        config_file.write_text("""
show_progress: false
show_dynamic: false
show_reference_chains: false
max_depth: 50
""")

        config = load_config(str(tmp_path))

        assert config.show_progress is False
        assert config.show_dynamic is False
        assert config.show_reference_chains is False
        assert config.max_depth == 50

    def test_find_config_file_all_names(self, tmp_path):
        """测试查找所有可能的配置文件名"""
        for filename in CONFIG_FILENAMES:
            test_dir = tmp_path / filename.replace('.', '_')
            test_dir.mkdir()
            config_file = test_dir / filename
            config_file.write_text("asset_dirs: []\n")

            found = find_config_file(str(test_dir))
            assert found is not None
            assert filename in found

    def test_load_config_invalid_yaml(self, tmp_path):
        """测试加载无效YAML"""
        config_file = tmp_path / ".asset-cleaner.yaml"
        config_file.write_text("invalid: yaml: [broken\n")

        with pytest.raises(ValueError):
            load_config(str(tmp_path))

    def test_config_merge_lists(self, tmp_path):
        """测试列表合并"""
        config = CleanerConfig.default(str(tmp_path))
        config.exclude_extensions = [".svg"]

        merged = config.merge({
            "exclude_extensions": [".ico"],
        })

        assert ".svg" in merged.exclude_extensions
        assert ".ico" in merged.exclude_extensions
