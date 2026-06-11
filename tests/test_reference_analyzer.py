"""测试引用分析器模块"""

import os
import tempfile
import pytest

from asset_cleaner.reference_analyzer import (
    ReferenceAnalyzer,
    AnalysisResult,
    ReferenceChain,
    DynamicReferenceInfo,
)
from asset_cleaner.ignore_rules import IgnoreMatcher
from asset_cleaner.path_utils import normalize_path


class TestReferenceAnalyzer:
    """测试引用分析器"""

    def test_analyze_basic(self, tmp_path):
        """测试基本分析功能"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        (images_dir / "used.png").write_text("used")
        (images_dir / "unused.png").write_text("unused")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "App.tsx").write_text("""
import React from 'react';
import img from '../images/used.png';

const App = () => <img src={img} />;
export default App;
""")

        matcher = IgnoreMatcher(str(tmp_path), use_gitignore=False)
        analyzer = ReferenceAnalyzer(
            root_dir=str(tmp_path),
            asset_dirs=[str(images_dir)],
            ignore_matcher=matcher,
        )

        result = analyzer.analyze()

        assert len(result.all_assets) == 2
        assert len(result.referenced_assets) == 1
        assert len(result.unreferenced_assets) == 1

        unused = result.unreferenced_assets[0]
        assert "unused.png" in unused

    def test_analyze_with_css(self, tmp_path):
        """测试包含CSS的分析"""
        images_dir = tmp_path / "public" / "images"
        images_dir.mkdir(parents=True)
        (images_dir / "bg.jpg").write_text("bg")
        (images_dir / "logo.svg").write_text("logo")
        (images_dir / "unused.webp").write_text("unused")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "styles.css").write_text("""
.hero {
  background-image: url('../public/images/bg.jpg');
}

.logo {
  background: url('../public/images/logo.svg');
}
""")

        matcher = IgnoreMatcher(str(tmp_path), use_gitignore=False)
        analyzer = ReferenceAnalyzer(
            root_dir=str(tmp_path),
            asset_dirs=[str(images_dir)],
            ignore_matcher=matcher,
        )

        result = analyzer.analyze()

        assert len(result.unreferenced_assets) == 1
        assert "unused.webp" in result.unreferenced_assets[0]

    def test_analyze_with_markdown(self, tmp_path):
        """测试包含Markdown的分析"""
        images_dir = tmp_path / "assets"
        images_dir.mkdir()
        (images_dir / "screenshot.png").write_text("screenshot")
        (images_dir / "unused.png").write_text("unused")

        docs_dir = tmp_path / "docs"
        docs_dir.mkdir()
        (docs_dir / "README.md").write_text("""
# 文档

