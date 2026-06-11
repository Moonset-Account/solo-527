"""忽略规则解析器"""

import os
from pathlib import Path
from typing import List, Optional, Set, Iterable
import pathspec

from .path_utils import normalize_path, normalize_relative


class IgnoreRule:
    """单个忽略规则"""

    def __init__(self, pattern: str, source: str = "config"):
        self.pattern = pattern
        self.source = source
        self.is_negation = pattern.startswith('!')
        self.raw_pattern = pattern[1:] if self.is_negation else pattern

    def __repr__(self) -> str:
        return f"IgnoreRule(pattern={self.pattern!r}, source={self.source!r})"


class IgnoreMatcher:
    """忽略规则匹配器"""

    def __init__(
        self,
        root_dir: str | os.PathLike,
        patterns: Optional[Iterable[str]] = None,
        exclude_dirs: Optional[Iterable[str]] = None,
        exclude_extensions: Optional[Iterable[str]] = None,
        use_gitignore: bool = True,
    ):
        self.root_dir = normalize_path(root_dir)
        self._rules: List[IgnoreRule] = []
        self._exclude_dirs: Set[str] = set()
        self._exclude_extensions: Set[str] = set()
        self._spec = pathspec.PathSpec.from_lines('gitwildmatch', [])

        if exclude_dirs:
            for d in exclude_dirs:
                self.add_exclude_dir(d)

        if exclude_extensions:
            for ext in exclude_extensions:
                self.add_exclude_extension(ext)

        if patterns:
            for p in patterns:
                self.add_pattern(p, source="cli")

        if use_gitignore:
            self._load_gitignore()

        self._rebuild_spec()

    def add_pattern(self, pattern: str, source: str = "config") -> None:
        """添加.gitignore风格的模式"""
        rule = IgnoreRule(pattern, source)
        self._rules.append(rule)
        self._rebuild_spec()

    def add_exclude_dir(self, dir_path: str) -> None:
        """添加要排除的目录"""
        dir_str = os.fspath(dir_path)
        if not os.path.isabs(dir_str):
            dir_str = os.path.join(self.root_dir, dir_str)
        normalized = normalize_path(dir_str).rstrip('/')
        self._exclude_dirs.add(normalized)
        rel = normalize_relative(normalized, self.root_dir)
        if rel != normalized:
            self._rules.append(IgnoreRule(f"{rel}/", source="exclude_dir"))
            self._rules.append(IgnoreRule(f"{rel}/**", source="exclude_dir"))
        self._rebuild_spec()

    def add_exclude_extension(self, extension: str) -> None:
        """添加要排除的文件扩展名"""
        ext = extension.lower().lstrip('.')
        self._exclude_extensions.add(f'.{ext}')
        self._rules.append(IgnoreRule(f"*.{ext}", source="exclude_ext"))
        self._rebuild_spec()

    def _load_gitignore(self) -> None:
        """加载.gitignore文件"""
        gitignore_path = Path(self.root_dir) / '.gitignore'
        if gitignore_path.exists():
            try:
                with open(gitignore_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            self._rules.append(IgnoreRule(line, source=".gitignore"))
            except (OSError, UnicodeDecodeError):
                pass

    def _rebuild_spec(self) -> None:
        """重新构建pathspec"""
        patterns = [rule.pattern for rule in self._rules]
        self._spec = pathspec.PathSpec.from_lines('gitwildmatch', patterns)

    def is_ignored(self, file_path: str | os.PathLike) -> bool:
        """检查路径是否被忽略"""
        abs_path = normalize_path(file_path)

        for ext in self._exclude_extensions:
            if abs_path.lower().endswith(ext):
                return True

        for d in self._exclude_dirs:
            if abs_path == d or abs_path.startswith(d + '/'):
                return True

        try:
            rel_path = normalize_relative(abs_path, self.root_dir)
            return self._spec.match_file(rel_path)
        except ValueError:
            return False

    def filter_files(self, files: Iterable[str]) -> List[str]:
        """过滤掉被忽略的文件"""
        return [f for f in files if not self.is_ignored(f)]

    def get_rules(self) -> List[IgnoreRule]:
        """获取所有规则"""
        return list(self._rules)

    def get_exclude_dirs(self) -> Set[str]:
        """获取排除的目录"""
        return set(self._exclude_dirs)

    def get_exclude_extensions(self) -> Set[str]:
        """获取排除的扩展名"""
        return set(self._exclude_extensions)
