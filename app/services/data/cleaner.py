import re
import logging
from typing import List, Optional, Dict, Any, Tuple, Callable
from dataclasses import dataclass, field
from pathlib import Path
from enum import Enum
from datetime import datetime

from loguru import logger


class DataQualityIssue(str, Enum):
    GARBAGE_CHARS = "garbage_chars"
    ENCODING_ERROR = "encoding_error"
    DUPLICATE_TEXT = "duplicate_text"
    INCOMPLETE_SENTENCE = "incomplete_sentence"
    TOO_SHORT = "too_short"
    TOO_LONG = "too_long"
    MISSING_PUNCTUATION = "missing_punctuation"
    NON_TEXT_CONTENT = "non_text_content"
    INCONSISTENT_WHITESPACE = "inconsistent_whitespace"
    HEADER_FOOTER = "header_footer"
    PAGE_NUMBER = "page_number"
    WATERMARK = "watermark"
    LOW_CONTRAST_TEXT = "low_contrast_text"


class CleanAction(str, Enum):
    REMOVE = "remove"
    REPLACE = "replace"
    NORMALIZE = "normalize"
    FLAG = "flag"
    SPLIT = "split"
    MERGE = "merge"


@dataclass
class QualityIssue:
    type: DataQualityIssue
    severity: int
    message: str
    position: Optional[Tuple[int, int]] = None
    original_text: Optional[str] = None
    suggested_fix: Optional[str] = None
    action: Optional[CleanAction] = None
    applied: bool = False


@dataclass
class CleanResult:
    original_text: str
    cleaned_text: str
    issues: List[QualityIssue] = field(default_factory=list)
    quality_score: float = 1.0
    is_usable: bool = True
    metrics: Dict[str, Any] = field(default_factory=dict)
    applied_rules: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "quality_score": self.quality_score,
            "is_usable": self.is_usable,
            "issues_count": len(self.issues),
            "issues": [
                {
                    "type": i.type.value,
                    "severity": i.severity,
                    "message": i.message,
                    "position": i.position,
                    "action": i.action.value if i.action else None,
                    "applied": i.applied,
                }
                for i in self.issues
            ],
            "metrics": self.metrics,
            "applied_rules": self.applied_rules,
        }