![截图](../assets/screenshot.png)
""")

        matcher = IgnoreMatcher(str(tmp_path), use_gitignore=False)
        analyzer = ReferenceAnalyzer(
            root_dir=str(tmp_path),
            asset_dirs=[str(images_dir)],
            ignore_matcher=matcher,
        )

        result = analyzer.analyze()

        assert len(result.unreferenced_assets) == 1
        assert "unused.png" in result.unreferenced_assets[0]

    def test_analyze_with_dynamic_references(self, tmp_path):
        """测试动态引用检测"""
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

export const getIcon = (type: string) => {
  return require(`../images/${type}.png`);
};
""")

        matcher = IgnoreMatcher(str(tmp_path), use_gitignore=False)
        analyzer = ReferenceAnalyzer(
            root_dir=str(tmp_path),
            asset_dirs=[str(images_dir)],
            ignore_matcher=matcher,
        )

        result = analyzer.analyze()

        assert len(result.dynamic_references) >= 1

    def test_analysis_result_helpers(self, tmp_path):
        """测试AnalysisResult辅助方法"""
        result = AnalysisResult()
        result.all_assets = [
            str(tmp_path / "a.png"),
            str(tmp_path / "b.jpg"),
            str(tmp_path / "c.svg"),
        ]
        result.unreferenced_assets = [
            str(tmp_path / "b.jpg"),
            str(tmp_path / "c.svg"),
        ]

        images = result.get_unreferenced_images()
        assert len(images) == 2

    def test_get_reference_chain(self, tmp_path):
        """测试获取引用链"""
        result = AnalysisResult()
        asset_path = normalize_path(str(tmp_path / "logo.png"))
        chain = ReferenceChain(asset_path=asset_path)
        result.referenced_assets[asset_path] = chain

        retrieved = result.get_reference_chain(asset_path)
        assert retrieved is not None
        assert retrieved.asset_path == asset_path

    def test_reference_chain_properties(self):
        """测试ReferenceChain属性"""
        from asset_cleaner.content_scanner import ResourceReference

        chain = ReferenceChain(asset_path="/test.png")
        assert chain.is_referenced is False
        assert chain.reference_count == 0

        chain.references.append(ResourceReference(
            reference="test.png",
            source_file="/app.tsx",
            line_number=1,
            pattern_type="import",
        ))

        assert chain.is_referenced is True
        assert chain.reference_count == 1

        sources = chain.get_source_files()
        assert "/app.tsx" in sources

    def test_dynamic_reference_info(self):
        """测试DynamicReferenceInfo"""
        from asset_cleaner.content_scanner import ResourceReference

        info = DynamicReferenceInfo(file_path="/utils.ts")
        assert info.count == 0

        info.references.append(ResourceReference(
            reference='import(`../images/${name}.png`)',
            source_file="/utils.ts",
            line_number=1,
            pattern_type="dynamic",
            is_dynamic=True,
        ))
        info.pattern_hints.append("*.png")

        assert info.count == 1

    def test_analyze_with_exclude_extensions(self, tmp_path):
        """测试排除扩展名的分析"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        (images_dir / "keep.svg").write_text("keep")
        (images_dir / "remove.png").write_text("remove")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "App.tsx").write_text('import img from "../images/keep.svg";')

        matcher = IgnoreMatcher(
            str(tmp_path),
            exclude_extensions=[".svg"],
            use_gitignore=False,
        )
        analyzer = ReferenceAnalyzer(
            root_dir=str(tmp_path),
            asset_dirs=[str(images_dir)],
            ignore_matcher=matcher,
        )

        result = analyzer.analyze()

        assert "keep.svg" not in result.unreferenced_assets[0] if result.unreferenced_assets else True

    def test_analyze_with_ignore_patterns(self, tmp_path):
        """测试忽略模式的分析"""
        images_dir = tmp_path / "public" / "images"
        images_dir.mkdir(parents=True)
        (images_dir / "used.png").write_text("used")
        (images_dir / "unused.png").write_text("unused")

        node_modules = tmp_path / "node_modules"
        node_modules.mkdir()
        (node_modules / "fake.png").write_text("fake")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "App.tsx").write_text('import img from "../public/images/used.png";')

        matcher = IgnoreMatcher(
            str(tmp_path),
            patterns=["node_modules/"],
            use_gitignore=False,
        )
        analyzer = ReferenceAnalyzer(
            root_dir=str(tmp_path),
            asset_dirs=[str(images_dir)],
            ignore_matcher=matcher,
        )

        result = analyzer.analyze()

        assert "fake.png" not in str(result.all_assets)

    def test_get_dynamic_for_asset(self, tmp_path):
        """测试获取资产的动态引用"""
        result = AnalysisResult()

        from asset_cleaner.content_scanner import ResourceReference

        dyn_info = DynamicReferenceInfo(file_path="/utils.ts")
        dyn_info.references.append(ResourceReference(
            reference='import(`../images/${name}.png`)',
            source_file="/utils.ts",
            line_number=1,
            pattern_type="dynamic",
            is_dynamic=True,
        ))
        result.dynamic_references["/utils.ts"] = dyn_info

        matches = result.get_dynamic_for_asset("/images/test.png")
        assert len(matches) >= 1

    def test_analyze_with_progress(self, tmp_path):
        """测试带进度的分析"""
        from asset_cleaner.path_utils import ScanProgress

        images_dir = tmp_path / "images"
        images_dir.mkdir()
        (images_dir / "test.png").write_text("test")

        src_dir = tmp_path / "src"
        src_dir.mkdir()
        (src_dir / "App.tsx").write_text("import logo from '../images/test.png';")
        (src_dir / "styles.css").write_text(".bg { background: url('../images/test.png'); }")

        matcher = IgnoreMatcher(str(tmp_path), use_gitignore=False)
        analyzer = ReferenceAnalyzer(
            root_dir=str(tmp_path),
            asset_dirs=[str(images_dir)],
            ignore_matcher=matcher,
        )

        progress = ScanProgress()
        result = analyzer.analyze(progress)

        assert progress.processed_files > 0
        assert progress.total_files >= 2
