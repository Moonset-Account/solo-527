"""集成测试 - 端到端测试完整工作流"""

import os
import sys
import pytest
import shutil
import tempfile
from pathlib import Path

from asset_cleaner.reference_analyzer import ReferenceAnalyzer
from asset_cleaner.ignore_rules import IgnoreMatcher
from asset_cleaner.deletion_plan import DeletionPlanner, LOCK_FILENAME, UNDO_DIR
from asset_cleaner.path_utils import normalize_path
from asset_cleaner.config import load_config


class TestIntegration:
    """集成测试"""

    def setup_method(self):
        """设置测试环境"""
        self.tmp_dir = tempfile.mkdtemp()
        self.project_dir = os.path.join(self.tmp_dir, "test_project")
        os.makedirs(self.project_dir)

    def teardown_method(self):
        """清理测试环境"""
        shutil.rmtree(self.tmp_dir, ignore_errors=True)

    def _create_test_project(self):
        """创建测试项目结构"""
        images_dir = os.path.join(self.project_dir, "public", "images")
        src_dir = os.path.join(self.project_dir, "src")
        docs_dir = os.path.join(self.project_dir, "docs")
        dist_dir = os.path.join(self.project_dir, "dist")

        for d in [images_dir, src_dir, docs_dir, dist_dir]:
            os.makedirs(d, exist_ok=True)

        with open(os.path.join(images_dir, "logo.svg"), "w") as f:
            f.write('<svg><circle cx="50" cy="50" r="40"/></svg>')

        with open(os.path.join(images_dir, "used.png"), "w") as f:
            f.write("used image content")

        with open(os.path.join(images_dir, "background.jpg"), "w") as f:
            f.write("background image content")

        with open(os.path.join(images_dir, "unused1.png"), "w") as f:
            f.write("unused1 content")

        with open(os.path.join(images_dir, "unused2.webp"), "w") as f:
            f.write("unused2 content")

        with open(os.path.join(images_dir, "favicon.ico"), "w") as f:
            f.write("favicon content")

        with open(os.path.join(src_dir, "App.tsx"), "w") as f:
            f.write("""
import React from 'react';
import logo from '../public/images/logo.svg';
import './styles.css';

const App: React.FC = () => {
  const [bg, setBg] = React.useState('background');
  const bgImage = require(`../public/images/${bg}.jpg`);

  return (
    <div className="app">
      <img src={logo} alt="Logo" />
      <img src="../public/images/used.png" alt="Used" />
      <div style={{backgroundImage: `url(${bgImage})`}} />
    </div>
  );
};

export default App;
""")

        with open(os.path.join(src_dir, "styles.css"), "w") as f:
            f.write("""
.logo {
  background-image: url('../public/images/logo.svg');
}

.hero {
  background: url('../public/images/background.jpg') no-repeat center;
}
""")

        with open(os.path.join(src_dir, "utils.ts"), "w") as f:
            f.write("""
export function loadIcon(name: string) {
  return import(`../public/images/${name}.svg`);
}

export const getImage = (type: string) => {
  return require(`../public/images/${type}.png`);
};
""")

        with open(os.path.join(docs_dir, "README.md"), "w") as f:
            f.write("""
# 项目文档

## Logo

![项目Logo](../public/images/logo.svg)

## 截图

![应用截图](../public/images/used.png)
""")

        import json
        with open(os.path.join(dist_dir, "asset-manifest.json"), "w") as f:
            json.dump({
                "files": {
                    "main.js": "/static/js/main.js",
                    "logo.svg": "/public/images/logo.svg",
                    "used.png": "/public/images/used.png",
                }
            }, f)

        with open(os.path.join(self.project_dir, ".gitignore"), "w") as f:
            f.write("node_modules/\ndist/\n*.log\n")

        config = """asset_dirs:
  - ./public/images

ignore_patterns:
  - node_modules/
  - .git/

exclude_extensions:
  - .svg
  - .ico
"""
        with open(os.path.join(self.project_dir, ".asset-cleaner.yaml"), "w") as f:
            f.write(config)

    def test_full_workflow_scan_only(self):
        """测试完整扫描工作流（不删除）"""
        self._create_test_project()

        config = load_config(self.project_dir)

        matcher = IgnoreMatcher(
            root_dir=self.project_dir,
            patterns=config.ignore_patterns,
            exclude_dirs=config.exclude_dirs,
            exclude_extensions=config.exclude_extensions,
            use_gitignore=config.use_gitignore,
        )

        analyzer = ReferenceAnalyzer(
            root_dir=self.project_dir,
            asset_dirs=config.asset_dirs,
            ignore_matcher=matcher,
        )

        result = analyzer.analyze()

        assert len(result.all_assets) >= 3
        assert len(result.referenced_assets) >= 1
        assert len(result.unreferenced_assets) >= 1

        unreferenced_basenames = [os.path.basename(p) for p in result.unreferenced_assets]
        assert "unused1.png" in unreferenced_basenames
        assert "unused2.webp" in unreferenced_basenames

        assert "logo.svg" not in unreferenced_basenames
        assert "favicon.ico" not in unreferenced_basenames

        assert len(result.dynamic_references) >= 1

    def test_full_workflow_clean_and_undo(self):
        """测试完整清理和撤销工作流"""
        self._create_test_project()

        config = load_config(self.project_dir)

        matcher = IgnoreMatcher(
            root_dir=self.project_dir,
            patterns=config.ignore_patterns,
            exclude_dirs=config.exclude_dirs,
            exclude_extensions=config.exclude_extensions,
            use_gitignore=config.use_gitignore,
        )

        analyzer = ReferenceAnalyzer(
            root_dir=self.project_dir,
            asset_dirs=config.asset_dirs,
            ignore_matcher=matcher,
        )

        result = analyzer.analyze()

        unreferenced = result.unreferenced_assets
        assert len(unreferenced) > 0

        unused_file = unreferenced[0]
        assert os.path.exists(unused_file)

        planner = DeletionPlanner(self.project_dir)

        plan = planner.create_plan(unreferenced, dry_run=False)
        assert plan.file_count == len(unreferenced)

        planner.write_lock_file(plan)
        assert os.path.exists(os.path.join(self.project_dir, LOCK_FILENAME))

        applied = planner.apply_plan(plan, create_backup=True)
        assert applied.deleted_count == len(unreferenced)

        for f in unreferenced:
            assert not os.path.exists(f)

        undo_dir = os.path.join(self.project_dir, UNDO_DIR)
        assert os.path.exists(undo_dir)

        restored, failed = planner.undo_deletion()
        assert restored == len(unreferenced)
        assert failed == 0

        for f in unreferenced:
            assert os.path.exists(f)

    def test_config_file_loading(self):
        """测试配置文件加载"""
        self._create_test_project()

        config = load_config(self.project_dir)

        assert len(config.asset_dirs) == 1
        assert "public/images" in config.asset_dirs[0]
        assert ".svg" in config.exclude_extensions
        assert ".ico" in config.exclude_extensions
        assert config.use_gitignore is True

    def test_exclude_extensions_effective(self):
        """测试排除扩展名生效"""
        self._create_test_project()

        config = load_config(self.project_dir)

        matcher = IgnoreMatcher(
            root_dir=self.project_dir,
            patterns=config.ignore_patterns,
            exclude_dirs=config.exclude_dirs,
            exclude_extensions=config.exclude_extensions,
            use_gitignore=config.use_gitignore,
        )

        svg_file = os.path.join(self.project_dir, "public", "images", "logo.svg")
        assert matcher.is_ignored(svg_file)

        ico_file = os.path.join(self.project_dir, "public", "images", "favicon.ico")
        assert matcher.is_ignored(ico_file)

        png_file = os.path.join(self.project_dir, "public", "images", "unused1.png")
        assert not matcher.is_ignored(png_file)

    def test_gitignore_respected(self):
        """测试.gitignore被尊重"""
        self._create_test_project()

        node_modules = os.path.join(self.project_dir, "node_modules")
        os.makedirs(node_modules)
        fake_png = os.path.join(node_modules, "fake.png")
        with open(fake_png, "w") as f:
            f.write("fake")

        config = load_config(self.project_dir)
        matcher = IgnoreMatcher(
            root_dir=self.project_dir,
            patterns=config.ignore_patterns,
            use_gitignore=config.use_gitignore,
        )

        assert matcher.is_ignored(fake_png)

    def test_dynamic_reference_detection(self):
        """测试动态引用检测"""
        self._create_test_project()

        config = load_config(self.project_dir)
        matcher = IgnoreMatcher(
            root_dir=self.project_dir,
            patterns=config.ignore_patterns,
            exclude_extensions=config.exclude_extensions,
            use_gitignore=config.use_gitignore,
        )

        analyzer = ReferenceAnalyzer(
            root_dir=self.project_dir,
            asset_dirs=config.asset_dirs,
            ignore_matcher=matcher,
        )

        result = analyzer.analyze()

        utils_ts = os.path.join(self.project_dir, "src", "utils.ts")
        assert normalize_path(utils_ts) in result.dynamic_references

        app_tsx = os.path.join(self.project_dir, "src", "App.tsx")
        assert normalize_path(app_tsx) in result.dynamic_references

    def test_reference_chain_building(self):
        """测试引用链构建"""
        self._create_test_project()

        config = load_config(self.project_dir)
        matcher = IgnoreMatcher(
            root_dir=self.project_dir,
            patterns=config.ignore_patterns,
            exclude_extensions=config.exclude_extensions,
            use_gitignore=config.use_gitignore,
        )

        analyzer = ReferenceAnalyzer(
            root_dir=self.project_dir,
            asset_dirs=config.asset_dirs,
            ignore_matcher=matcher,
        )

        result = analyzer.analyze()

        used_png = os.path.join(self.project_dir, "public", "images", "used.png")
        used_png_norm = normalize_path(used_png)

        chain = result.get_reference_chain(used_png_norm)
        assert chain is not None
        assert chain.reference_count >= 1

        sources = chain.get_source_files()
        app_tsx = normalize_path(os.path.join(self.project_dir, "src", "App.tsx"))
        assert app_tsx in sources

    def test_lock_file_prevents_concurrent_operations(self):
        """测试锁定文件阻止并发操作"""
        self._create_test_project()

        planner = DeletionPlanner(self.project_dir)

        test_file = os.path.join(self.project_dir, "public", "images", "unused1.png")
        plan = planner.create_plan([test_file], dry_run=False)
        planner.write_lock_file(plan)

        assert planner.has_lock_file() is True

        planner2 = DeletionPlanner(self.project_dir)
        assert planner2.has_lock_file() is True

    def test_cross_platform_path_handling(self):
        """测试跨平台路径处理"""
        self._create_test_project()

        config = load_config(self.project_dir)
        matcher = IgnoreMatcher(
            root_dir=self.project_dir,
            patterns=config.ignore_patterns,
            exclude_extensions=config.exclude_extensions,
            use_gitignore=config.use_gitignore,
        )

        analyzer = ReferenceAnalyzer(
            root_dir=self.project_dir,
            asset_dirs=config.asset_dirs,
            ignore_matcher=matcher,
        )

        result = analyzer.analyze()

        for asset in result.all_assets:
            assert "\\" not in asset
            assert asset == normalize_path(asset)

        for ref_asset in result.referenced_assets:
            assert "\\" not in ref_asset
