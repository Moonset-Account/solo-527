from __future__ import annotations

import re
import html
import difflib
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum

from loguru import logger
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.config import settings
from app.services.ai.llm_factory import LLMFactory, LLMUsage


class ChangeType(str, Enum):
    ADDED = "added"
    DELETED = "deleted"
    MODIFIED = "modified"
    UNCHANGED = "unchanged"


class ChangeSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


@dataclass
class DiffSegment:
    clause_id_old: Optional[int]
    clause_id_new: Optional[int]
    clause_title_old: Optional[str]
    clause_title_new: Optional[str]
    category_old: Optional[str]
    category_new: Optional[str]
    change_type: ChangeType
    text_old: str
    text_new: str
    similarity_score: float
    char_diffs: List[Tuple[int, int, str, str]] = field(default_factory=list)
    line_diffs: List[Tuple[str, List[str], List[str]]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["change_type"] = self.change_type.value
        return d


@dataclass
class ChangeImpact:
    affected_rights: List[str] = field(default_factory=list)
    affected_obligations: List[str] = field(default_factory=list)
    risk_assessment: str = ""
    suggested_action: str = ""
    affected_parties: List[str] = field(default_factory=list)
    legal_implications: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SemanticAnalysis:
    clause_id_old: Optional[int]
    clause_id_new: Optional[int]
    change_summary: str
    semantic_difference: str
    business_impact: ChangeImpact
    severity: ChangeSeverity
    confidence_score: float
    usage: Optional[LLMUsage] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["severity"] = self.severity.value
        d["business_impact"] = self.business_impact.to_dict()
        if self.usage:
            d["usage"] = self.usage.to_dict()
        return d


@dataclass
class DiffStatistics:
    total_clauses_old: int
    total_clauses_new: int
    clauses_added: int
    clauses_deleted: int
    clauses_modified: int
    clauses_unchanged: int
    total_chars_added: int
    total_chars_deleted: int
    overall_similarity: float
    critical_changes: int
    high_severity_changes: int
    medium_severity_changes: int
    low_severity_changes: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class DiffResult:
    document_id_old: int
    document_id_new: int
    title_old: str
    title_new: str
    segments: List[DiffSegment]
    statistics: DiffStatistics
    semantic_analyses: List[SemanticAnalysis] = field(default_factory=list)
    html_report: str = ""
    total_usage: Optional[LLMUsage] = None

    def to_dict(self) -> Dict[str, Any]:
        d = {
            "document_id_old": self.document_id_old,
            "document_id_new": self.document_id_new,
            "title_old": self.title_old,
            "title_new": self.title_new,
            "segments": [s.to_dict() for s in self.segments],
            "statistics": self.statistics.to_dict(),
            "semantic_analyses": [a.to_dict() for a in self.semantic_analyses],
            "html_report": self.html_report,
        }
        if self.total_usage:
            d["total_usage"] = self.total_usage.to_dict()
        return d


class ContractDiffComparator:
    """
    合同差异对比服务

    功能：
    - 基于difflib和rapidfuzz的条款级差异对比
    - 新增/删除/修改段落精确标注
    - LLM辅助的变更语义理解和影响评估
    - 输出HTML高亮diff报告
    """

    SEMANTIC_ANALYSIS_PROMPT: str = """你是一位资深的合同审查律师和商业风险评估专家。请分析以下合同条款的变更内容，进行语义层面的深度理解和影响评估。

原版本条款（版本A）：
条款ID: {clause_id_old}
条款标题: {clause_title_old}
条款类别: {category_old}
条款内容:
{text_old}

新版本条款（版本B）：
条款ID: {clause_id_new}
条款标题: {clause_title_new}
条款类别: {category_new}
条款内容:
{text_new}

变更类型: {change_type}
文本相似度得分: {similarity_score:.2f}

请基于专业法律和商业视角，进行深度分析，并严格按照以下JSON格式输出：

{{
  "change_summary": "一句话概述本次变更的核心内容（不超过50字）",
  "semantic_difference": "详细说明两个版本在语义上的核心差异，包括权利义务的变化、条件变化等（不超过200字）",
  "business_impact": {{
    "affected_rights": ["受影响的权利1", "受影响的权利2"],
    "affected_obligations": ["受影响的义务1", "受影响的义务2"],
    "risk_assessment": "风险评估说明：说明变更带来的潜在商业/法律风险（不超过150字）",
    "suggested_action": "建议行动：建议法务或业务方采取的应对措施（不超过150字）",
    "affected_parties": ["受影响的当事方1", "受影响的当事方2"],
    "legal_implications": ["法律含义1", "法律含义2"]
  }},
  "severity": "critical|high|medium|low|info",
  "confidence_score": 0.0到1.0之间的数字，表示分析的置信度
}}

变更严重程度判定标准：
- critical: 涉及核心权利义务根本性变化、金额/期限重大变更、合同性质改变
- high: 涉及重要条款变更，可能显著影响商业利益或法律风险
- medium: 涉及一般条款变更，有一定影响但非核心
- low: 措辞优化、格式调整等轻微变更
- info: 纯信息性变更，无实质影响
"""

    def __init__(
        self,
        *,
        llm_factory: Optional[LLMFactory] = None,
        similarity_threshold: float = 0.7,
        use_rapidfuzz: bool = True,
    ):
        self._llm_factory = llm_factory or LLMFactory()
        self._similarity_threshold = similarity_threshold
        self._use_rapidfuzz = use_rapidfuzz
        self._json_parser = JsonOutputParser()
        self._total_usage = LLMUsage()

    @property
    def total_usage(self) -> LLMUsage:
        return self._total_usage

    def reset_usage(self) -> None:
        self._total_usage = LLMUsage()

    def _compute_similarity(self, text1: str, text2: str) -> float:
        if not text1 or not text2:
            return 0.0
        if text1 == text2:
            return 1.0

        if self._use_rapidfuzz:
            try:
                from rapidfuzz import fuzz
                ratio = fuzz.ratio(text1, text2) / 100.0
                token_ratio = fuzz.token_set_ratio(text1, text2) / 100.0
                return max(ratio, token_ratio) * 0.7 + min(ratio, token_ratio) * 0.3
            except ImportError:
                logger.warning("rapidfuzz未安装，回退到difflib")

        return difflib.SequenceMatcher(None, text1, text2).ratio()

    def _match_clauses(
        self,
        clauses_old: List[Dict[str, Any]],
        clauses_new: List[Dict[str, Any]],
    ) -> List[Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]], float, ChangeType]]:
        matched_pairs: List[Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]], float, ChangeType]] = []
        old_matched: set = set()
        new_matched: set = set()

        old_by_id: Dict[int, Dict[str, Any]] = {}
        for c in clauses_old:
            cid = c.get("clause_id", c.get("id"))
            if cid is not None:
                old_by_id[int(cid)] = c

        new_by_id: Dict[int, Dict[str, Any]] = {}
        for c in clauses_new:
            cid = c.get("clause_id", c.get("id"))
            if cid is not None:
                new_by_id[int(cid)] = c

        for old_id, old_clause in old_by_id.items():
            if old_id in new_by_id:
                new_clause = new_by_id[old_id]
                old_text = old_clause.get("original_text", old_clause.get("text", ""))
                new_text = new_clause.get("original_text", new_clause.get("text", ""))
                similarity = self._compute_similarity(old_text, new_text)
                old_matched.add(old_id)
                new_matched.add(old_id)
                if similarity >= 0.999:
                    change_type = ChangeType.UNCHANGED
                else:
                    change_type = ChangeType.MODIFIED
                matched_pairs.append((old_clause, new_clause, similarity, change_type))

        unmatched_old = [c for c in clauses_old if int(c.get("clause_id", c.get("id", -1))) not in old_matched]
        unmatched_new = [c for c in clauses_new if int(c.get("clause_id", c.get("id", -1))) not in new_matched]

        old_index_map: Dict[int, int] = {}
        for i, oc in enumerate(unmatched_old):
            best_match_idx = -1
            best_similarity = 0.0
            old_text = oc.get("original_text", oc.get("text", ""))
            old_title = oc.get("clause_title", oc.get("title", ""))

            for j, nc in enumerate(unmatched_new):
                if j in old_index_map.values():
                    continue
                new_text = nc.get("original_text", nc.get("text", ""))
                new_title = nc.get("clause_title", nc.get("title", ""))

                text_sim = self._compute_similarity(old_text, new_text)
                title_sim = self._compute_similarity(old_title, new_title)
                combined_sim = text_sim * 0.7 + title_sim * 0.3

                if combined_sim > best_similarity:
                    best_similarity = combined_sim
                    best_match_idx = j

            if best_similarity >= self._similarity_threshold and best_match_idx >= 0:
                old_index_map[i] = best_match_idx
                new_clause = unmatched_new[best_match_idx]
                if best_similarity >= 0.999:
                    change_type = ChangeType.UNCHANGED
                else:
                    change_type = ChangeType.MODIFIED
                matched_pairs.append((oc, new_clause, best_similarity, change_type))

        for i, oc in enumerate(unmatched_old):
            if i not in old_index_map:
                matched_pairs.append((oc, None, 0.0, ChangeType.DELETED))

        matched_new_indices = set(old_index_map.values())
        for j, nc in enumerate(unmatched_new):
            if j not in matched_new_indices:
                matched_pairs.append((None, nc, 0.0, ChangeType.ADDED))

        def sort_key(pair):
            old, new, sim, ct = pair
            clause = old or new
            return clause.get("clause_index", clause.get("index", 0))

        matched_pairs.sort(key=sort_key)
        return matched_pairs

    def _compute_char_level_diffs(
        self,
        text_old: str,
        text_new: str,
    ) -> List[Tuple[int, int, str, str]]:
        char_diffs: List[Tuple[int, int, str, str]] = []
        matcher = difflib.SequenceMatcher(None, text_old, text_new)

        for opcode, i1, i2, j1, j2 in matcher.get_opcodes():
            if opcode == "equal":
                continue
            old_segment = text_old[i1:i2] if opcode in ("replace", "delete") else ""
            new_segment = text_new[j1:j2] if opcode in ("replace", "insert") else ""
            char_diffs.append((i1, j1, old_segment, new_segment))

        return char_diffs

    def _compute_line_level_diffs(
        self,
        text_old: str,
        text_new: str,
    ) -> List[Tuple[str, List[str], List[str]]]:
        lines_old = text_old.splitlines(keepends=True)
        lines_new = text_new.splitlines(keepends=True)

        line_diffs: List[Tuple[str, List[str], List[str]]] = []
        diff = difflib.ndiff(lines_old, lines_new)

        current_group: Optional[List[str]] = None
        for line in diff:
            code = line[:2]
            if code in ("- ", "+ ", "? "):
                if current_group is None:
                    current_group = []
                current_group.append(line)
            else:
                if current_group:
                    added = [l[2:] for l in current_group if l.startswith("+ ")]
                    deleted = [l[2:] for l in current_group if l.startswith("- ")]
                    if added or deleted:
                        change_code = "modified" if added and deleted else ("added" if added else "deleted")
                        line_diffs.append((change_code, deleted, added))
                    current_group = None

        if current_group:
            added = [l[2:] for l in current_group if l.startswith("+ ")]
            deleted = [l[2:] for l in current_group if l.startswith("- ")]
            if added or deleted:
                change_code = "modified" if added and deleted else ("added" if added else "deleted")
                line_diffs.append((change_code, deleted, added))

        return line_diffs

    def compare_clauses(
        self,
        clauses_old: List[Dict[str, Any]],
        clauses_new: List[Dict[str, Any]],
        *,
        document_id_old: int,
        document_id_new: int,
        title_old: str = "",
        title_new: str = "",
    ) -> DiffResult:
        """
        执行条款级差异对比

        Args:
            clauses_old: 旧版本条款列表
            clauses_new: 新版本条款列表
            document_id_old: 旧文档ID
            document_id_new: 新文档ID
            title_old: 旧文档标题
            title_new: 新文档标题

        Returns:
            DiffResult对比结果
        """
        matched_pairs = self._match_clauses(clauses_old, clauses_new)
        segments: List[DiffSegment] = []

        total_added_chars = 0
        total_deleted_chars = 0
        count_added = 0
        count_deleted = 0
        count_modified = 0
        count_unchanged = 0

        for old_clause, new_clause, similarity, change_type in matched_pairs:
            old_id = int(old_clause.get("clause_id", old_clause.get("id", 0))) if old_clause else None
            new_id = int(new_clause.get("clause_id", new_clause.get("id", 0))) if new_clause else None
            old_title = old_clause.get("clause_title", old_clause.get("title", "")) if old_clause else None
            new_title = new_clause.get("clause_title", new_clause.get("title", "")) if new_clause else None
            old_category = old_clause.get("category", "other") if old_clause else None
            new_category = new_clause.get("category", "other") if new_clause else None
            old_text = old_clause.get("original_text", old_clause.get("text", "")) if old_clause else ""
            new_text = new_clause.get("original_text", new_clause.get("text", "")) if new_clause else ""

            char_diffs = []
            line_diffs = []

            if change_type == ChangeType.MODIFIED:
                char_diffs = self._compute_char_level_diffs(old_text, new_text)
                line_diffs = self._compute_line_level_diffs(old_text, new_text)
                count_modified += 1
            elif change_type == ChangeType.ADDED:
                count_added += 1
            elif change_type == ChangeType.DELETED:
                count_deleted += 1
            else:
                count_unchanged += 1

            total_added_chars += len(new_text) - len(old_text) if change_type == ChangeType.MODIFIED else (
                len(new_text) if change_type == ChangeType.ADDED else 0
            )
            total_deleted_chars += len(old_text) - len(new_text) if change_type == ChangeType.MODIFIED else (
                len(old_text) if change_type == ChangeType.DELETED else 0
            )

            segments.append(DiffSegment(
                clause_id_old=old_id,
                clause_id_new=new_id,
                clause_title_old=old_title,
                clause_title_new=new_title,
                category_old=old_category,
                category_new=new_category,
                change_type=change_type,
                text_old=old_text,
                text_new=new_text,
                similarity_score=similarity,
                char_diffs=char_diffs,
                line_diffs=line_diffs,
            ))

        modified_similarities = [s.similarity_score for s in segments if s.change_type == ChangeType.MODIFIED]
        overall_similarity = 1.0
        if segments:
            weighted_sum = 0.0
            weighted_total = 0.0
            for s in segments:
                weight = max(len(s.text_old), len(s.text_new))
                if s.change_type == ChangeType.UNCHANGED:
                    weighted_sum += 1.0 * weight
                elif s.change_type == ChangeType.MODIFIED:
                    weighted_sum += s.similarity_score * weight
                weighted_total += weight
            if weighted_total > 0:
                overall_similarity = weighted_sum / weighted_total

        statistics = DiffStatistics(
            total_clauses_old=len(clauses_old),
            total_clauses_new=len(clauses_new),
            clauses_added=count_added,
            clauses_deleted=count_deleted,
            clauses_modified=count_modified,
            clauses_unchanged=count_unchanged,
            total_chars_added=max(0, total_added_chars),
            total_chars_deleted=max(0, total_deleted_chars),
            overall_similarity=overall_similarity,
            critical_changes=0,
            high_severity_changes=0,
            medium_severity_changes=0,
            low_severity_changes=0,
        )

        return DiffResult(
            document_id_old=document_id_old,
            document_id_new=document_id_new,
            title_old=title_old,
            title_new=title_new,
            segments=segments,
            statistics=statistics,
        )

    def analyze_semantic_change(
        self,
        segment: DiffSegment,
    ) -> SemanticAnalysis:
        """
        对单个差异段进行LLM辅助的语义分析和影响评估

        Args:
            segment: 差异段

        Returns:
            SemanticAnalysis分析结果
        """
        llm = self._llm_factory.get_chat_model(temperature=0.1)
        prompt = PromptTemplate(
            template=self.SEMANTIC_ANALYSIS_PROMPT,
            input_variables=[
                "clause_id_old", "clause_title_old", "category_old", "text_old",
                "clause_id_new", "clause_title_new", "category_new", "text_new",
                "change_type", "similarity_score",
            ],
        )
        chain = prompt | llm | self._json_parser

        try:
            messages = prompt.format_messages(
                clause_id_old=segment.clause_id_old or "N/A",
                clause_title_old=segment.clause_title_old or "N/A",
                category_old=segment.category_old or "N/A",
                text_old=segment.text_old or "(无内容)",
                clause_id_new=segment.clause_id_new or "N/A",
                clause_title_new=segment.clause_title_new or "N/A",
                category_new=segment.category_new or "N/A",
                text_new=segment.text_new or "(无内容)",
                change_type=segment.change_type.value,
                similarity_score=segment.similarity_score,
            )
            response, usage = self._llm_factory.chat_with_usage(messages)
            result = self._json_parser.parse(response.content)
            self._total_usage.add(usage)

            severity_str = result.get("severity", "info")
            try:
                severity = ChangeSeverity(severity_str)
            except ValueError:
                severity = ChangeSeverity.INFO

            impact_data = result.get("business_impact", {})
            impact = ChangeImpact(
                affected_rights=impact_data.get("affected_rights", []),
                affected_obligations=impact_data.get("affected_obligations", []),
                risk_assessment=impact_data.get("risk_assessment", ""),
                suggested_action=impact_data.get("suggested_action", ""),
                affected_parties=impact_data.get("affected_parties", []),
                legal_implications=impact_data.get("legal_implications", []),
            )

            return SemanticAnalysis(
                clause_id_old=segment.clause_id_old,
                clause_id_new=segment.clause_id_new,
                change_summary=result.get("change_summary", ""),
                semantic_difference=result.get("semantic_difference", ""),
                business_impact=impact,
                severity=severity,
                confidence_score=float(result.get("confidence_score", 0.5)),
                usage=usage,
            )
        except Exception as e:
            logger.error(f"语义分析失败 (old={segment.clause_id_old}, new={segment.clause_id_new}): {e}")
            return SemanticAnalysis(
                clause_id_old=segment.clause_id_old,
                clause_id_new=segment.clause_id_new,
                change_summary="语义分析失败",
                semantic_difference=str(e),
                business_impact=ChangeImpact(),
                severity=ChangeSeverity.INFO,
                confidence_score=0.0,
            )

    def analyze_all_changes(
        self,
        diff_result: DiffResult,
        *,
        only_material_changes: bool = True,
    ) -> DiffResult:
        """
        对所有变更段进行语义分析

        Args:
            diff_result: 初始对比结果
            only_material_changes: 是否只分析实质性变更（排除unchanged）

        Returns:
            更新后的DiffResult，包含语义分析和统计信息
        """
        self.reset_usage()
        analyses: List[SemanticAnalysis] = []

        for segment in diff_result.segments:
            if only_material_changes and segment.change_type == ChangeType.UNCHANGED:
                continue
            analysis = self.analyze_semantic_change(segment)
            analyses.append(analysis)

        diff_result.semantic_analyses = analyses
        diff_result.total_usage = LLMUsage(
            tokens_input=self._total_usage.tokens_input,
            tokens_output=self._total_usage.tokens_output,
            cost_usd=self._total_usage.cost_usd,
            latency_ms=self._total_usage.latency_ms,
            calls=self._total_usage.calls,
        )

        diff_result.statistics.critical_changes = sum(1 for a in analyses if a.severity == ChangeSeverity.CRITICAL)
        diff_result.statistics.high_severity_changes = sum(1 for a in analyses if a.severity == ChangeSeverity.HIGH)
        diff_result.statistics.medium_severity_changes = sum(1 for a in analyses if a.severity == ChangeSeverity.MEDIUM)
        diff_result.statistics.low_severity_changes = sum(1 for a in analyses if a.severity == ChangeSeverity.LOW)

        return diff_result

    def generate_html_report(
        self,
        diff_result: DiffResult,
        *,
        include_semantic: bool = True,
    ) -> str:
        """
        生成HTML高亮差异报告

        Args:
            diff_result: 对比结果
            include_semantic: 是否包含语义分析

        Returns:
            HTML报告字符串
        """
        severity_colors = {
            ChangeSeverity.CRITICAL: ("#7f1d1d", "#fee2e2"),
            ChangeSeverity.HIGH: ("#92400e", "#ffedd5"),
            ChangeSeverity.MEDIUM: ("#854d0e", "#fef9c3"),
            ChangeSeverity.LOW: ("#166534", "#dcfce7"),
            ChangeSeverity.INFO: ("#1e40af", "#dbeafe"),
        }

        def highlight_diff(text_old: str, text_new: str) -> Tuple[str, str]:
            html_old_parts = []
            html_new_parts = []
            matcher = difflib.SequenceMatcher(None, text_old, text_new)

            for opcode, i1, i2, j1, j2 in matcher.get_opcodes():
                if opcode == "equal":
                    seg_old = html.escape(text_old[i1:i2])
                    seg_new = html.escape(text_new[j1:j2])
                    html_old_parts.append(seg_old)
                    html_new_parts.append(seg_new)
                elif opcode == "replace":
                    html_old_parts.append(
                        f'<span style="background-color:#fecaca;text-decoration:line-through;color:#991b1b;">{html.escape(text_old[i1:i2])}</span>'
                    )
                    html_new_parts.append(
                        f'<span style="background-color:#bbf7d0;color:#166534;font-weight:500;">{html.escape(text_new[j1:j2])}</span>'
                    )
                elif opcode == "delete":
                    html_old_parts.append(
                        f'<span style="background-color:#fecaca;text-decoration:line-through;color:#991b1b;">{html.escape(text_old[i1:i2])}</span>'
                    )
                elif opcode == "insert":
                    html_new_parts.append(
                        f'<span style="background-color:#bbf7d0;color:#166534;font-weight:500;">{html.escape(text_new[j1:j2])}</span>'
                    )

            return "".join(html_old_parts), "".join(html_new_parts)

        analysis_map: Dict[str, SemanticAnalysis] = {}
        for analysis in diff_result.semantic_analyses:
            key = f"{analysis.clause_id_old}_{analysis.clause_id_new}"
            analysis_map[key] = analysis

        html_parts = [
            "<!DOCTYPE html>",
            '<html lang="zh-CN">',
            "<head>",
            '<meta charset="UTF-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            "<title>合同差异对比报告</title>",
            "<style>",
            "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; margin: 0; padding: 24px; background: #f8fafc; color: #1e293b; }",
            ".container { max-width: 1200px; margin: 0 auto; }",
            "h1 { color: #0f172a; margin-bottom: 8px; font-size: 28px; }",
            ".subtitle { color: #64748b; margin-bottom: 24px; }",
            ".stats-card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }",
            ".stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; }",
            ".stat-item { text-align: center; padding: 12px; border-radius: 8px; }",
            ".stat-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }",
            ".stat-value { font-size: 24px; font-weight: 700; }",
            ".stat-added { background: #f0fdf4; } .stat-added .stat-value { color: #16a34a; }",
            ".stat-deleted { background: #fef2f2; } .stat-deleted .stat-value { color: #dc2626; }",
            ".stat-modified { background: #fffbeb; } .stat-modified .stat-value { color: #d97706; }",
            ".stat-unchanged { background: #f1f5f9; } .stat-unchanged .stat-value { color: #475569; }",
            ".stat-similarity { background: #eff6ff; } .stat-similarity .stat-value { color: #2563eb; }",
            ".severity-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }",
            ".segment-card { background: white; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }",
            ".segment-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }",
            ".segment-title { font-weight: 600; font-size: 16px; }",
            ".change-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-left: 8px; }",
            ".change-added { background: #dcfce7; color: #166534; }",
            ".change-deleted { background: #fee2e2; color: #991b1b; }",
            ".change-modified { background: #fef3c7; color: #92400e; }",
            ".change-unchanged { background: #f1f5f9; color: #475569; }",
            ".segment-body { padding: 20px; }",
            ".diff-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }",
            ".diff-col h4 { font-size: 13px; color: #64748b; margin-bottom: 8px; }",
            ".diff-text { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; border: 1px solid #e2e8f0; }",
            ".semantic-section { margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0; }",
            ".semantic-row { margin-bottom: 10px; }",
            ".semantic-label { font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 4px; }",
            ".semantic-value { font-size: 14px; line-height: 1.6; }",
            ".tag { display: inline-block; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 6px; margin-bottom: 4px; }",
            "@media (max-width: 768px) { .diff-columns { grid-template-columns: 1fr; } }",
            "</style>",
            "</head>",
            "<body>",
            '<div class="container">',
        ]

        html_parts.append("<h1>📋 合同差异对比报告</h1>")
        html_parts.append(
            f'<div class="subtitle">{html.escape(diff_result.title_old)} → {html.escape(diff_result.title_new)}</div>'
        )

        stats = diff_result.statistics
        html_parts.append('<div class="stats-card">')
        html_parts.append('<div class="stats-grid">')
        html_parts.append(
            f'<div class="stat-item stat-added"><div class="stat-label">新增条款</div><div class="stat-value">{stats.clauses_added}</div></div>'
        )
        html_parts.append(
            f'<div class="stat-item stat-deleted"><div class="stat-label">删除条款</div><div class="stat-value">{stats.clauses_deleted}</div></div>'
        )
        html_parts.append(
            f'<div class="stat-item stat-modified"><div class="stat-label">修改条款</div><div class="stat-value">{stats.clauses_modified}</div></div>'
        )
        html_parts.append(
            f'<div class="stat-item stat-unchanged"><div class="stat-label">未变条款</div><div class="stat-value">{stats.clauses_unchanged}</div></div>'
        )
        html_parts.append(
            f'<div class="stat-item stat-similarity"><div class="stat-label">整体相似度</div><div class="stat-value">{stats.overall_similarity*100:.1f}%</div></div>'
        )
        if include_semantic and diff_result.semantic_analyses:
            html_parts.append(
                f'<div class="stat-item" style="background:#fee2e2;"><div class="stat-label">严重变更</div><div class="stat-value" style="color:#991b1b;">{stats.critical_changes}</div></div>'
            )
            html_parts.append(
                f'<div class="stat-item" style="background:#ffedd5;"><div class="stat-label">高风险</div><div class="stat-value" style="color:#c2410c;">{stats.high_severity_changes}</div></div>'
            )
        html_parts.append("</div></div>")

        for segment in diff_result.segments:
            key = f"{segment.clause_id_old}_{segment.clause_id_new}"
            analysis = analysis_map.get(key) if include_semantic else None

            change_class_map = {
                ChangeType.ADDED: "change-added",
                ChangeType.DELETED: "change-deleted",
                ChangeType.MODIFIED: "change-modified",
                ChangeType.UNCHANGED: "change-unchanged",
            }
            change_label_map = {
                ChangeType.ADDED: "新增",
                ChangeType.DELETED: "删除",
                ChangeType.MODIFIED: "修改",
                ChangeType.UNCHANGED: "未变",
            }

            title_display = segment.clause_title_new or segment.clause_title_old or "未命名条款"
            id_display = (
                f"#{segment.clause_id_new}"
                if segment.clause_id_new
                else f"#{segment.clause_id_old}"
            )

            html_parts.append('<div class="segment-card">')
            html_parts.append('<div class="segment-header">')
            html_parts.append(
                f'<div class="segment-title">{html.escape(id_display)} {html.escape(title_display)}'
                f'<span class="change-badge {change_class_map[segment.change_type]}">{change_label_map[segment.change_type]}</span>'
                f'</div>'
            )

            if analysis:
                fg, bg = severity_colors.get(analysis.severity, severity_colors[ChangeSeverity.INFO])
                severity_label_map = {
                    ChangeSeverity.CRITICAL: "严重",
                    ChangeSeverity.HIGH: "高风险",
                    ChangeSeverity.MEDIUM: "中等",
                    ChangeSeverity.LOW: "轻微",
                    ChangeSeverity.INFO: "信息",
                }
                html_parts.append(
                    f'<span class="severity-badge" style="color:{fg};background:{bg};">{severity_label_map[analysis.severity]}</span>'
                )
            html_parts.append("</div>")

            html_parts.append('<div class="segment-body">')

            if segment.change_type == ChangeType.ADDED:
                html_parts.append('<div class="diff-columns">')
                html_parts.append('<div class="diff-col"><h4>旧版本</h4><div class="diff-text" style="color:#94a3b8;font-style:italic;">(无此条款)</div></div>')
                html_parts.append(
                    f'<div class="diff-col"><h4>新版本</h4><div class="diff-text">{html.escape(segment.text_new)}</div></div>'
                )
                html_parts.append("</div>")
            elif segment.change_type == ChangeType.DELETED:
                html_parts.append('<div class="diff-columns">')
                html_parts.append(
                    f'<div class="diff-col"><h4>旧版本</h4><div class="diff-text">{html.escape(segment.text_old)}</div></div>'
                )
                html_parts.append('<div class="diff-col"><h4>新版本</h4><div class="diff-text" style="color:#94a3b8;font-style:italic;">(已删除)</div></div>')
                html_parts.append("</div>")
            else:
                hl_old, hl_new = highlight_diff(segment.text_old, segment.text_new)
                html_parts.append('<div class="diff-columns">')
                html_parts.append(
                    f'<div class="diff-col"><h4>旧版本 (相似度: {segment.similarity_score*100:.1f}%)</h4><div class="diff-text">{hl_old}</div></div>'
                )
                html_parts.append(
                    f'<div class="diff-col"><h4>新版本</h4><div class="diff-text">{hl_new}</div></div>'
                )
                html_parts.append("</div>")

            if analysis:
                html_parts.append('<div class="semantic-section">')
                html_parts.append(
                    f'<div class="semantic-row"><div class="semantic-label">📝 变更摘要</div><div class="semantic-value">{html.escape(analysis.change_summary)}</div></div>'
                )
                html_parts.append(
                    f'<div class="semantic-row"><div class="semantic-label">🔍 语义差异</div><div class="semantic-value">{html.escape(analysis.semantic_difference)}</div></div>'
                )
                html_parts.append(
                    f'<div class="semantic-row"><div class="semantic-label">⚠️ 风险评估</div><div class="semantic-value">{html.escape(analysis.business_impact.risk_assessment)}</div></div>'
                )
                html_parts.append(
                    f'<div class="semantic-row"><div class="semantic-label">💡 建议行动</div><div class="semantic-value">{html.escape(analysis.business_impact.suggested_action)}</div></div>'
                )
                if analysis.business_impact.affected_rights:
                    rights_tags = "".join(f'<span class="tag">{html.escape(r)}</span>' for r in analysis.business_impact.affected_rights)
                    html_parts.append(
                        f'<div class="semantic-row"><div class="semantic-label">⚖️ 影响权利</div><div class="semantic-value">{rights_tags}</div></div>'
                    )
                if analysis.business_impact.affected_obligations:
                    obligations_tags = "".join(f'<span class="tag">{html.escape(o)}</span>' for o in analysis.business_impact.affected_obligations)
                    html_parts.append(
                        f'<div class="semantic-row"><div class="semantic-label">📋 影响义务</div><div class="semantic-value">{obligations_tags}</div></div>'
                    )
                html_parts.append("</div>")

            html_parts.append("</div></div>")

        html_parts.append("</div></body></html>")
        html_report = "\n".join(html_parts)
        diff_result.html_report = html_report
        return html_report

    def full_compare_and_analyze(
        self,
        clauses_old: List[Dict[str, Any]],
        clauses_new: List[Dict[str, Any]],
        *,
        document_id_old: int,
        document_id_new: int,
        title_old: str = "",
        title_new: str = "",
        include_semantic: bool = True,
        generate_html: bool = True,
    ) -> DiffResult:
        """
        执行完整的对比分析流程（对比+语义分析+HTML报告）

        Args:
            clauses_old: 旧版本条款列表
            clauses_new: 新版本条款列表
            document_id_old: 旧文档ID
            document_id_new: 新文档ID
            title_old: 旧文档标题
            title_new: 新文档标题
            include_semantic: 是否进行语义分析
            generate_html: 是否生成HTML报告

        Returns:
            DiffResult完整结果
        """
        diff_result = self.compare_clauses(
            clauses_old=clauses_old,
            clauses_new=clauses_new,
            document_id_old=document_id_old,
            document_id_new=document_id_new,
            title_old=title_old,
            title_new=title_new,
        )

        if include_semantic:
            diff_result = self.analyze_all_changes(diff_result, only_material_changes=True)

        if generate_html:
            self.generate_html_report(diff_result, include_semantic=include_semantic)

        return diff_result


def get_contract_diff_comparator() -> ContractDiffComparator:
    """获取合同差异对比服务实例"""
    return ContractDiffComparator()