class DataCleaner:
    """
    合同数据清洗器
    功能：文本规范化、OCR错误修复、质量检测、垃圾字符移除
    输出：清洗后的文本 + 质量评分 + 问题报告
    """

    GARBAGE_PATTERNS = [
        (re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]"), "", DataQualityIssue.GARBAGE_CHARS),
        (re.compile(r"\ufffd+"), "", DataQualityIssue.ENCODING_ERROR),
        (re.compile(r"[?]{3,}"), "", DataQualityIssue.ENCODING_ERROR),
        (re.compile(r"_{3,}"), "", DataQualityIssue.GARBAGE_CHARS),
    ]

    HEADER_FOOTER_PATTERNS = [
        re.compile(r"^\s*第\s*\d+\s*页\s*[\/共]*\s*\d*\s*页?\s*$", re.MULTILINE),
        re.compile(r"^\s*Page\s*\d+\s*[\/of]*\s*\d*\s*$", re.MULTILINE | re.IGNORECASE),
        re.compile(r"^\s*-\s*\d+\s*-\s*$", re.MULTILINE),
        re.compile(r"^\s*Confidential|保密|机密|绝密\s*$", re.MULTILINE | re.IGNORECASE),
        re.compile(r"^\s*\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日号]?\s*$", re.MULTILINE),
    ]

    WATERMARK_PATTERNS = [
        re.compile(r"仅供参考", re.IGNORECASE),
        re.compile(r"样稿|样本|示例", re.IGNORECASE),
        re.compile(r"DRAFT|草稿", re.IGNORECASE),
    ]

    WHITESPACE_PATTERNS = [
        (re.compile(r"[ \t]+\n"), "\n", DataQualityIssue.INCONSISTENT_WHITESPACE),
        (re.compile(r"\n{4,}"), "\n\n\n", DataQualityIssue.INCONSISTENT_WHITESPACE),
        (re.compile(r"[ \t]{2,}"), " ", DataQualityIssue.INCONSISTENT_WHITESPACE),
    ]

    PUNCTUATION_FIXES = [
        (re.compile(r"([\u4e00-\u9fff])([.,!?])"), lambda m: f"{m.group(1)}{'。' if m.group(2) == '.' else '，' if m.group(2) == ',' else '！' if m.group(2) == '!' else '？'}", DataQualityIssue.MISSING_PUNCTUATION),
    ]

    def __init__(
        self,
        min_text_length: int = 20,
        max_text_length: int = 50000,
        quality_threshold: float = 0.3,
        custom_rules: Optional[List[Callable]] = None,
    ):
        self.min_text_length = min_text_length
        self.max_text_length = max_text_length
        self.quality_threshold = quality_threshold
        self.custom_rules = custom_rules or []

    def clean_text(self, text: str) -> CleanResult:
        if text is None:
            return CleanResult(
                original_text="",
                cleaned_text="",
                issues=[QualityIssue(
                    type=DataQualityIssue.TOO_SHORT,
                    severity=10,
                    message="输入文本为空",
                    action=CleanAction.REMOVE,
                )],
                quality_score=0.0,
                is_usable=False,
            )

        result = CleanResult(
            original_text=text,
            cleaned_text=text,
            metrics={
                "original_length": len(text),
                "original_chars": len(set(text)),
            },
        )

        cleaned = text
        total_penalty = 0.0

        for pattern, replacement, issue_type in self.GARBAGE_PATTERNS:
            matches = list(pattern.finditer(cleaned))
            if matches:
                for m in matches:
                    issue = QualityIssue(
                        type=issue_type,
                        severity=3 if issue_type == DataQualityIssue.GARBAGE_CHARS else 5,
                        message=f"检测到{issue_type.value}: {repr(m.group()[:50])}",
                        position=(m.start(), m.end()),
                        original_text=m.group(),
                        suggested_fix=replacement,
                        action=CleanAction.REMOVE,
                        applied=True,
                    )
                    result.issues.append(issue)
                    total_penalty += issue.severity * 0.01
                cleaned = pattern.sub(replacement, cleaned)
                result.applied_rules.append(f"remove_{issue_type.value}")

        for pattern in self.HEADER_FOOTER_PATTERNS:
            matches = list(pattern.finditer(cleaned))
            if matches:
                for m in matches:
                    issue = QualityIssue(
                        type=DataQualityIssue.HEADER_FOOTER,
                        severity=2,
                        message=f"检测到页眉页脚: {repr(m.group()[:50])}",
                        position=(m.start(), m.end()),
                        original_text=m.group(),
                        suggested_fix="",
                        action=CleanAction.REMOVE,
                        applied=True,
                    )
                    result.issues.append(issue)
                    total_penalty += 0.02
                cleaned = pattern.sub("", cleaned)
                result.applied_rules.append("remove_header_footer")

        for pattern in self.WATERMARK_PATTERNS:
            matches = list(pattern.finditer(cleaned))
            if matches:
                for m in matches:
                    issue = QualityIssue(
                        type=DataQualityIssue.WATERMARK,
                        severity=2,
                        message=f"检测到水印文字: {repr(m.group()[:50])}",
                        position=(m.start(), m.end()),
                        original_text=m.group(),
                        action=CleanAction.FLAG,
                        applied=False,
                    )
                    result.issues.append(issue)
                    total_penalty += 0.03

        for pattern, replacement, issue_type in self.WHITESPACE_PATTERNS:
            matches = list(pattern.finditer(cleaned))
            if matches:
                cleaned = pattern.sub(replacement, cleaned)
                result.applied_rules.append(f"normalize_{issue_type.value}")

        cleaned = cleaned.strip()

        for pattern, replacement_fn, issue_type in self.PUNCTUATION_FIXES:
            matches = list(pattern.finditer(cleaned))
            if matches:
                for m in matches:
                    issue = QualityIssue(
                        type=issue_type,
                        severity=1,
                        message=f"标点不规范: {repr(m.group())}",
                        position=(m.start(), m.end()),
                        original_text=m.group(),
                        suggested_fix=replacement_fn(m),
                        action=CleanAction.REPLACE,
                        applied=True,
                    )
                    result.issues.append(issue)
                    total_penalty += 0.005
                cleaned = pattern.sub(replacement_fn, cleaned)
                result.applied_rules.append(f"fix_{issue_type.value}")

        for rule_fn in self.custom_rules:
            try:
                cleaned, rule_issues = rule_fn(cleaned)
                result.issues.extend(rule_issues)
                result.applied_rules.append(rule_fn.__name__)
            except Exception as e:
                logger.warning(f"自定义清洗规则执行失败: {e}")

        if len(cleaned) < self.min_text_length:
            issue = QualityIssue(
                type=DataQualityIssue.TOO_SHORT,
                severity=8,
                message=f"文本过短: {len(cleaned)} < {self.min_text_length}",
                action=CleanAction.FLAG,
            )
            result.issues.append(issue)
            total_penalty += 0.2
            result.is_usable = False

        if len(cleaned) > self.max_text_length:
            issue = QualityIssue(
                type=DataQualityIssue.TOO_LONG,
                severity=4,
                message=f"文本过长: {len(cleaned)} > {self.max_text_length}",
                action=CleanAction.SPLIT,
                applied=False,
            )
            result.issues.append(issue)
            total_penalty += 0.05

        sentence_count = len(re.findall(r"[。.!?！？;；]", cleaned))
        if len(cleaned) > 500 and sentence_count < max(1, len(cleaned) // 200):
            issue = QualityIssue(
                type=DataQualityIssue.MISSING_PUNCTUATION,
                severity=5,
                message=f"句子标点不足: {sentence_count}句 / {len(cleaned)}字符",
                action=CleanAction.FLAG,
            )
            result.issues.append(issue)
            total_penalty += 0.1

        dup_pattern = re.compile(r"(.{10,})\1{2,}")
        dup_matches = list(dup_pattern.finditer(cleaned))
        if dup_matches:
            for m in dup_matches:
                issue = QualityIssue(
                    type=DataQualityIssue.DUPLICATE_TEXT,
                    severity=4,
                    message=f"重复文本: {repr(m.group()[:50])}",
                    position=(m.start(), m.end()),
                    action=CleanAction.MERGE,
                    applied=False,
                )
                result.issues.append(issue)
                total_penalty += 0.08

        result.quality_score = max(0.0, min(1.0, 1.0 - total_penalty))
        result.is_usable = result.is_usable and result.quality_score >= self.quality_threshold
        result.cleaned_text = cleaned
        result.metrics.update({
            "cleaned_length": len(cleaned),
            "length_reduction": max(0, len(text) - len(cleaned)),
            "sentence_count": sentence_count,
            "clean_chars": len(set(cleaned)),
            "issues_by_severity": {
                "critical": sum(1 for i in result.issues if i.severity >= 8),
                "high": sum(1 for i in result.issues if 5 <= i.severity < 8),
                "medium": sum(1 for i in result.issues if 3 <= i.severity < 5),
                "low": sum(1 for i in result.issues if i.severity < 3),
            },
        })

        return result

    def clean_clause_batch(self, clauses: List[Dict[str, Any]]) -> List[CleanResult]:
        results = []
        for clause in clauses:
            text = clause.get("text", "")
            result = self.clean_text(text)
            results.append(result)
        return results

    def batch_dedup(self, texts: List[str], threshold: float = 0.95) -> Tuple[List[str], List[int]]:
        from rapidfuzz import fuzz
        unique_texts = []
        removed_indices = []

        for idx, text in enumerate(texts):
            is_dup = False
            for existing in unique_texts:
                if fuzz.ratio(text, existing) >= threshold * 100:
                    is_dup = True
                    break
            if is_dup:
                removed_indices.append(idx)
            else:
                unique_texts.append(texts)

        return unique_texts, removed_indices
