from __future__ import annotations

import json
import re
from typing import List, Optional, Dict, Any, Tuple
from dataclasses import dataclass, field, asdict

from loguru import logger
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain.chains.summarize import load_summarize_chain
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.services.ai.llm_factory import LLMFactory, LLMUsage


@dataclass
class KeyParty:
    name: str
    role: str
    source_clause_id: Optional[int] = None
    source_clause_ref: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class KeyDate:
    description: str
    date_value: str
    source_clause_id: Optional[int] = None
    source_clause_ref: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class KeyAmount:
    description: str
    amount_value: float
    currency: str = "CNY"
    source_clause_id: Optional[int] = None
    source_clause_ref: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class KeyObligation:
    party: str
    obligation_content: str
    deadline: Optional[str] = None
    penalty: Optional[str] = None
    source_clause_id: Optional[int] = None
    source_clause_ref: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class KeyPoint:
    content: str
    category: str
    importance: int = 5
    source_clause_id: Optional[int] = None
    source_clause_ref: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ClauseSummary:
    clause_id: int
    clause_title: str
    clause_category: str
    extractive_summary: str
    abstractive_summary: str
    combined_summary: str
    source_ref: str
    usage: Optional[LLMUsage] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        if self.usage:
            d["usage"] = self.usage.to_dict()
        return d


@dataclass
class SummaryResult:
    document_id: int
    full_summary: str
    key_points: List[KeyPoint] = field(default_factory=list)
    key_parties: List[KeyParty] = field(default_factory=list)
    key_dates: List[KeyDate] = field(default_factory=list)
    key_amounts: List[KeyAmount] = field(default_factory=list)
    key_obligations: List[KeyObligation] = field(default_factory=list)
    clause_summaries: List[ClauseSummary] = field(default_factory=list)
    total_tokens: int = 0
    total_latency_ms: float = 0.0
    total_cost_usd: float = 0.0
    model_version: str = ""
    prompt_version: str = "v1.0"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.document_id,
            "full_summary": self.full_summary,
            "key_points": [kp.to_dict() for kp in self.key_points],
            "key_parties": [kp.to_dict() for kp in self.key_parties],
            "key_dates": [kd.to_dict() for kd in self.key_dates],
            "key_amounts": [ka.to_dict() for ka in self.key_amounts],
            "key_obligations": [ko.to_dict() for ko in self.key_obligations],
            "clause_summaries": [cs.to_dict() for cs in self.clause_summaries],
            "total_tokens": self.total_tokens,
            "total_latency_ms": round(self.total_latency_ms, 2),
            "total_cost_usd": round(self.total_cost_usd, 6),
            "model_version": self.model_version,
            "prompt_version": self.prompt_version,
        }


