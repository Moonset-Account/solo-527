"""内容扫描器 - 从文件中提取资源引用"""

import re
import json
import os
from pathlib import Path
from typing import List, Tuple, Set, Optional, Dict, Iterable
from dataclasses import dataclass, field

from .path_utils import (
    normalize_path,
    normalize_relative,
    is_image_file,
    IMAGE_EXTENSIONS,
)


URL_PATTERN = re.compile(
    r"""url\(\s*['"]?(?P<url>[^'")]+)['"]?\s*\)""",
    re.IGNORECASE
)

SRC_PATTERN = re.compile(
    r"""(?:src|href|data-src|data-href)\s*=\s*['"](?P<url>[^'"]+)['"]""",
    re.IGNORECASE
)

REQUIRE_PATTERN = re.compile(
    r"""require\(\s*['"](?P<path>[^'"]+)['"]\s*\)""",
    re.IGNORECASE
)

IMPORT_PATTERN = re.compile(
    r"""(?:import\s+(?:[^'"]+\s+from\s+)?['"](?P<path>[^'"]+)['"])""",
    re.IGNORECASE
)

DYNAMIC_IMPORT_PATTERN = re.compile(
    r"""(?:import\(\s*['"](?P<path>[^'"]+)['"]\s*\))""",
    re.IGNORECASE
)

BACKTICK_IMPORT_PATTERN = re.compile(
    r"""import\(\s*`[^`]*\$\{[^}]+\}[^`]*`\s*\)""",
    re.IGNORECASE
)

TEMPLATE_LITERAL_PATTERN = re.compile(
    r"""`[^`]*\$\{[^}]+\}[^`]*`""",
    re.IGNORECASE
)

DYNAMIC_REQUIRE_PATTERN = re.compile(
    r"""require\(\s*`[^`]*\$\{[^}]+\}[^`]*`\s*\)""",
    re.IGNORECASE | re.DOTALL
)

VARIABLE_REQUIRE_PATTERN = re.compile(
    r"""require\(\s*(?![`'"])[^)]+\)""",
    re.IGNORECASE
)

MD_IMAGE_PATTERN = re.compile(
    r"""!\[[^\]]*\]\((?P<url>[^)]+)\)""",
    re.IGNORECASE
)

MD_LINK_PATTERN = re.compile(
    r"""\[[^\]]+\]\((?P<url>[^)]+)\)""",
    re.IGNORECASE
)

HTML_IMAGE_PATTERN = re.compile(
    r"""<img[^>]+src\s*=\s*['"](?P<url>[^'"]+)['"][^>]*>""",
    re.IGNORECASE
)

CSS_VAR_URL_PATTERN = re.compile(
    r"""--[a-zA-Z0-9-]+\s*:\s*url\(\s*['"]?(?P<url>[^'")]+)['"]?\s*\)""",
    re.IGNORECASE
)

BACKGROUND_IMAGE_PATTERN = re.compile(
    r"""background(?:-image)?\s*:\s*[^;]*url\(\s*['"]?(?P<url>[^'")]+)['"]?\s*\)""",
    re.IGNORECASE
)

DYNAMIC_ASSET_PATTERNS = [
    BACKTICK_IMPORT_PATTERN,
    DYNAMIC_REQUIRE_PATTERN,
    VARIABLE_REQUIRE_PATTERN,
]


@dataclass
class ResourceReference:
    """资源引用"""
    reference: str
    source_file: str
    line_number: int
    pattern_type: str
    is_dynamic: bool = False

    def __repr__(self) -> str:
        return (
            f"ResourceReference(reference={self.reference!r}, "
            f"source={self.source_file!r}, line={self.line_number}, "
            f"type={self.pattern_type!r}, dynamic={self.is_dynamic})"
        )


@dataclass
class ScanResult:
    """文件扫描结果"""
    file_path: str
    references: List[ResourceReference] = field(default_factory=list)
    dynamic_references: List[ResourceReference] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)

    @property
    def has_dynamic(self) -> bool:
        return len(self.dynamic_references) > 0


