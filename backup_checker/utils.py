"""通用工具函数：跨平台路径、哈希计算、保留周期解析等。"""
from __future__ import annotations

import hashlib
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Optional, Union
from urllib.parse import unquote


PathLike = Union[str, os.PathLike]


# ---------------------------------------------------------------------------
# 跨平台路径处理
# ---------------------------------------------------------------------------

def normalize_path(path: PathLike) -> Path:
    """将任意格式路径规范化为当前平台的 Path 对象。

    处理以下情况：
    * Windows 反斜杠路径在 Linux/macOS 下运行
    * URL 编码的路径（如 %20 表示空格）
    * UNC 路径（Windows 共享）
    * ``~`` 展开
    """
    s = os.fspath(path)
    if isinstance(s, bytes):
        s = s.decode(sys.getfilesystemencoding() or "utf-8")
    # 1. URL 解码
    if "%" in s:
        s = unquote(s)
    # 2. Windows 风格 => 当前平台
    if "\\" in s and os.sep != "\\":
        # 判断是否是 UNC 路径
        if s.startswith("\\\\") or s.startswith("//"):
            unc = s.lstrip("\\/")
            parts = unc.split("\\", 1)
            if len(parts) == 2:
                server, rest = parts
                rest = rest.replace("\\", "/")
                s = f"//{server}/{rest}"
        else:
            s = s.replace("\\", "/")
    # 3. ~ 展开
    if s.startswith("~"):
        s = os.path.expanduser(s)
    return Path(s)


def manifest_to_native_path(manifest_path: str, backup_dir: Path) -> Path:
    """将清单中记录的相对/绝对路径转换为当前平台的本地绝对路径。

    清单中的路径统一使用 POSIX 风格（斜杠分隔）。
    """
    mp = manifest_path.replace("\\", "/")
    pure = PurePosixPath(mp)
    if pure.is_absolute():
        # 绝对路径：判断是否是 Windows 盘符路径
        match = re.match(r"^([A-Za-z]):/(.*)$", mp)
        if match and os.name == "nt":
            drive, rest = match.groups()
            return Path(f"{drive}:/{rest}")
        # 否则作为普通绝对路径处理
        return Path(pure)
    # 相对路径：基于备份目录
    return backup_dir.joinpath(*pure.parts)


def native_to_manifest_path(path: Path, backup_dir: Path) -> str:
    """将本地路径转换为清单记录用的 POSIX 风格相对路径（优先）或绝对路径。"""
    try:
        rel = path.relative_to(backup_dir)
        return rel.as_posix()
    except ValueError:
        return path.as_posix()


def make_location_hint(path: Path) -> str:
    """生成错误定位提示，展示绝对路径与当前工作目录的相对位置。"""
    abs_path = path.resolve()
    try:
        rel = abs_path.relative_to(Path.cwd())
        return f"{abs_path} (./{rel.as_posix()})"
    except ValueError:
        return str(abs_path)


# ---------------------------------------------------------------------------
# 哈希计算
# ---------------------------------------------------------------------------

SUPPORTED_HASHES = {"md5", "sha1", "sha256", "sha512"}
_HASH_CHUNK_SIZE = 1024 * 1024  # 1 MiB


def is_supported_hash(algo: str) -> bool:
    return algo.lower() in SUPPORTED_HASHES


def compute_file_hash(
    path: Path,
    algorithm: str = "sha256",
    *,
    chunk_size: int = _HASH_CHUNK_SIZE,
) -> str:
    """分块计算文件哈希，避免大文件占用过多内存。

    :raises FileNotFoundError: 文件不存在
    :raises PermissionError: 无读取权限
    :raises ValueError: 算法不支持
    """
    algo = algorithm.lower()
    if algo not in SUPPORTED_HASHES:
        raise ValueError(
            f"不支持的哈希算法 '{algorithm}'，可选值：{', '.join(sorted(SUPPORTED_HASHES))}"
        )
    hasher = hashlib.new(algo)
    with open(path, "rb") as fh:
        while True:
            chunk = fh.read(chunk_size)
            if not chunk:
                break
            hasher.update(chunk)
    return hasher.hexdigest()


