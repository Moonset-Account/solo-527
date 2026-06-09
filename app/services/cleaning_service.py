from __future__ import annotations

import hashlib
import re
from typing import Tuple, List, Dict, Any, Optional
from dataclasses import dataclass, field


QUALITY_ISSUES = {
    "empty_content": "内容为空或过短",
    "low_information_density": "信息密度低，包含大量占位或重复文本",
    "template_noise": "包含模板占位符或未填充内容",
    "formatting_corruption": "格式损坏或乱码",
    "too_short": "文档长度不足，无法提供有效语义",
    "duplicate_content": "与已有内容重复",
    "contains_secrets": "疑似包含敏感信息（密钥、密码等）",
    "broken_links": "包含损坏的引用链接",
}


SECRET_PATTERNS = [
    re.compile(r'(api[_-]?key|secret|password|token)\s*[=:]\s*[A-Za-z0-9_\-]{8,}', re.IGNORECASE),
    re.compile(r'(sk-|pk-|AKIA|ghp_|gho_|glpat-)[A-Za-z0-9_\-]{10,}'),
    re.compile(r'(-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----)'),
]


PLACEHOLDER_PATTERNS = [
    re.compile(r'\{\{.*?\}\}'),
    re.compile(r'<\?php.*?\?>'),
    re.compile(r'TODO|FIXME|XXX|HACK'),
    re.compile(r'lorem ipsum', re.IGNORECASE),
    re.compile(r'^(placeholder|example|sample|test)$', re.IGNORECASE),
]


URL_PATTERN = re.compile(r'https?://[^\s)]+')


@dataclass
class CleaningResult:
    cleaned_content: str
    score: float
    issues: List[str] = field(default_factory=list)
    notes: str = ""
    should_reject: bool = False


class DataCleaningService:
    def __init__(self):
        self.min_content_length = 20
        self.max_content_length = 500000

    @staticmethod
    def compute_hash(content: str) -> str:
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    def clean_text(self, text: str) -> str:
        if not text:
            return ""
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = text.strip()
        return text

    def _detect_quality_issues(self, content: str) -> List[str]:
        issues = []
        if not content or len(content) < self.min_content_length:
            issues.append("too_short")
        for name, pattern in [
            ("template_noise", PLACEHOLDER_PATTERNS),
        ]:
            for p in pattern:
                if p.search(content):
                    issues.append(name)
                    break
        for p in SECRET_PATTERNS:
            if p.search(content):
                issues.append("contains_secrets")
                break
        non_whitespace = re.sub(r'\s+', '', content)
        if len(content) > 200:
            density = len(set(non_whitespace)) / max(len(non_whitespace), 1)
            if density < 0.05:
                issues.append("low_information_density")
        return issues

    def _sanitize_content(self, content: str, issues: List[str]) -> str:
        if "contains_secrets" in issues:
            for p in SECRET_PATTERNS:
                content = p.sub('[REDACTED]', content)
        return content

    def _compute_score(self, content: str, issues: List[str]) -> float:
        if not content:
            return 0.0
        base = 1.0
        for issue in issues:
            if issue == "too_short":
                base -= 0.6
            elif issue == "contains_secrets":
                base -= 0.1
            elif issue == "template_noise":
                base -= 0.25
            elif issue == "low_information_density":
                base -= 0.3
            else:
                base -= 0.1
        length_ratio = min(len(content) / 500.0, 1.0)
        base = base * (0.5 + 0.5 * length_ratio)
        return max(0.0, min(1.0, base))

    def clean_document(self, content: str,
                       existing_hashes: Optional[set] = None) -> CleaningResult:
        cleaned = self.clean_text(content)
        if not cleaned:
            return CleaningResult(
                cleaned_content="",
                score=0.0,
                issues=["empty_content"],
                notes="内容为空",
                should_reject=True,
            )
        issues = self._detect_quality_issues(cleaned)
        content_hash = self.compute_hash(cleaned)
        if existing_hashes and content_hash in existing_hashes:
            issues.append("duplicate_content")
        cleaned = self._sanitize_content(cleaned, issues)
        score = self._compute_score(cleaned, issues)
        should_reject = (
            score < 0.2
            or "empty_content" in issues
            or "too_short" in issues
        )
        notes_parts = [QUALITY_ISSUES.get(i, i) for i in issues]
        return CleaningResult(
            cleaned_content=cleaned,
            score=score,
            issues=issues,
            notes="; ".join(notes_parts),
            should_reject=should_reject,
        )

    def batch_clean(self, contents: List[str],
                    existing_hashes: Optional[set] = None) -> List[CleaningResult]:
        return [self.clean_document(c, existing_hashes) for c in contents]
