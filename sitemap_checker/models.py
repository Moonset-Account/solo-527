from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional
from urllib.parse import urlparse

from pydantic import BaseModel, Field, HttpUrl, field_validator


class LinkType(str, Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"
    IMAGE = "image"
    SITEMAP = "sitemap"
    ASSET = "asset"


class IssueType(str, Enum):
    NOT_FOUND_404 = "not_found_404"
    REDIRECT_CHAIN = "redirect_chain"
    REDIRECT_LOOP = "redirect_loop"
    TITLE_MISSING = "title_missing"
    TITLE_EMPTY = "title_empty"
    CANONICAL_CONFLICT = "canonical_conflict"
    CANONICAL_MISSING = "canonical_missing"
    NETWORK_ERROR = "network_error"
    TIMEOUT = "timeout"
    SSL_ERROR = "ssl_error"
    DNS_ERROR = "dns_error"
    SERVER_ERROR = "server_error"
    INVALID_URL = "invalid_url"


class Severity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class RedirectStep(BaseModel):
    url: str
    status_code: int
    redirect_to: Optional[str] = None


class PageMeta(BaseModel):
    url: str
    title: Optional[str] = None
    canonical: Optional[str] = None
    status_code: Optional[int] = None
    final_url: Optional[str] = None
    redirect_chain: List[RedirectStep] = Field(default_factory=list)
    content_type: Optional[str] = None
    response_time_ms: Optional[float] = None


class LinkReference(BaseModel):
    url: str
    anchor_text: Optional[str] = None
    link_type: LinkType
    source_url: Optional[str] = None
    raw_html: Optional[str] = None


class Issue(BaseModel):
    issue_type: IssueType
    severity: Severity
    message: str
    details: dict = Field(default_factory=dict)

    @classmethod
    def not_found(cls, url: str) -> "Issue":
        return cls(
            issue_type=IssueType.NOT_FOUND_404,
            severity=Severity.CRITICAL,
            message=f"链接返回 404: {url}",
            details={"url": url},
        )

    @classmethod
    def redirect_chain(cls, url: str, chain: List[RedirectStep], max_allowed: int) -> "Issue":
        return cls(
            issue_type=IssueType.REDIRECT_CHAIN,
            severity=Severity.WARNING,
            message=f"重定向链过长 ({len(chain)} 步, 上限 {max_allowed}): {url}",
            details={"url": url, "chain_length": len(chain), "max_allowed": max_allowed},
        )

    @classmethod
    def redirect_loop(cls, url: str) -> "Issue":
        return cls(
            issue_type=IssueType.REDIRECT_LOOP,
            severity=Severity.CRITICAL,
            message=f"检测到重定向循环: {url}",
            details={"url": url},
        )

    @classmethod
    def title_missing(cls, url: str) -> "Issue":
        return cls(
            issue_type=IssueType.TITLE_MISSING,
            severity=Severity.WARNING,
            message=f"页面缺少 <title> 标签: {url}",
            details={"url": url},
        )

    @classmethod
    def title_empty(cls, url: str) -> "Issue":
        return cls(
            issue_type=IssueType.TITLE_EMPTY,
            severity=Severity.WARNING,
            message=f"页面 <title> 标签为空: {url}",
            details={"url": url},
        )

    @classmethod
    def canonical_conflict(cls, url: str, canonical: str, actual: str) -> "Issue":
        return cls(
            issue_type=IssueType.CANONICAL_CONFLICT,
            severity=Severity.WARNING,
            message=f"Canonical 冲突: 页面声明 {canonical} 但实际 URL 为 {actual}",
            details={"url": url, "canonical": canonical, "actual_url": actual},
        )

    @classmethod
    def canonical_missing(cls, url: str) -> "Issue":
        return cls(
            issue_type=IssueType.CANONICAL_MISSING,
            severity=Severity.INFO,
            message=f"页面缺少 canonical 标签: {url}",
            details={"url": url},
        )

    @classmethod
    def network_error(cls, url: str, error: str) -> "Issue":
        return cls(
            issue_type=IssueType.NETWORK_ERROR,
            severity=Severity.WARNING,
            message=f"网络错误 (非真实死链, 需人工确认): {url} - {error}",
            details={"url": url, "error": error, "needs_manual_review": True},
        )

    @classmethod
    def timeout(cls, url: str, timeout_seconds: float) -> "Issue":
        return cls(
            issue_type=IssueType.TIMEOUT,
            severity=Severity.WARNING,
            message=f"请求超时 ({timeout_seconds}s, 非真实死链, 需人工确认): {url}",
            details={"url": url, "timeout_seconds": timeout_seconds, "needs_manual_review": True},
        )

    @classmethod
    def ssl_error(cls, url: str, error: str) -> "Issue":
        return cls(
            issue_type=IssueType.SSL_ERROR,
            severity=Severity.WARNING,
            message=f"SSL 证书错误 (非真实死链, 需人工确认): {url} - {error}",
            details={"url": url, "error": error, "needs_manual_review": True},
        )

    @classmethod
    def dns_error(cls, url: str) -> "Issue":
        return cls(
            issue_type=IssueType.DNS_ERROR,
            severity=Severity.CRITICAL,
            message=f"DNS 解析失败 (可能是真实死链): {url}",
            details={"url": url},
        )

    @classmethod
    def server_error(cls, url: str, status_code: int) -> "Issue":
        return cls(
            issue_type=IssueType.SERVER_ERROR,
            severity=Severity.WARNING,
            message=f"服务器错误 {status_code}: {url}",
            details={"url": url, "status_code": status_code},
        )

    @classmethod
    def invalid_url(cls, url: str, reason: str) -> "Issue":
        return cls(
            issue_type=IssueType.INVALID_URL,
            severity=Severity.WARNING,
            message=f"无效 URL: {url} - {reason}",
            details={"url": url, "reason": reason},
        )


class CheckResult(BaseModel):
    url: str
    link_type: LinkType
    page_meta: Optional[PageMeta] = None
    issues: List[Issue] = Field(default_factory=list)
    checked_at: datetime = Field(default_factory=datetime.utcnow)
    is_whitelisted: bool = False
    depth: int = 0

    @property
    def is_ok(self) -> bool:
        return len([i for i in self.issues if i.severity in (Severity.CRITICAL, Severity.WARNING)]) == 0

    @property
    def needs_manual_review(self) -> bool:
        return any(i.details.get("needs_manual_review", False) for i in self.issues)


class FixSuggestion(BaseModel):
    action: str
    from_url: str
    to_url: Optional[str] = None
    reason: str
    confidence: float = Field(ge=0.0, le=1.0)
    affected_pages: List[str] = Field(default_factory=list)


class FixPlan(BaseModel):
    internal_links: List[FixSuggestion] = Field(default_factory=list)
    external_links: List[FixSuggestion] = Field(default_factory=list)
    images: List[FixSuggestion] = Field(default_factory=list)
    requires_confirmation: bool = True


class ScanReport(BaseModel):
    started_at: datetime
    finished_at: Optional[datetime] = None
    total_pages: int = 0
    total_links: int = 0
    pages_checked: int = 0
    links_checked: int = 0
    results: List[CheckResult] = Field(default_factory=list)
    fix_plan: FixPlan = Field(default_factory=FixPlan)
    config_summary: dict = Field(default_factory=dict)
    base_domain: Optional[str] = None

    def get_critical_issues(self) -> List[CheckResult]:
        return [r for r in self.results if any(i.severity == Severity.CRITICAL for i in r.issues)]

    def get_warning_issues(self) -> List[CheckResult]:
        return [r for r in self.results if any(i.severity == Severity.WARNING for i in r.issues) and r not in self.get_critical_issues()]

    def get_manual_review(self) -> List[CheckResult]:
        return [r for r in self.results if r.needs_manual_review]
