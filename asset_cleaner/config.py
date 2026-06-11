"""配置文件解析器"""

import os
import json
from typing import List, Optional, Set, Dict, Any
from dataclasses import dataclass, field
from pathlib import Path

try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False

from .path_utils import normalize_path


CONFIG_FILENAMES = [
    ".asset-cleaner.yaml",
    ".asset-cleaner.yml",
    "asset-cleaner.yaml",
    "asset-cleaner.yml",
]


@dataclass
class CleanerConfig:
    """清理工具配置"""
    root_dir: str
    asset_dirs: List[str] = field(default_factory=list)
    ignore_patterns: List[str] = field(default_factory=list)
    exclude_dirs: List[str] = field(default_factory=list)
    exclude_extensions: List[str] = field(default_factory=list)
    use_gitignore: bool = True
    show_progress: bool = True
    show_dynamic: bool = True
    show_reference_chains: bool = True
    max_depth: int = 100
    dry_run: bool = True
    create_backup: bool = True

    @classmethod
    def default(cls, root_dir: str) -> "CleanerConfig":
        """创建默认配置"""
        return cls(
            root_dir=normalize_path(root_dir),
            asset_dirs=[normalize_path(root_dir)],
        )

    def merge(self, other: Dict[str, Any]) -> "CleanerConfig":
        """合并配置"""
        for key, value in other.items():
            if hasattr(self, key) and value is not None:
                if isinstance(value, list) and isinstance(getattr(self, key), list):
                    current = getattr(self, key)
                    setattr(self, key, current + value)
                else:
                    setattr(self, key, value)
        return self


def find_config_file(root_dir: str | os.PathLike) -> Optional[str]:
    """查找配置文件"""
    root = Path(root_dir)

    for filename in CONFIG_FILENAMES:
        config_path = root / filename
        if config_path.exists():
            return str(config_path)

    parent = root.parent
    while parent != parent.parent:
        for filename in CONFIG_FILENAMES:
            config_path = parent / filename
            if config_path.exists():
                return str(config_path)
        parent = parent.parent

    return None


def load_config(
    root_dir: str | os.PathLike,
    config_path: Optional[str] = None,
) -> CleanerConfig:
    """加载配置文件"""
    root_dir = normalize_path(root_dir)
    config = CleanerConfig.default(root_dir)

    if config_path is None:
        config_path = find_config_file(root_dir)

    if config_path and os.path.exists(config_path):
        config_data = _parse_config_file(config_path)
        if config_data:
            config = _apply_config_data(config, config_data, os.path.dirname(config_path))

    return config


def _parse_config_file(config_path: str) -> Optional[Dict[str, Any]]:
    """解析配置文件"""
    ext = Path(config_path).suffix.lower()

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()

        if ext in {'.yaml', '.yml'}:
            if not YAML_AVAILABLE:
                raise ImportError("需要 PyYAML 来解析 YAML 配置文件")
            return yaml.safe_load(content) or {}
        elif ext == '.json':
            return json.loads(content)

    except (OSError, yaml.YAMLError, json.JSONDecodeError) as e:
        raise ValueError(f"配置文件解析失败: {str(e)}")

    return None


def _apply_config_data(
    config: CleanerConfig,
    data: Dict[str, Any],
    config_dir: str,
) -> CleanerConfig:
    """应用配置数据"""
    if 'asset_dirs' in data and data['asset_dirs']:
        asset_dirs = []
        for d in data['asset_dirs']:
            if os.path.isabs(d):
                asset_dirs.append(normalize_path(d))
            else:
                asset_dirs.append(normalize_path(os.path.join(config_dir, d)))
        config.asset_dirs = asset_dirs

    if 'ignore_patterns' in data and data['ignore_patterns']:
        config.ignore_patterns = list(data['ignore_patterns'])

    if 'exclude_dirs' in data and data['exclude_dirs']:
        exclude_dirs = []
        for d in data['exclude_dirs']:
            if os.path.isabs(d):
                exclude_dirs.append(normalize_path(d))
            else:
                exclude_dirs.append(normalize_path(os.path.join(config.root_dir, d)))
        config.exclude_dirs = exclude_dirs

    if 'exclude_extensions' in data and data['exclude_extensions']:
        config.exclude_extensions = list(data['exclude_extensions'])

    if 'use_gitignore' in data:
        config.use_gitignore = bool(data['use_gitignore'])

    if 'show_progress' in data:
        config.show_progress = bool(data['show_progress'])

    if 'show_dynamic' in data:
        config.show_dynamic = bool(data['show_dynamic'])

    if 'show_reference_chains' in data:
        config.show_reference_chains = bool(data['show_reference_chains'])

    if 'max_depth' in data:
        config.max_depth = int(data['max_depth'])

    if 'dry_run' in data:
        config.dry_run = bool(data['dry_run'])

    if 'create_backup' in data:
        config.create_backup = bool(data['create_backup'])

    return config


def create_default_config(config_path: str, force: bool = False) -> str:
    """创建默认配置文件"""
    if os.path.exists(config_path) and not force:
        raise SystemExit(f"配置文件已存在: {config_path}")

    default_config = """# Asset Cleaner 配置文件
# 所有路径可以是绝对路径或相对于此配置文件的路径

# 资产目录 - 要扫描的图片/资源目录
asset_dirs:
  - ./public
  - ./src/assets
  - ./static

# 忽略模式（.gitignore 风格）
ignore_patterns:
  - node_modules/
  - dist/
  - build/
  - .git/

# 排除的目录（这些目录下的资源不会被删除）
exclude_dirs:
  - ./public/favicons
  - ./src/assets/fonts

# 排除的文件扩展名（这些文件不会被删除）
exclude_extensions:
  - .svg
  - .ico

# 是否使用 .gitignore
use_gitignore: true

# 显示选项
show_progress: true
show_dynamic: true
show_reference_chains: true

# 扫描最大深度
max_depth: 100

# 默认是否为 dry-run 模式
dry_run: true

# 删除前是否创建备份
create_backup: true
"""

    with open(config_path, 'w', encoding='utf-8') as f:
        f.write(default_config)

    return config_path
