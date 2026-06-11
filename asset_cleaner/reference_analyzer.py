"""引用分析器 - 分析资源引用关系"""

import os
from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass, field
from collections import defaultdict

from .path_utils import (
    normalize_path,
    normalize_relative,
    is_image_file,
    is_scannable_file,
    collect_files,
    ScanProgress,
    IMAGE_EXTENSIONS,
)
from .ignore_rules import IgnoreMatcher
from .content_scanner import ContentScanner, ResourceReference, ScanResult


@dataclass
class ReferenceChain:
    """引用链"""
    asset_path: str
    references: List[ResourceReference] = field(default_factory=list)

    @property
    def is_referenced(self) -> bool:
        return len(self.references) > 0

    @property
    def reference_count(self) -> int:
        return len(self.references)

    def get_source_files(self) -> Set[str]:
        return {ref.source_file for ref in self.references}


@dataclass
class DynamicReferenceInfo:
    """动态引用信息"""
    file_path: str
    references: List[ResourceReference] = field(default_factory=list)
    pattern_hints: List[str] = field(default_factory=list)

    @property
    def count(self) -> int:
        return len(self.references)


@dataclass
class AnalysisResult:
    """分析结果"""
    all_assets: List[str] = field(default_factory=list)
    referenced_assets: Dict[str, ReferenceChain] = field(default_factory=dict)
    unreferenced_assets: List[str] = field(default_factory=list)
    dynamic_references: Dict[str, DynamicReferenceInfo] = field(default_factory=dict)
    scan_errors: List[Tuple[str, str]] = field(default_factory=list)
    total_scanned_files: int = 0
    total_references: int = 0

    def get_unreferenced_images(self) -> List[str]:
        return [a for a in self.unreferenced_assets if is_image_file(a)]

    def get_reference_chain(self, asset_path: str) -> Optional[ReferenceChain]:
        return self.referenced_assets.get(normalize_path(asset_path))

    def get_dynamic_for_asset(self, asset_path: str) -> List[DynamicReferenceInfo]:
        """获取可能引用某个资产的动态引用"""
        asset_name = os.path.basename(asset_path).lower()
        asset_ext = os.path.splitext(asset_name)[1]
        result: List[DynamicReferenceInfo] = []

        for dyn in self.dynamic_references.values():
            for ref in dyn.references:
                ref_lower = ref.reference.lower()
                if asset_ext in ref_lower or asset_name.split('.')[0] in ref_lower:
                    result.append(dyn)
                    break

        return result


