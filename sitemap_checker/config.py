from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Set
from urllib.parse import urlparse

from pydantic import BaseModel, Field


class CheckerConfig(BaseModel):
    max_depth: int = Field(default=2, ge=0, description="最大爬取深度，0 表示仅检查 sitemap 中的链接")
    max_redirects: int = Field(default=3, ge=1, description="最大重定向链长度，超过视为问题")
    request_timeout: float = Field(default=15.0, gt=0, description="单次请求超时时间（秒）")
    rate_limit_per_second: int = Field(default=10, ge=1, description="每秒最大请求数（速率限制）")
    max_concurrent: int = Field(default=20, ge=1, description="最大并发请求数")
    retries: int = Field(default=2, ge=0, description="网络错误重试次数")
    retry_backoff: float = Field(default=2.0, gt=0, description="重试退避系数（秒）")
    verify_ssl: bool = Field(default=True, description="是否验证 SSL 证书")
    user_agent: str = Field(
        default="Mozilla/5.0 (compatible; SitemapChecker/0.1; +https://example.com/bot)",
        description="User-Agent 字符串",
    )
    check_title: bool = Field(default=True, description="是否检查标题缺失")
    check_canonical: bool = Field(default=True, description="是否检查 canonical 冲突")
    check_images: bool = Field(default=True, description="是否检查图片链接")
    user_whitelist: List[str] = Field(default_factory=list, description="用户白名单 URL 列表")

    def to_summary_dict(self) -> dict:
        return {
            "max_depth": self.max_depth,
            "max_redirects": self.max_redirects,
            "request_timeout": self.request_timeout,
            "rate_limit_per_second": self.rate_limit_per_second,
            "max_concurrent": self.max_concurrent,
            "retries": self.retries,
            "verify_ssl": self.verify_ssl,
            "check_title": self.check_title,
            "check_canonical": self.check_canonical,
            "check_images": self.check_images,
            "whitelist_count": len(self.user_whitelist),
        }


@dataclass
class RuntimeState:
    base_domain: Optional[str] = None
    whitelist_patterns: Set[str] = field(default_factory=set)
    visited_urls: Set[str] = field(default_factory=set)
    checked_urls: Set[str] = field(default_factory=set)
    sitemap_urls: List[str] = field(default_factory=list)
    exported_pages: List[str] = field(default_factory=list)

    def is_whitelisted(self, url: str) -> bool:
        normalized = url.rstrip("/")
        for pattern in self.whitelist_patterns:
            if pattern.endswith("*"):
                prefix = pattern.rstrip("*").rstrip("/")
                if normalized.startswith(prefix):
                    return True
            elif normalized == pattern.rstrip("/"):
                return True
        return False

    def is_internal(self, url: str) -> bool:
        if not self.base_domain:
            return False
        parsed = urlparse(url)
        return parsed.netloc == self.base_domain or parsed.netloc.endswith("." + self.base_domain)


def load_whitelist(file_path: Optional[Path]) -> Set[str]:
    if not file_path or not file_path.exists():
        return set()
    patterns: Set[str] = set()
    for line in file_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        patterns.add(line)
    return patterns


def load_exported_pages(file_path: Optional[Path]) -> List[str]:
    if not file_path or not file_path.exists():
        return []
    urls: List[str] = []
    text = file_path.read_text(encoding="utf-8")
    suffix = file_path.suffix.lower()
    if suffix == ".csv":
        import csv
        reader = csv.reader(text.splitlines())
        for row in reader:
            if row:
                cell = row[0].strip()
                if cell and cell.lower() not in ("url", "链接", "page"):
                    urls.append(cell)
    else:
        for line in text.splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                urls.append(line)
    return urls