class ContentScanner:
    """内容扫描器"""

    def __init__(
        self,
        root_dir: str | os.PathLike,
        asset_dirs: Optional[Iterable[str]] = None,
    ):
        self.root_dir = normalize_path(root_dir)
        self.asset_dirs = [normalize_path(d) for d in (asset_dirs or [])]

    def scan_file(
        self,
        file_path: str | os.PathLike,
    ) -> ScanResult:
        """扫描单个文件"""
        abs_path = normalize_path(file_path)
        result = ScanResult(file_path=abs_path)

        try:
            if file_path.endswith('.json'):
                self._scan_json(abs_path, result)
            else:
                self._scan_text_file(abs_path, result)
        except (OSError, UnicodeDecodeError) as e:
            result.errors.append(f"无法读取文件: {str(e)}")

        return result

    def _scan_text_file(self, file_path: str, result: ScanResult) -> None:
        """扫描文本文件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except UnicodeDecodeError:
            try:
                with open(file_path, 'r', encoding='latin-1') as f:
                    lines = f.readlines()
            except Exception as e:
                result.errors.append(f"编码错误: {str(e)}")
                return

        ext = Path(file_path).suffix.lower()

        for line_num, line in enumerate(lines, 1):
            self._scan_line(line, line_num, file_path, ext, result)

    def _scan_json(self, file_path: str, result: ScanResult) -> None:
        """扫描JSON文件（如asset-manifest.json）"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self._scan_json_value(data, file_path, 1, result)
        except json.JSONDecodeError as e:
            result.errors.append(f"JSON解析错误: {str(e)}")

    def _scan_json_value(
        self,
        value,
        file_path: str,
        line_num: int,
        result: ScanResult,
    ) -> None:
        """递归扫描JSON值"""
        if isinstance(value, str):
            if self._looks_like_asset_path(value):
                result.references.append(ResourceReference(
                    reference=value,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='json',
                ))
        elif isinstance(value, dict):
            for v in value.values():
                self._scan_json_value(v, file_path, line_num, result)
        elif isinstance(value, list):
            for v in value:
                self._scan_json_value(v, file_path, line_num, result)

    def _scan_line(
        self,
        line: str,
        line_num: int,
        file_path: str,
        ext: str,
        result: ScanResult,
    ) -> None:
        """扫描单行内容"""
        for pattern in DYNAMIC_ASSET_PATTERNS:
            for match in pattern.finditer(line):
                ref_text = match.group(0)
                if self._contains_asset_extension(ref_text):
                    result.dynamic_references.append(ResourceReference(
                        reference=ref_text,
                        source_file=file_path,
                        line_number=line_num,
                        pattern_type='dynamic',
                        is_dynamic=True,
                    ))

        for match in TEMPLATE_LITERAL_PATTERN.finditer(line):
            ref_text = match.group(0)
            if self._contains_asset_extension(ref_text):
                result.dynamic_references.append(ResourceReference(
                    reference=ref_text,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='template-literal',
                    is_dynamic=True,
                ))

        if ext in {'.css', '.scss', '.sass', '.less'}:
            self._scan_css_line(line, line_num, file_path, result)
        elif ext in {'.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte'}:
            self._scan_code_line(line, line_num, file_path, result)
        elif ext in {'.md', '.mdx', '.markdown'}:
            self._scan_markdown_line(line, line_num, file_path, result)
        elif ext in {'.html', '.htm'}:
            self._scan_html_line(line, line_num, file_path, result)

        self._scan_generic_line(line, line_num, file_path, result)

    def _scan_css_line(
        self,
        line: str,
        line_num: int,
        file_path: str,
        result: ScanResult,
    ) -> None:
        """扫描CSS行"""
        for match in URL_PATTERN.finditer(line):
            ref = match.group('url').strip()
            if self._looks_like_asset_path(ref):
                result.references.append(ResourceReference(
                    reference=ref,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='css-url',
                ))

        for match in CSS_VAR_URL_PATTERN.finditer(line):
            ref = match.group('url').strip()
            if self._looks_like_asset_path(ref):
                result.references.append(ResourceReference(
                    reference=ref,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='css-var-url',
                ))

        for match in BACKGROUND_IMAGE_PATTERN.finditer(line):
            ref = match.group('url').strip()
            if self._looks_like_asset_path(ref):
                result.references.append(ResourceReference(
                    reference=ref,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='background-image',
                ))

    def _scan_code_line(
        self,
        line: str,
        line_num: int,
        file_path: str,
        result: ScanResult,
    ) -> None:
        """扫描代码行"""
        for match in IMPORT_PATTERN.finditer(line):
            ref = match.group('path').strip()
            if self._looks_like_asset_path(ref):
                result.references.append(ResourceReference(
                    reference=ref,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='import',
                ))

        for match in REQUIRE_PATTERN.finditer(line):
            ref = match.group('path').strip()
            if self._looks_like_asset_path(ref):
                result.references.append(ResourceReference(
                    reference=ref,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='require',
                ))

        for match in DYNAMIC_IMPORT_PATTERN.finditer(line):
            ref = match.group('path').strip()
            if self._looks_like_asset_path(ref):
                result.references.append(ResourceReference(
                    reference=ref,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='dynamic-import',
                ))

        for match in SRC_PATTERN.finditer(line):
            ref = match.group('url').strip()
            if self._looks_like_asset_path(ref):
                result.references.append(ResourceReference(
                    reference=ref,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='src/href',
                ))

    def _scan_markdown_line(
        self,
        line: str,
        line_num: int,
        file_path: str,
        result: ScanResult,
    ) -> None:
        """扫描Markdown行"""
        for match in MD_IMAGE_PATTERN.finditer(line):
            ref = match.group('url').strip()
            if self._looks_like_asset_path(ref):
                result.references.append(ResourceReference(
                    reference=ref,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='md-image',
                ))

        for match in MD_LINK_PATTERN.finditer(line):
            ref = match.group('url').strip()
            if self._looks_like_asset_path(ref):
                result.references.append(ResourceReference(
                    reference=ref,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='md-link',
                ))

    def _scan_html_line(
        self,
        line: str,
        line_num: int,
        file_path: str,
        result: ScanResult,
    ) -> None:
        """扫描HTML行"""
        for match in HTML_IMAGE_PATTERN.finditer(line):
            ref = match.group('url').strip()
            if self._looks_like_asset_path(ref):
                result.references.append(ResourceReference(
                    reference=ref,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='html-img',
                ))

        for match in SRC_PATTERN.finditer(line):
            ref = match.group('url').strip()
            if self._looks_like_asset_path(ref):
                result.references.append(ResourceReference(
                    reference=ref,
                    source_file=file_path,
                    line_number=line_num,
                    pattern_type='html-src/href',
                ))

    def _scan_generic_line(
        self,
        line: str,
        line_num: int,
        file_path: str,
        result: ScanResult,
    ) -> None:
        """通用扫描 - 查找任何看起来像资源路径的字符串"""
        for match in re.finditer(r'["\']([^"\']+\.(?:png|jpg|jpeg|gif|webp|svg|ico|bmp|tiff|avif))["\']', line, re.IGNORECASE):
            ref = match.group(1).strip()
            if self._looks_like_asset_path(ref):
                if not any(r.reference == ref and r.line_number == line_num for r in result.references):
                    result.references.append(ResourceReference(
                        reference=ref,
                        source_file=file_path,
                        line_number=line_num,
                        pattern_type='generic-string',
                    ))

    def _looks_like_asset_path(self, path: str) -> bool:
        """判断字符串是否看起来像资源路径"""
        path = path.strip()

        if not path:
            return False

        if path.startswith(('http://', 'https://', 'data:', 'mailto:', 'tel:', '#', '//', '${')):
            return False

        if path.startswith(('webpack:', 'node:')):
            return False

        if '::' in path:
            return False

        ext = Path(path).suffix.lower()
        if ext in IMAGE_EXTENSIONS:
            return True

        if ext in {'.css', '.js', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.map'}:
            return True

        if '/' in path or '\\' in path:
            if ext in {'.json', '.html', '.htm'}:
                return True

        return False

    def _contains_asset_extension(self, text: str) -> bool:
        """检查文本是否包含资源扩展名"""
        text_lower = text.lower()
        return any(ext in text_lower for ext in IMAGE_EXTENSIONS)

    def resolve_reference(
        self,
        ref: ResourceReference,
    ) -> Optional[str]:
        """解析引用到绝对路径"""
        ref_str = ref.reference
        ref_str = ref_str.split('?')[0].split('#')[0]

        if ref_str.startswith('/'):
            candidate = normalize_path(os.path.join(self.root_dir, ref_str.lstrip('/')))
            if os.path.exists(candidate):
                return candidate
            for asset_dir in self.asset_dirs:
                candidate = normalize_path(os.path.join(asset_dir, ref_str.lstrip('/')))
                if os.path.exists(candidate):
                    return candidate
            return None

        if ref_str.startswith(('http://', 'https://', 'data:', 'mailto:', 'tel:', '#')):
            return None

        source_dir = os.path.dirname(ref.source_file)
        candidate = normalize_path(os.path.join(source_dir, ref_str))
        if os.path.exists(candidate):
            return candidate

        candidate = normalize_path(os.path.join(self.root_dir, ref_str))
        if os.path.exists(candidate):
            return candidate

        for asset_dir in self.asset_dirs:
            candidate = normalize_path(os.path.join(asset_dir, ref_str))
            if os.path.exists(candidate):
                return candidate

        if '..' in ref_str:
            parts = ref_str.split('/')
            resolved_parts: List[str] = []
            for part in parts:
                if part == '..' and resolved_parts:
                    resolved_parts.pop()
                elif part and part != '.':
                    resolved_parts.append(part)
            normalized_ref = '/'.join(resolved_parts)
            candidate = normalize_path(os.path.join(source_dir, normalized_ref))
            if os.path.exists(candidate):
                return candidate

        return None

    def resolve_references(
        self,
        references: Iterable[ResourceReference],
    ) -> Dict[str, List[ResourceReference]]:
        """解析所有引用，返回绝对路径到引用列表的映射"""
        resolved: Dict[str, List[ResourceReference]] = {}

        for ref in references:
            abs_path = self.resolve_reference(ref)
            if abs_path:
                resolved.setdefault(abs_path, []).append(ref)

        return resolved