class ContractSummarizer:
    """
    合同摘要服务

    功能：
    - Map-Reduce方式生成整篇合同摘要
    - 单条款摘要生成（抽取式+抽象式混合）
    - 结构化摘要：关键点、关键方、关键日期、关键金额、关键义务
    - 基于LangChain的prompt模板，要求来源标注
    """

    MAP_PROMPT_TEMPLATE: str = """你是一位专业的合同法律分析师。请对以下合同条款片段进行详细分析和摘要。

条款信息：
- 条款ID: {clause_id}
- 条款标题: {clause_title}
- 条款类别: {clause_category}

条款内容：
{text}

请完成以下任务：
1. 生成不超过50字的抽取式摘要（直接引用原文中的关键语句）
2. 生成不超过100字的抽象式摘要（用你自己的话重新表述核心含义）
3. 标注信息来源：请在摘要中使用 [条款ID:条款标题] 的格式标注来源

请严格按照以下JSON格式输出：
{{
  "extractive_summary": "抽取式摘要内容",
  "abstractive_summary": "抽象式摘要内容",
  "source_ref": "[{clause_id}:{clause_title}]"
}}"""

    REDUCE_PROMPT_TEMPLATE: str = """你是一位资深的合同审查律师。请根据以下所有合同条款的摘要，生成一份完整的合同整体摘要。

各条款摘要：
{text}

请生成一份完整的合同摘要，要求：
1. 总字数控制在 {max_length} 字以内，不少于 {min_length} 字
2. 涵盖合同的核心内容、各方权利义务、关键约束
3. 结构清晰，逻辑连贯
4. 重要信息必须标注来源引用，格式：[条款ID:条款标题]
5. 重点突出商业条款和法律风险点

请直接输出摘要内容，不需要额外的解释。"""

    SINGLE_CLAUSE_MAP_PROMPT: str = """你是一位专业的合同法律分析师。请对以下合同条款进行分析和摘要。

条款信息：
- 条款ID: {clause_id}
- 条款标题: {clause_title}
- 条款类别: {clause_category}

完整条款内容：
{text}

请严格按照以下要求输出JSON：
1. extractive_summary: 抽取式摘要，不超过80字，直接引用原文关键语句
2. abstractive_summary: 抽象式摘要，不超过150字，用专业法律语言重新表述
3. combined_summary: 混合摘要，不超过200字，结合抽取和抽象
4. source_ref: 来源引用，格式为 [条款ID:条款标题]

输出格式：
{{
  "extractive_summary": "",
  "abstractive_summary": "",
  "combined_summary": "",
  "source_ref": "[{clause_id}:{clause_title}]"
}}"""

    STRUCTURED_KEY_POINTS_PROMPT: str = """你是一位资深的合同审查专家。请分析以下合同内容，提取关键信息点。

合同全文内容：
{text}

请提取以下结构化信息，并以JSON格式输出。每个信息项都必须包含来源标注（source_clause_id和source_clause_ref）。

输出格式要求：
{{
  "key_points": [
    {{
      "content": "关键信息内容描述",
      "category": "parties|dates|amounts|obligations|risks|rights|termination|other",
      "importance": 1-10的整数，10最重要,
      "source_clause_id": 来源条款ID数字,
      "source_clause_ref": "来源条款引用，如[1:合同双方]"
    }}
  ],
  "key_parties": [
    {{
      "name": "当事方全称",
      "role": "甲方/乙方/丙方/担保方等",
      "source_clause_id": 来源条款ID,
      "source_clause_ref": "来源引用"
    }}
  ],
  "key_dates": [
    {{
      "description": "日期描述，如签署日期/生效日期/付款截止日等",
      "date_value": "YYYY-MM-DD格式或日期描述",
      "source_clause_id": 来源条款ID,
      "source_clause_ref": "来源引用"
    }}
  ],
  "key_amounts": [
    {{
      "description": "金额描述，如合同总价/首付款/违约金等",
      "amount_value": 数字金额,
      "currency": "CNY/USD/EUR等",
      "source_clause_id": 来源条款ID,
      "source_clause_ref": "来源引用"
    }}
  ],
  "key_obligations": [
    {{
      "party": "承担义务的当事方名称",
      "obligation_content": "义务内容描述",
      "deadline": "履行截止日期或期限，可选",
      "penalty": "违约责任描述，可选",
      "source_clause_id": 来源条款ID,
      "source_clause_ref": "来源引用"
    }}
  ]
}}"""

    def __init__(
        self,
        *,
        llm_factory: Optional[LLMFactory] = None,
        max_length: int = settings.SUMMARY_MAX_LENGTH,
        min_length: int = settings.SUMMARY_MIN_LENGTH,
    ):
        self._llm_factory = llm_factory or LLMFactory()
        self._max_length = max_length
        self._min_length = min_length
        self._text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE * 4,
            chunk_overlap=settings.CHUNK_OVERLAP * 2,
            separators=["\n\n", "\n", "。", "；", "，", " ", ""],
        )
        self._json_parser = JsonOutputParser()
        self._str_parser = StrOutputParser()
        self._accumulated_usage = LLMUsage()

    @property
    def accumulated_usage(self) -> LLMUsage:
        return self._accumulated_usage

    def reset_usage(self) -> None:
        self._accumulated_usage = LLMUsage()

    def _build_map_prompt(self) -> PromptTemplate:
        return PromptTemplate(
            template=self.MAP_PROMPT_TEMPLATE,
            input_variables=["text", "clause_id", "clause_title", "clause_category"],
        )

    def _build_reduce_prompt(self) -> PromptTemplate:
        return PromptTemplate(
            template=self.REDUCE_PROMPT_TEMPLATE,
            input_variables=["text"],
            partial_variables={
                "max_length": str(self._max_length),
                "min_length": str(self._min_length),
            },
        )

    def _build_single_clause_prompt(self) -> PromptTemplate:
        return PromptTemplate(
            template=self.SINGLE_CLAUSE_MAP_PROMPT,
            input_variables=["text", "clause_id", "clause_title", "clause_category"],
        )

    def _build_structured_prompt(self) -> PromptTemplate:
        return PromptTemplate(
            template=self.STRUCTURED_KEY_POINTS_PROMPT,
            input_variables=["text"],
        )

    def _format_clauses_for_map_reduce(
        self,
        clause_texts: List[str],
        clause_metadata: List[Dict[str, Any]],
    ) -> List[Document]:
        documents = []
        for i, text in enumerate(clause_texts):
            meta = clause_metadata[i] if i < len(clause_metadata) else {}
            doc = Document(
                page_content=text,
                metadata={
                    "clause_id": str(meta.get("clause_id", i + 1)),
                    "clause_title": meta.get("clause_title", f"第{i+1}条"),
                    "clause_category": meta.get("category", "other"),
                },
            )
            documents.append(doc)
        return documents

    def summarize_single_clause(
        self,
        clause_text: str,
        *,
        clause_id: int,
        clause_title: str,
        clause_category: str = "other",
    ) -> ClauseSummary:
        """
        生成单条款摘要（抽取式+抽象式混合）

        Args:
            clause_text: 条款完整文本
            clause_id: 条款ID
            clause_title: 条款标题
            clause_category: 条款类别

        Returns:
            ClauseSummary对象
        """
        llm = self._llm_factory.get_chat_model(temperature=0.2)
        prompt = self._build_single_clause_prompt()
        chain = prompt | llm | self._json_parser

        try:
            messages = prompt.format_messages(
                text=clause_text,
                clause_id=clause_id,
                clause_title=clause_title,
                clause_category=clause_category,
            )
            response, usage = self._llm_factory.chat_with_usage(messages)
            result = self._json_parser.parse(response.content)
            self._accumulated_usage.add(usage)

            return ClauseSummary(
                clause_id=clause_id,
                clause_title=clause_title,
                clause_category=clause_category,
                extractive_summary=result.get("extractive_summary", ""),
                abstractive_summary=result.get("abstractive_summary", ""),
                combined_summary=result.get("combined_summary", ""),
                source_ref=result.get("source_ref", f"[{clause_id}:{clause_title}]"),
                usage=usage,
            )
        except Exception as e:
            logger.error(f"单条款摘要生成失败 (clause_id={clause_id}): {e}")
            fallback_summary = clause_text[:200] + ("..." if len(clause_text) > 200 else "")
            return ClauseSummary(
                clause_id=clause_id,
                clause_title=clause_title,
                clause_category=clause_category,
                extractive_summary=fallback_summary,
                abstractive_summary=fallback_summary,
                combined_summary=fallback_summary,
                source_ref=f"[{clause_id}:{clause_title}]",
            )

    def summarize_clauses_batch(
        self,
        clauses: List[Dict[str, Any]],
    ) -> List[ClauseSummary]:
        """
        批量生成条款摘要

        Args:
            clauses: 条款列表，每个字典需包含: id/clause_id, title/clause_title, text/original_text, category

        Returns:
            ClauseSummary列表
        """
        results = []
        for clause in clauses:
            clause_id = clause.get("clause_id", clause.get("id", 0))
            clause_title = clause.get("clause_title", clause.get("title", "未命名条款"))
            clause_text = clause.get("original_text", clause.get("text", ""))
            clause_category = clause.get("category", "other")

            if clause_text.strip():
                summary = self.summarize_single_clause(
                    clause_text=clause_text,
                    clause_id=int(clause_id),
                    clause_title=clause_title,
                    clause_category=clause_category,
                )
                results.append(summary)

        return results

    def summarize_full_contract_map_reduce(
        self,
        clause_texts: List[str],
        clause_metadata: List[Dict[str, Any]],
        *,
        document_id: int,
    ) -> str:
        """
        Map-Reduce方式生成整篇合同摘要

        Args:
            clause_texts: 条款文本列表
            clause_metadata: 条款元数据列表
            document_id: 文档ID

        Returns:
            整篇合同摘要文本
        """
        if not clause_texts:
            return ""

        documents = self._format_clauses_for_map_reduce(clause_texts, clause_metadata)
        llm = self._llm_factory.get_chat_model(temperature=0.3)

        map_prompt = self._build_map_prompt()
        reduce_prompt = self._build_reduce_prompt()

        try:
            chain = load_summarize_chain(
                llm=llm,
                chain_type="map_reduce",
                map_prompt=map_prompt,
                combine_prompt=reduce_prompt,
                collapse_prompt=reduce_prompt,
                token_max=8000,
                verbose=False,
            )

            result = chain.invoke({"input_documents": documents})
            full_summary = result.get("output_text", "") if isinstance(result, dict) else str(result)
            return full_summary.strip()
        except Exception as e:
            logger.error(f"Map-Reduce整篇摘要生成失败 (document_id={document_id}): {e}")
            combined_text = "\n\n".join(
                f"[{meta.get('clause_id', i+1)}:{meta.get('clause_title', '条款')}]\n{text[:300]}"
                for i, (text, meta) in enumerate(zip(clause_texts, clause_metadata))
            )
            return self._fallback_summary(combined_text)

    def extract_structured_summary(
        self,
        full_contract_text: str,
    ) -> Tuple[List[KeyPoint], List[KeyParty], List[KeyDate], List[KeyAmount], List[KeyObligation]]:
        """
        提取结构化摘要信息

        Args:
            full_contract_text: 完整合同文本

        Returns:
            (关键点列表, 关键方列表, 关键日期列表, 关键金额列表, 关键义务列表)
        """
        llm = self._llm_factory.get_chat_model(temperature=0.1)
        prompt = self._build_structured_prompt()
        chain = prompt | llm | self._json_parser

        try:
            truncated_text = full_contract_text[:30000] if len(full_contract_text) > 30000 else full_contract_text
            messages = prompt.format_messages(text=truncated_text)
            response, usage = self._llm_factory.chat_with_usage(messages)
            result = self._json_parser.parse(response.content)
            self._accumulated_usage.add(usage)

            key_points = [
                KeyPoint(
                    content=item.get("content", ""),
                    category=item.get("category", "other"),
                    importance=int(item.get("importance", 5)),
                    source_clause_id=item.get("source_clause_id"),
                    source_clause_ref=item.get("source_clause_ref"),
                )
                for item in result.get("key_points", [])
            ]

            key_parties = [
                KeyParty(
                    name=item.get("name", ""),
                    role=item.get("role", ""),
                    source_clause_id=item.get("source_clause_id"),
                    source_clause_ref=item.get("source_clause_ref"),
                )
                for item in result.get("key_parties", [])
            ]

            key_dates = [
                KeyDate(
                    description=item.get("description", ""),
                    date_value=item.get("date_value", ""),
                    source_clause_id=item.get("source_clause_id"),
                    source_clause_ref=item.get("source_clause_ref"),
                )
                for item in result.get("key_dates", [])
            ]

            key_amounts = [
                KeyAmount(
                    description=item.get("description", ""),
                    amount_value=float(item.get("amount_value", 0)),
                    currency=item.get("currency", "CNY"),
                    source_clause_id=item.get("source_clause_id"),
                    source_clause_ref=item.get("source_clause_ref"),
                )
                for item in result.get("key_amounts", [])
            ]

            key_obligations = [
                KeyObligation(
                    party=item.get("party", ""),
                    obligation_content=item.get("obligation_content", ""),
                    deadline=item.get("deadline"),
                    penalty=item.get("penalty"),
                    source_clause_id=item.get("source_clause_id"),
                    source_clause_ref=item.get("source_clause_ref"),
                )
                for item in result.get("key_obligations", [])
            ]

            return key_points, key_parties, key_dates, key_amounts, key_obligations

        except Exception as e:
            logger.error(f"结构化摘要提取失败: {e}")
            return [], [], [], [], []

    def generate_full_summary(
        self,
        *,
        document_id: int,
        clauses: List[Dict[str, Any]],
        full_contract_text: Optional[str] = None,
        include_structured: bool = True,
        include_clause_summaries: bool = True,
    ) -> SummaryResult:
        """
        生成完整的合同摘要（综合所有功能）

        Args:
            document_id: 合同文档ID
            clauses: 条款列表，每个字典需包含: id/clause_id, title/clause_title, text/original_text, category
            full_contract_text: 完整合同文本（可选，用于结构化提取）
            include_structured: 是否生成结构化摘要
            include_clause_summaries: 是否生成逐条款摘要

        Returns:
            SummaryResult对象
        """
        self.reset_usage()

        clause_texts = [clause.get("original_text", clause.get("text", "")) for clause in clauses]
        clause_metadata = [
            {
                "clause_id": clause.get("clause_id", clause.get("id", i + 1)),
                "clause_title": clause.get("clause_title", clause.get("title", f"第{i+1}条")),
                "category": clause.get("category", "other"),
            }
            for i, clause in enumerate(clauses)
        ]

        full_summary = self.summarize_full_contract_map_reduce(
            clause_texts=clause_texts,
            clause_metadata=clause_metadata,
            document_id=document_id,
        )

        clause_summaries: List[ClauseSummary] = []
        if include_clause_summaries:
            clause_summaries = self.summarize_clauses_batch(clauses)

        key_points: List[KeyPoint] = []
        key_parties: List[KeyParty] = []
        key_dates: List[KeyDate] = []
        key_amounts: List[KeyAmount] = []
        key_obligations: List[KeyObligation] = []

        if include_structured:
            if full_contract_text is None:
                full_contract_text = "\n\n".join(
                    f"[{meta['clause_id']}:{meta['clause_title']}]\n{text}"
                    for text, meta in zip(clause_texts, clause_metadata)
                )
            key_points, key_parties, key_dates, key_amounts, key_obligations = (
                self.extract_structured_summary(full_contract_text)
            )

        usage = self._accumulated_usage
        return SummaryResult(
            document_id=document_id,
            full_summary=full_summary,
            key_points=key_points,
            key_parties=key_parties,
            key_dates=key_dates,
            key_amounts=key_amounts,
            key_obligations=key_obligations,
            clause_summaries=clause_summaries,
            total_tokens=usage.tokens_input + usage.tokens_output,
            total_latency_ms=usage.latency_ms,
            total_cost_usd=usage.cost_usd,
            model_version=self._llm_factory.default_model,
        )

    def _fallback_summary(self, text: str) -> str:
        sentences = re.split(r"[。！？!?]", text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        selected = sentences[:10]
        summary = "。".join(selected) + "。"
        if len(summary) > self._max_length:
            summary = summary[:self._max_length] + "..."
        return summary


def get_contract_summarizer() -> ContractSummarizer:
    """获取合同摘要服务实例"""
    return ContractSummarizer()