class ReferenceAnalyzer:
    """引用分析器"""

    def __init__(
        self,
        root_dir: str | os.PathLike,
        asset_dirs: Optional[List[str]] = None,
        ignore_matcher: Optional[IgnoreMatcher] = None,
    ):
        self.root_dir = normalize_path(root_dir)
        self.asset_dirs = [normalize_path(d) for d in (asset_dirs or [self.root_dir])]
        self.ignore_matcher = ignore_matcher or IgnoreMatcher(self.root_dir)
        self.scanner = ContentScanner(self.root_dir, self.asset_dirs)

    def analyze(
        self,
        progress: Optional[ScanProgress] = None,
    ) -> AnalysisResult:
        """执行完整分析"""
        progress = progress or ScanProgress()

        all_files = self._collect_all_files(progress)

        asset_files = self._filter_assets(all_files)

        scannable_files = [f for f in all_files if is_scannable_file(f)]

        scan_results, dynamic_refs = self._scan_files(scannable_files, progress)

        all_references: List[ResourceReference] = []
        scan_errors: List[Tuple[str, str]] = []

        for result in scan_results:
            all_references.extend(result.references)
            for error in result.errors:
                scan_errors.append((result.file_path, error))

        resolved_refs = self.scanner.resolve_references(all_references)

        referenced_assets: Dict[str, ReferenceChain] = {}
        for asset_path, refs in resolved_refs.items():
            if asset_path in asset_files:
                chain = ReferenceChain(asset_path=asset_path, references=refs)
                referenced_assets[asset_path] = chain

        referenced_paths = set(referenced_assets.keys())
        unreferenced = [a for a in asset_files if a not in referenced_paths]

        total_refs = sum(chain.reference_count for chain in referenced_assets.values())

        return AnalysisResult(
            all_assets=sorted(asset_files),
            referenced_assets=referenced_assets,
            unreferenced_assets=sorted(unreferenced),
            dynamic_references=dynamic_refs,
            scan_errors=scan_errors,
            total_scanned_files=len(scannable_files),
            total_references=total_refs,
        )

    def _collect_all_files(self, progress: ScanProgress) -> List[str]:
        """收集所有文件"""
        all_files: Set[str] = set()

        for asset_dir in self.asset_dirs:
            files = collect_files(asset_dir, progress)
            all_files.update(files)

        scannable_files = collect_files(self.root_dir, progress)
        all_files.update(scannable_files)

        filtered = self.ignore_matcher.filter_files(all_files)
        return sorted(filtered)

    def _filter_assets(self, files: List[str]) -> List[str]:
        """过滤出资源文件"""
        assets: List[str] = []

        for f in files:
            if is_image_file(f):
                assets.append(f)
            elif self._is_in_asset_dir(f):
                ext = os.path.splitext(f)[1].lower()
                if ext in {'.svg', '.woff', '.woff2', '.ttf', '.otf', '.eot'}:
                    assets.append(f)

        return assets

    def _is_in_asset_dir(self, file_path: str) -> bool:
        """检查文件是否在资产目录中"""
        for asset_dir in self.asset_dirs:
            if file_path == asset_dir or file_path.startswith(asset_dir + '/'):
                return True
        return False

    def _scan_files(
        self,
        files: List[str],
        progress: ScanProgress,
    ) -> Tuple[List[ScanResult], Dict[str, DynamicReferenceInfo]]:
        """扫描所有文件"""
        results: List[ScanResult] = []
        dynamic_refs: Dict[str, DynamicReferenceInfo] = {}

        total = len(files)
        progress.set_total(total)

        for file_path in files:
            progress.set_current_dir(os.path.dirname(file_path))
            result = self.scanner.scan_file(file_path)
            results.append(result)
            progress.increment()

            if result.has_dynamic:
                dyn_info = DynamicReferenceInfo(
                    file_path=file_path,
                    references=list(result.dynamic_references),
                    pattern_hints=self._extract_pattern_hints(result.dynamic_references),
                )
                dynamic_refs[file_path] = dyn_info

        return results, dynamic_refs

    def _extract_pattern_hints(
        self,
        references: List[ResourceReference],
    ) -> List[str]:
        """从动态引用中提取可能的模式提示"""
        hints: Set[str] = set()

        for ref in references:
            text = ref.reference

            for ext in IMAGE_EXTENSIONS:
                if ext in text.lower():
                    idx = text.lower().find(ext)
                    start = max(0, idx - 30)
                    prefix = text[start:idx]
                    if '${' in prefix:
                        hints.add(f"*{ext}")

            if 'require(' in text or 'import(' in text:
                if '`' in text:
                    hints.add("模板字符串动态导入")

            if '/' in text and '${' in text:
                parts = text.split('/')
                for part in parts:
                    if '${' in part and '.' not in part:
                        hints.add(f"动态目录段: {part.strip('`')}")

        return sorted(hints)

    def build_reference_chain(
        self,
        asset_path: str,
        max_depth: int = 5,
    ) -> List[str]:
        """构建引用链（从资产到入口文件）"""
        result = AnalysisResult(
            all_assets=[],
            referenced_assets={},
            unreferenced_assets=[],
            dynamic_references={},
            scan_errors=[],
            total_scanned_files=0,
            total_references=0,
        )

        chain = self._build_chain(asset_path, set(), max_depth)
        return chain

    def _build_chain(
        self,
        current_path: str,
        visited: Set[str],
        remaining_depth: int,
    ) -> List[str]:
        """递归构建引用链"""
        if remaining_depth <= 0 or current_path in visited:
            return []

        visited.add(current_path)
        chain = [current_path]

        return chain
