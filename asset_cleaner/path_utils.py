"""路径归一化和文件系统工具模块"""

import os
import sys
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Iterator, Optional, Tuple, List, Set, Callable
from dataclasses import dataclass, field


IMAGE_EXTENSIONS: Set[str] = {
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
    '.bmp', '.tiff', '.tif', '.avif', '.apng',
}

STYLE_EXTENSIONS: Set[str] = {'.css', '.scss', '.sass', '.less'}

CODE_EXTENSIONS: Set[str] = {
    '.tsx', '.ts', '.jsx', '.js', '.vue', '.svelte',
}

MARKDOWN_EXTENSIONS: Set[str] = {'.md', '.mdx', '.markdown'}

BUILD_EXTENSIONS: Set[str] = {
    '.js', '.css', '.html', '.map', '.json',
}

ASSET_FILENAMES: Set[str] = {
    'asset-manifest.json', 'manifest.json', 'stats.json',
}


@dataclass
class ScanProgress:
    """扫描进度追踪"""
    total_files: int = 0
    processed_files: int = 0
    current_dir: str = ""
    skipped_files: List[Tuple[str, str]] = field(default_factory=list)
    symlink_loops: List[Tuple[str, str]] = field(default_factory=list)
    update_callback: Optional[Callable[[], None]] = None

    def _notify(self):
        if self.update_callback:
            self.update_callback()

    def increment(self):
        self.processed_files += 1
        self._notify()

    def set_current_dir(self, path: str):
        self.current_dir = path
        self._notify()

    def set_total(self, total: int):
        self.total_files = max(self.total_files, total)
        self._notify()

    def add_skipped(self, path: str, reason: str):
        self.skipped_files.append((path, reason))

    def add_symlink_loop(self, path: str, reason: str):
        self.symlink_loops.append((path, reason))
        self.skipped_files.append((path, reason))


def normalize_path(path: str | os.PathLike) -> str:
    """
    路径归一化：
    - 转换为绝对路径
    - 解析所有符号链接（但不跟随循环）
    - 统一使用正斜杠
    - 规范化大小写（Windows）
    - 移除冗余分隔符和点
    """
    path_str = os.fspath(path)
    path_str = path_str.replace('\\', '/')

    p = Path(path_str)

    try:
        p = p.resolve(strict=False)
    except (OSError, RuntimeError):
        p = p.absolute()

    posix_path = p.as_posix()

    if sys.platform == 'win32':
        posix_path = posix_path.lower()

    return posix_path


def normalize_relative(path: str | os.PathLike, base: str | os.PathLike) -> str:
    """生成相对于base的归一化路径"""
    abs_path = normalize_path(path)
    abs_base = normalize_path(base)

    try:
        rel = PurePosixPath(abs_path).relative_to(PurePosixPath(abs_base))
        return rel.as_posix()
    except ValueError:
        return abs_path


def is_image_file(path: str | os.PathLike) -> bool:
    """判断是否为图片文件"""
    return Path(path).suffix.lower() in IMAGE_EXTENSIONS


def is_style_file(path: str | os.PathLike) -> bool:
    """判断是否为样式文件"""
    return Path(path).suffix.lower() in STYLE_EXTENSIONS


def is_code_file(path: str | os.PathLike) -> bool:
    """判断是否为代码文件"""
    return Path(path).suffix.lower() in CODE_EXTENSIONS


def is_markdown_file(path: str | os.PathLike) -> bool:
    """判断是否为Markdown文件"""
    return Path(path).suffix.lower() in MARKDOWN_EXTENSIONS


def is_build_file(path: str | os.PathLike) -> bool:
    """判断是否为构建产物文件"""
    p = Path(path)
    return (
        p.suffix.lower() in BUILD_EXTENSIONS
        or p.name in ASSET_FILENAMES
    )


def is_scannable_file(path: str | os.PathLike) -> bool:
    """判断是否为需要扫描内容的文件"""
    return any([
        is_style_file(path),
        is_code_file(path),
        is_markdown_file(path),
        is_build_file(path),
    ])


def safe_walk(
    root: str | os.PathLike,
    progress: Optional[ScanProgress] = None,
    max_depth: int = 100,
) -> Iterator[Tuple[str, List[str], List[str]]]:
    """
    安全的目录遍历，检测软链接循环
    遇到循环时记录并继续处理其他文件
    """
    root = Path(root).resolve(strict=False)
    visited: Set[str] = set()
    progress = progress or ScanProgress()

    def _walk(current: Path, depth: int = 0) -> Iterator[Tuple[str, List[str], List[str]]]:
        if depth > max_depth:
            progress.add_skipped(
                str(current),
                f"超过最大深度 {max_depth}"
            )
            return

        try:
            real_path = current.resolve(strict=False)
            real_key = str(real_path)

            if current.is_symlink():
                if real_key in visited:
                    loop_reason = (
                        f"软链接循环检测: {current} -> {real_path} "
                        f"(已在路径中访问过)"
                    )
                    progress.add_symlink_loop(str(current), loop_reason)
                    return

            visited.add(real_key)
            progress.set_current_dir(str(current))

            if not current.is_dir():
                return

            try:
                entries = list(current.iterdir())
            except (PermissionError, OSError) as e:
                progress.add_skipped(str(current), f"无法访问: {str(e)}")
                return

            dirs: List[str] = []
            files: List[str] = []

            for entry in entries:
                try:
                    entry_str = str(entry)
                    if os.path.isdir(entry_str):
                        dirs.append(entry.name)
                    else:
                        files.append(entry.name)
                        progress.total_files += 1
                except OSError as e:
                    progress.add_skipped(str(entry), f"无法读取: {str(e)}")

            yield str(current), dirs, files

            for d in sorted(dirs):
                next_path = current / d
                yield from _walk(next_path, depth + 1)

            visited.discard(real_key)

        except (PermissionError, OSError) as e:
            progress.add_skipped(str(current), f"访问被拒绝: {str(e)}")

    yield from _walk(root)


def collect_files(
    root: str | os.PathLike,
    progress: Optional[ScanProgress] = None,
) -> List[str]:
    """收集目录下所有文件的归一化路径"""
    files: List[str] = []
    for dirpath, _, filenames in safe_walk(root, progress):
        for fname in filenames:
            fpath = os.path.join(dirpath, fname)
            files.append(normalize_path(fpath))
    return files


def match_extension(path: str, extensions: Set[str]) -> bool:
    """检查文件扩展名是否匹配"""
    return Path(path).suffix.lower() in extensions


def get_extension(path: str) -> str:
    """获取归一化的文件扩展名"""
    return Path(path).suffix.lower()