def compute_string_hash(data: str, algorithm: str = "sha256") -> str:
    """计算字符串哈希（用于测试和调试）。"""
    algo = algorithm.lower()
    if algo not in SUPPORTED_HASHES:
        raise ValueError(f"不支持的哈希算法 '{algorithm}'")
    return hashlib.new(algo, data.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# 保留周期解析（7d / 2w / 1m / 365d）
# ---------------------------------------------------------------------------

_RETENTION_RE = re.compile(r"^\s*(\d+)\s*([dwmy]?)\s*$", re.IGNORECASE)


def parse_retention(value: Union[str, int, None]) -> Optional[int]:
    """将保留周期字符串解析为天数。

    接受的格式：
    * ``None`` => 返回 None
    * 整数    => 直接视为天数
    * ``"7"`` => 7 天
    * ``"7d"`` / ``"7D"`` => 7 天
    * ``"2w"`` => 14 天
    * ``"1m"`` => 30 天（近似）
    * ``"1y"`` => 365 天（近似，不考虑闰年）

    :raises ValueError: 格式无效
    """
    if value is None:
        return None
    if isinstance(value, int):
        if value < 0:
            raise ValueError(f"保留周期不能为负数：{value}")
        return value
    if not isinstance(value, str):
        raise TypeError(f"保留周期必须是 str 或 int，实际：{type(value).__name__}")
    s = value.strip()
    if not s:
        raise ValueError("保留周期不能为空")
    m = _RETENTION_RE.match(s)
    if not m:
        raise ValueError(
            f"保留周期格式无效：'{value}'。"
            f"正确格式示例：7d / 2w / 1m / 365d"
        )
    num = int(m.group(1))
    unit = m.group(2).lower() or "d"
    multiplier = {"d": 1, "w": 7, "m": 30, "y": 365}[unit]
    days = num * multiplier
    if days <= 0:
        raise ValueError(f"保留周期必须为正数：{value}")
    return days


def format_retention(days: int) -> str:
    """将天数格式化为易读字符串。"""
    if days <= 0:
        return "0d"
    if days % 365 == 0:
        return f"{days // 365}y"
    if days % 30 == 0 and days >= 30:
        return f"{days // 30}m"
    if days % 7 == 0 and days >= 7:
        return f"{days // 7}w"
    return f"{days}d"


def is_backup_expired(
    created_at: Optional[datetime],
    retention_days: Optional[int],
    *,
    now: Optional[datetime] = None,
) -> tuple[bool, Optional[timedelta]]:
    """判断备份是否过期，返回 (是否过期, 过期/剩余时间)。"""
    if created_at is None or retention_days is None:
        return False, None
    now = now or datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    age: timedelta = now - created_at
    limit = timedelta(days=retention_days)
    return age > limit, age - limit if age > limit else limit - age


# ---------------------------------------------------------------------------
# 日期格式化
# ---------------------------------------------------------------------------

def format_datetime(dt: Optional[datetime]) -> str:
    if dt is None:
        return "-"
    if dt.tzinfo is None:
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    return dt.astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")


def format_timedelta(td: Optional[timedelta]) -> str:
    if td is None:
        return "-"
    total = int(td.total_seconds())
    if total < 0:
        sign = "-"
        total = -total
    else:
        sign = ""
    days, rem = divmod(total, 86400)
    hours, rem = divmod(rem, 3600)
    minutes, seconds = divmod(rem, 60)
    parts = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}m")
    if seconds or not parts:
        parts.append(f"{seconds}s")
    return sign + " ".join(parts)


# ---------------------------------------------------------------------------
# 文件大小格式化
# ---------------------------------------------------------------------------

_SIZE_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"]


def format_size(num_bytes: Optional[int]) -> str:
    if num_bytes is None:
        return "-"
    if num_bytes < 0:
        return str(num_bytes)
    size = float(num_bytes)
    for u in _SIZE_UNITS:
        if size < 1024.0 or u == _SIZE_UNITS[-1]:
            if u == "B":
                return f"{int(size)} {u}"
            return f"{size:.2f} {u}"
        size /= 1024.0
    return f"{size:.2f} {_SIZE_UNITS[-1]}"
