"""测试内容扫描器模块"""

import os
import tempfile
import pytest
import json

from asset_cleaner.content_scanner import (
    ContentScanner,
    ScanResult,
    ResourceReference,
)
from asset_cleaner.path_utils import normalize_path


class TestContentScanner:
    """测试内容扫描器"""

    def test_scan_css_file(self, tmp_path):
        """测试扫描CSS文件"""
        css_file = tmp_path / "styles.css"
        css_file.write_text("""
.logo {
  background-image: url('../images/logo.png');
}

.banner {
  background: url("/images/banner.jpg");
}

.icon {
  background-image: var(--icon-url);
}
""")

        scanner = ContentScanner(str(tmp_path), asset_dirs=[str(tmp_path)])
        result = scanner.scan_file(str(css_file))

        assert len(result.references) >= 2
        refs = [r.reference for r in result.references]
        assert any("logo.png" in r for r in refs)
        assert any("banner.jpg" in r for r in refs)

    def test_scan_tsx_file(self, tmp_path):
        """测试扫描TSX文件"""
        tsx_file = tmp_path / "App.tsx"
        tsx_file.write_text("""
import React from 'react';
import logo from '../assets/logo.svg';
import './styles.css';

const App = () => {
  const img = require('../images/photo.png');
  return (
    <div>
      <img src={logo} alt="logo" />
      <img src="../assets/bg.jpg" />
    </div>
  );
};

export default App;
""")

        scanner = ContentScanner(str(tmp_path), asset_dirs=[str(tmp_path)])
        result = scanner.scan_file(str(tsx_file))

        refs = [r.reference for r in result.references]
        assert any("logo.svg" in r for r in refs)
        assert any("photo.png" in r for r in refs)
        assert any("bg.jpg" in r for r in refs)

    def test_scan_markdown_file(self, tmp_path):
        """测试扫描Markdown文件"""
        md_file = tmp_path / "README.md"
        md_file.write_text("""
# Test

![Logo](../images/logo.png)

[Download](../files/report.pdf)

![Screenshot](/assets/screen.webp)
""")

        scanner = ContentScanner(str(tmp_path), asset_dirs=[str(tmp_path)])
        result = scanner.scan_file(str(md_file))

        refs = [r.reference for r in result.references]
        assert any("logo.png" in r for r in refs)
        assert any("screen.webp" in r for r in refs)

    def test_scan_json_manifest(self, tmp_path):
        """测试扫描JSON清单文件"""
        manifest = tmp_path / "asset-manifest.json"
        manifest.write_text(json.dumps({
            "files": {
                "main.js": "/static/js/main.js",
                "logo.png": "/assets/logo.png",
                "bg.jpg": "/assets/bg.jpg",
            }
        }))

        scanner = ContentScanner(str(tmp_path), asset_dirs=[str(tmp_path)])
        result = scanner.scan_file(str(manifest))

        refs = [r.reference for r in result.references]
        assert any("logo.png" in r for r in refs)
        assert any("bg.jpg" in r for r in refs)

    def test_dynamic_reference_detection(self, tmp_path):
        """测试动态引用检测"""
        ts_file = tmp_path / "utils.ts"
        ts_file.write_text("""
export function loadImage(name: string) {
  return import(`../images/${name}.png`);
}

export const getIcon = (type: string) => {
  return require(`../icons/${type}.svg`);
};

const dynamicImage = require(`./assets/${variable}.jpg`);
""")

        scanner = ContentScanner(str(tmp_path), asset_dirs=[str(tmp_path)])
        result = scanner.scan_file(str(ts_file))

        assert len(result.dynamic_references) >= 2
        assert result.has_dynamic is True

    def test_exclude_external_urls(self, tmp_path):
        """测试排除外部URL"""
        css_file = tmp_path / "styles.css"
        css_file.write_text("""
.external {
  background-image: url('https://example.com/image.png');
}

.data {
  background: url(data:image/png;base64,abc123);
}

.local {
  background: url('/local/image.png');
}
""")

        scanner = ContentScanner(str(tmp_path), asset_dirs=[str(tmp_path)])
        result = scanner.scan_file(str(css_file))

        refs = [r.reference for r in result.references]
        assert not any("https://" in r for r in refs)
        assert not any("data:" in r for r in refs)
        assert any("/local/image.png" in r for r in refs)

    def test_resolve_reference(self, tmp_path):
        """测试引用解析"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        test_png = images_dir / "test.png"
        test_png.write_text("fake image content")

        css_file = tmp_path / "src" / "styles.css"
        css_file.parent.mkdir()
        css_file.write_text('.bg { background: url("../images/test.png"); }')

        scanner = ContentScanner(str(tmp_path), asset_dirs=[str(images_dir)])
        result = scanner.scan_file(str(css_file))

        assert len(result.references) > 0
        ref = result.references[0]
        resolved = scanner.resolve_reference(ref)

        assert resolved is not None
        assert normalize_path(resolved) == normalize_path(str(test_png))

    def test_resolve_references_batch(self, tmp_path):
        """测试批量解析引用"""
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        (images_dir / "a.png").write_text("a")
        (images_dir / "b.jpg").write_text("b")

        css_file = tmp_path / "styles.css"
        css_file.write_text("""
.a { background: url("./images/a.png"); }
.b { background: url("./images/b.jpg"); }
""")

        scanner = ContentScanner(str(tmp_path), asset_dirs=[str(images_dir)])
        result = scanner.scan_file(str(css_file))

        resolved = scanner.resolve_references(result.references)
        assert len(resolved) == 2

    def test_scan_with_errors(self, tmp_path):
        """测试扫描错误处理"""
        bad_file = tmp_path / "bad.bin"
        bad_file.write_bytes(b'\x00\x01\x02\xff\xfe')

        scanner = ContentScanner(str(tmp_path))
        result = scanner.scan_file(str(bad_file))

        assert len(result.errors) == 0

    def test_resource_reference_repr(self):
        """测试ResourceReference字符串表示"""
        ref = ResourceReference(
            reference="test.png",
            source_file="/path/to/file.tsx",
            line_number=42,
            pattern_type="import",
        )
        repr_str = repr(ref)
        assert "test.png" in repr_str
        assert "42" in repr_str
        assert "import" in repr_str

    def test_scan_result_has_dynamic(self):
        """测试ScanResult动态引用判断"""
        result = ScanResult(file_path="/test.tsx")
        assert result.has_dynamic is False

        result.dynamic_references.append(ResourceReference(
            reference="test",
            source_file="/test.tsx",
            line_number=1,
            pattern_type="dynamic",
            is_dynamic=True,
        ))
        assert result.has_dynamic is True

    def test_looks_like_asset_path_helper(self, tmp_path):
        """测试资产路径判断辅助方法"""
        scanner = ContentScanner(str(tmp_path))

        assert scanner._looks_like_asset_path("/images/test.png")
        assert scanner._looks_like_asset_path("../assets/logo.svg")
        assert not scanner._looks_like_asset_path("https://example.com/test.png")
        assert not scanner._looks_like_asset_path("data:image/png;base64,abc")
        assert not scanner._looks_like_asset_path("")
        assert not scanner._looks_like_asset_path("#anchor")

    def test_contains_asset_extension(self, tmp_path):
        """测试资源扩展名包含检测"""
        scanner = ContentScanner(str(tmp_path))

        assert scanner._contains_asset_extension('require(`./images/${name}.png`)')
        assert scanner._contains_asset_extension('import(`/assets/${icon}.svg`)')
        assert not scanner._contains_asset_extension('console.log("hello")')
