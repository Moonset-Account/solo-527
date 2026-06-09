from __future__ import annotations

import re
import math
import time
from collections import defaultdict
from typing import List, Optional, Dict, Any, Tuple, Deque
from dataclasses import dataclass, field, asdict
from collections import deque

from loguru import logger
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.messages import AIMessage, HumanMessage, BaseMessage

from app.config import settings
from app.services.ai.llm_factory import LLMFactory, LLMUsage
from app.services.ai.vector_store import VectorStoreManager, FilterCriteria, IndexedClause


@dataclass
class RetrievedContext:
    clause_id: int
    document_id: int
    clause_index: int
    clause_title: str
    category: str
    content: str
    page_start: int
    page_end: int
    vector_score: float
    bm25_score: float
    hybrid_score: float
    rank: int
    source_ref: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_indexed_clause(
        cls,
        clause: IndexedClause,
        *,
        vector_score: float = 0.0,
        bm25_score: float = 0.0,
        hybrid_score: float = 0.0,
        rank: int = 0,
    ) -> "RetrievedContext":
        source_ref = f"[{clause.clause_id}:{clause.clause_index if clause.clause_index else clause.clause_id}]"
        if clause.clause_title:
            source_ref = f"[{clause.clause_id}:{clause.clause_title}]"
        return cls(
            clause_id=clause.clause_id,
            document_id=clause.document_id,
            clause_index=clause.clause_index,
            clause_title=clause.clause_title or f"第{clause.clause_index}条",
            category=clause.category,
            content=clause.cleaned_text or clause.original_text,
            page_start=clause.page_start,
            page_end=clause.page_end,
            vector_score=vector_score,
            bm25_score=bm25_score,
            hybrid_score=hybrid_score,
            rank=rank,
            source_ref=source_ref,
            metadata=clause.metadata,
        )


@dataclass
class SourceCitation:
    clause_id: int
    clause_title: str
    source_ref: str
    quote_excerpt: str
    relevance: float
    page_number: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class QAAnswer:
    question: str
    answer: str
    structured_answer: Optional[Dict[str, Any]]
    citations: List[SourceCitation]
    retrieved_contexts: List[RetrievedContext]
    can_answer: bool
    confidence: float
    follow_up_questions: List[str]
    reasoning: str
    usage: Optional[LLMUsage] = None
    response_time_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        d = {
            "question": self.question,
            "answer": self.answer,
            "structured_answer": self.structured_answer,
            "citations": [c.to_dict() for c in self.citations],
            "retrieved_contexts": [ctx.to_dict() for ctx in self.retrieved_contexts],
            "can_answer": self.can_answer,
            "confidence": round(self.confidence, 4),
            "follow_up_questions": self.follow_up_questions,
            "reasoning": self.reasoning,
            "response_time_ms": round(self.response_time_ms, 2),
        }
        if self.usage:
            d["usage"] = self.usage.to_dict()
        return d


class ConversationHistory:
    def __init__(self, max_turns: int = 10):
        self._max_turns = max_turns
        self._messages: Deque[BaseMessage] = deque(maxlen=max_turns * 2)
        self._summaries: List[str] = []

    @property
    def messages(self) -> List[BaseMessage]:
        return list(self._messages)

    @property
    def turn_count(self) -> int:
        return len(self._messages) // 2

    def add_user_message(self, content: str) -> None:
        self._messages.append(HumanMessage(content=content))

    def add_ai_message(self, content: str) -> None:
        self._messages.append(AIMessage(content=content))

    def get_condensed_context(self, max_chars: int = 2000) -> str:
        if not self._messages:
            return ""
        context_parts = []
        total_chars = 0
        for msg in reversed(self._messages):
            prefix = "用户: " if isinstance(msg, HumanMessage) else "AI: "
            text = msg.content
            if total_chars + len(prefix) + len(text) > max_chars:
                remaining = max_chars - total_chars
                if remaining > 20:
                    context_parts.insert(0, prefix + text[:remaining] + "...")
                break
            context_parts.insert(0, prefix + text)
            total_chars += len(prefix) + len(text)
        return "\n".join(context_parts)

    def clear(self) -> None:
        self._messages.clear()
        self._summaries.clear()


class BM25Ranker:
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self._corpus: List[List[str]] = []
        self._doc_freqs: Dict[str, int] = defaultdict(int)
        self._avg_doc_len: float = 0.0
        self._idf: Dict[str, float] = {}
        self._fitted = False

    def _tokenize(self, text: str) -> List[str]:
        tokens = re.findall(r"[\u4e00-\u9fff]|[a-zA-Z0-9_]+", text.lower())
        return tokens if tokens else text.lower().split()

    def fit(self, documents: List[str]) -> None:
        self._corpus = [self._tokenize(doc) for doc in documents]
        n_docs = len(self._corpus)
        if n_docs == 0:
            return

        total_len = 0
        self._doc_freqs.clear()

        for tokens in self._corpus:
            total_len += len(tokens)
            unique_tokens = set(tokens)
            for token in unique_tokens:
                self._doc_freqs[token] += 1

        self._avg_doc_len = total_len / n_docs

        self._idf.clear()
        for token, df in self._doc_freqs.items():
            self._idf[token] = math.log((n_docs - df + 0.5) / (df + 0.5) + 1.0)

        self._fitted = True

    def score(self, query: str, doc_index: int) -> float:
        if not self._fitted or doc_index >= len(self._corpus):
            return 0.0

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return 0.0

        doc_tokens = self._corpus[doc_index]
        doc_len = len(doc_tokens)
        if doc_len == 0:
            return 0.0

        tf_counts: Dict[str, int] = defaultdict(int)
        for token in doc_tokens:
            tf_counts[token] += 1

        score = 0.0
        dl_norm = 1.0 - self.b + self.b * (doc_len / self._avg_doc_len if self._avg_doc_len > 0 else 1.0)

        for q_token in query_tokens:
            if q_token not in self._idf:
                continue
            tf = tf_counts.get(q_token, 0)
            if tf == 0:
                continue
            idf = self._idf[q_token]
            numerator = tf * (self.k1 + 1)
            denominator = tf + self.k1 * dl_norm
            score += idf * (numerator / denominator)

        return score

    def batch_score(self, query: str) -> List[float]:
        if not self._fitted:
            return []
        return [self.score(query, i) for i in range(len(self._corpus))]


class QAEngine:
    """
    检索问答引擎

    功能：
    - 基于RAG的合同问答
    - 混合检索（向量+关键词BM25重排）
    - 答案必须标注来源条款引用
    - 追问上下文保留
    """

    RAG_PROMPT_TEMPLATE: str = """你是一位专业的合同法律问答助手。请根据提供的合同条款上下文，准确、专业地回答用户的问题。

【重要规则】
1. 只基于提供的上下文内容回答，不要使用外部知识或编造信息
2. 如果上下文中没有足够信息回答问题，必须明确说明"根据现有合同条款，无法回答该问题"
3. 所有引用的条款内容必须标注来源引用，格式为 [条款ID:条款标题]，放在对应内容之后的括号中
4. 回答要专业、准确、有条理，使用法律行业规范用语
5. 对于金额、日期、期限等关键信息，必须精确引用原文

【合同条款上下文】
{context}

【对话历史（如有）】
{chat_history}

【用户问题】
{question}

请严格按照以下JSON格式输出答案：
{{
  "can_answer": true或false,
  "confidence": 0.0到1.0之间的置信度分数,
  "answer": "详细的回答内容，必须包含来源引用",
  "reasoning": "说明你是如何根据上下文得出答案的推理过程",
  "citations": [
    {{
      "clause_id": 条款ID数字,
      "clause_title": "条款标题",
      "source_ref": "[条款ID:条款标题]",
      "quote_excerpt": "引用的原文片段（不超过100字）",
      "relevance": 0.0到1.0的相关性分数,
      "page_number": 页码数字或null
    }}
  ],
  "follow_up_questions": [
    "建议的追问问题1（最多3个）",
    "建议的追问问题2"
  ],
  "structured_answer": {{可选，结构化的答案数据，如金额、日期等}}
}}"""

    CONDENSE_QUESTION_PROMPT: str = """根据以下对话历史和用户的追问，生成一个独立的、完整的查询问题，使其不依赖上下文也能被理解。

对话历史：
{chat_history}

用户追问：
{follow_up_question}

请直接输出改写后的独立问题，不要添加任何解释。要求：
1. 补充追问中省略的指代内容（如"它"、"这个"、"该条款"等）
2. 保持原问题的意图和语气
3. 问题要具体、明确，便于检索系统理解

改写后的问题："""

    def __init__(
        self,
        *,
        llm_factory: Optional[LLMFactory] = None,
        vector_store: Optional[VectorStoreManager] = None,
        top_k_retrieve: int = settings.TOP_K_RETRIEVE,
        top_k_rerank: int = settings.TOP_K_RERANK,
        vector_weight: float = 0.6,
        bm25_weight: float = 0.4,
        max_history_turns: int = 10,
    ):
        self._llm_factory = llm_factory or LLMFactory()
        self._vector_store = vector_store or VectorStoreManager()
        self._top_k_retrieve = top_k_retrieve
        self._top_k_rerank = top_k_rerank
        self._vector_weight = vector_weight
        self._bm25_weight = bm25_weight
        self._json_parser = JsonOutputParser()
        self._str_parser = StrOutputParser()
        self._conversations: Dict[str, ConversationHistory] = {}
        self._max_history_turns = max_history_turns
        self._total_usage = LLMUsage()

    @property
    def total_usage(self) -> LLMUsage:
        return self._total_usage

    def reset_usage(self) -> None:
        self._total_usage = LLMUsage()

    def get_or_create_conversation(self, session_id: str) -> ConversationHistory:
        if session_id not in self._conversations:
            self._conversations[session_id] = ConversationHistory(max_turns=self._max_history_turns)
        return self._conversations[session_id]

    def clear_conversation(self, session_id: str) -> None:
        if session_id in self._conversations:
            self._conversations[session_id].clear()

    def _condense_question(
        self,
        question: str,
        chat_history: ConversationHistory,
    ) -> str:
        if chat_history.turn_count == 0:
            return question

        history_text = chat_history.get_condensed_context(max_chars=1500)
        if not history_text:
            return question

        llm = self._llm_factory.get_chat_model(temperature=0.0)
        prompt = PromptTemplate(
            template=self.CONDENSE_QUESTION_PROMPT,
            input_variables=["chat_history", "follow_up_question"],
        )

        try:
            messages = prompt.format_messages(
                chat_history=history_text,
                follow_up_question=question,
            )
            response, usage = self._llm_factory.chat_with_usage(messages)
            self._total_usage.add(usage)
            condensed = response.content.strip()
            return condensed if condensed else question
        except Exception as e:
            logger.warning(f"问题改写失败，使用原问题: {e}")
            return question

    def _vector_search(
        self,
        query: str,
        *,
        criteria: Optional[FilterCriteria] = None,
        top_k: Optional[int] = None,
    ) -> List[Tuple[IndexedClause, float]]:
        return self._vector_store.similarity_search(
            query=query,
            top_k=top_k or self._top_k_retrieve,
            criteria=criteria,
        )

    def _build_bm25_corpus(
        self,
        clauses: List[IndexedClause],
    ) -> BM25Ranker:
        ranker = BM25Ranker(k1=1.5, b=0.75)
        documents = [
            f"{clause.clause_title} {clause.cleaned_text or clause.original_text}"
            for clause in clauses
        ]
        ranker.fit(documents)
        return ranker

    def _hybrid_retrieve(
        self,
        query: str,
        *,
        criteria: Optional[FilterCriteria] = None,
    ) -> List[RetrievedContext]:
        vector_candidates = self._vector_search(query, criteria=criteria, top_k=self._top_k_retrieve * 2)

        if not vector_candidates:
            return []

        clauses = [clause for clause, _ in vector_candidates]
        vector_scores = {clause.clause_id: score for clause, score in vector_candidates}

        bm25_ranker = self._build_bm25_corpus(clauses)
        bm25_scores_raw = bm25_ranker.batch_score(query)

        bm25_scores: Dict[int, float] = {}
        for i, clause in enumerate(clauses):
            bm25_scores[clause.clause_id] = bm25_scores_raw[i] if i < len(bm25_scores_raw) else 0.0

        max_vec = max(vector_scores.values()) if vector_scores else 1.0
        max_bm25 = max(bm25_scores.values()) if bm25_scores else 1.0
        max_vec = max_vec if max_vec > 0 else 1.0
        max_bm25 = max_bm25 if max_bm25 > 0 else 1.0

        scored_contexts: List[RetrievedContext] = []
        for clause in clauses:
            cid = clause.clause_id
            vec_norm = vector_scores.get(cid, 0.0) / max_vec
            bm25_norm = bm25_scores.get(cid, 0.0) / max_bm25
            hybrid = self._vector_weight * vec_norm + self._bm25_weight * bm25_norm

            context = RetrievedContext.from_indexed_clause(
                clause=clause,
                vector_score=vector_scores.get(cid, 0.0),
                bm25_score=bm25_scores.get(cid, 0.0),
                hybrid_score=hybrid,
            )
            scored_contexts.append(context)

        scored_contexts.sort(key=lambda ctx: ctx.hybrid_score, reverse=True)
        selected = scored_contexts[: self._top_k_rerank]

        for rank, ctx in enumerate(selected, start=1):
            ctx.rank = rank

        return selected

    def _format_context_for_prompt(self, contexts: List[RetrievedContext]) -> str:
        if not contexts:
            return "(未找到相关合同条款)"

        parts = []
        for ctx in contexts:
            part = (
                f"--- 条款 {ctx.rank} ---\n"
                f"条款ID: {ctx.clause_id}\n"
                f"条款标题: {ctx.clause_title}\n"
                f"条款类别: {ctx.category}\n"
                f"来源引用: {ctx.source_ref}\n"
                f"页码: 第{ctx.page_start}-{ctx.page_end}页\n"
                f"条款内容:\n{ctx.content}\n"
            )
            parts.append(part)
        return "\n".join(parts)

    def _build_rag_prompt(self) -> PromptTemplate:
        return PromptTemplate(
            template=self.RAG_PROMPT_TEMPLATE,
            input_variables=["context", "chat_history", "question"],
        )

    def ask(
        self,
        question: str,
        *,
        document_ids: Optional[List[int]] = None,
        clause_categories: Optional[List[str]] = None,
        session_id: Optional[str] = None,
        use_history: bool = True,
    ) -> QAAnswer:
        """
        执行合同问答

        Args:
            question: 用户问题
            document_ids: 限定查询的合同文档ID列表
            clause_categories: 限定查询的条款类别列表
            session_id: 会话ID，用于保持对话历史
            use_history: 是否使用对话历史进行问题改写

        Returns:
            QAAnswer答案对象
        """
        start_time = time.perf_counter()
        self._total_usage = LLMUsage()

        chat_history = ConversationHistory()
        if session_id and use_history:
            chat_history = self.get_or_create_conversation(session_id)

        effective_question = question
        if use_history and chat_history.turn_count > 0:
            effective_question = self._condense_question(question, chat_history)

        criteria = None
        if document_ids or clause_categories:
            criteria = FilterCriteria(
                document_ids=document_ids,
                clause_categories=clause_categories,
            )

        retrieved_contexts = self._hybrid_retrieve(effective_question, criteria=criteria)
        context_text = self._format_context_for_prompt(retrieved_contexts)

        history_text = chat_history.get_condensed_context(max_chars=1000) if use_history else ""

        llm = self._llm_factory.get_chat_model(temperature=0.1)
        prompt = self._build_rag_prompt()

        try:
            messages = prompt.format_messages(
                context=context_text,
                chat_history=history_text or "(无历史对话)",
                question=effective_question,
            )
            response, usage = self._llm_factory.chat_with_usage(messages)
            self._total_usage.add(usage)

            try:
                result = self._json_parser.parse(response.content)
            except Exception as parse_err:
                logger.warning(f"JSON解析失败，尝试提取: {parse_err}")
                result = self._parse_fallback(response.content, retrieved_contexts)

            citations = []
            for cite_data in result.get("citations", []):
                try:
                    citation = SourceCitation(
                        clause_id=int(cite_data.get("clause_id", 0)),
                        clause_title=cite_data.get("clause_title", ""),
                        source_ref=cite_data.get("source_ref", ""),
                        quote_excerpt=cite_data.get("quote_excerpt", ""),
                        relevance=float(cite_data.get("relevance", 0.0)),
                        page_number=cite_data.get("page_number"),
                    )
                    citations.append(citation)
                except Exception:
                    continue

            can_answer = bool(result.get("can_answer", False))
            confidence = float(result.get("confidence", 0.0))
            if not retrieved_contexts:
                confidence = min(confidence, 0.3)
                can_answer = False

            answer_text = result.get("answer", "")
            reasoning = result.get("reasoning", "")
            follow_ups = result.get("follow_up_questions", [])[:3]
            structured = result.get("structured_answer")

            response_time = (time.perf_counter() - start_time) * 1000

            qa_answer = QAAnswer(
                question=question,
                answer=answer_text if can_answer else "根据现有合同条款，无法回答该问题。请检查问题是否与已上传的合同相关，或尝试提供更具体的关键词。",
                structured_answer=structured,
                citations=citations,
                retrieved_contexts=retrieved_contexts,
                can_answer=can_answer,
                confidence=confidence,
                follow_up_questions=follow_ups if isinstance(follow_ups, list) else [],
                reasoning=reasoning,
                usage=LLMUsage(
                    tokens_input=self._total_usage.tokens_input,
                    tokens_output=self._total_usage.tokens_output,
                    cost_usd=self._total_usage.cost_usd,
                    latency_ms=self._total_usage.latency_ms,
                    calls=self._total_usage.calls,
                ),
                response_time_ms=response_time,
            )

            if session_id:
                chat_history.add_user_message(question)
                chat_history.add_ai_message(qa_answer.answer)

            return qa_answer

        except Exception as e:
            logger.error(f"问答执行失败: {e}")
            response_time = (time.perf_counter() - start_time) * 1000
            return QAAnswer(
                question=question,
                answer=f"问答服务处理时发生错误，请稍后重试。错误信息: {str(e)[:100]}",
                structured_answer=None,
                citations=[],
                retrieved_contexts=retrieved_contexts,
                can_answer=False,
                confidence=0.0,
                follow_up_questions=[],
                reasoning=f"执行异常: {str(e)}",
                response_time_ms=response_time,
            )

    def _parse_fallback(
        self,
        raw_text: str,
        contexts: List[RetrievedContext],
    ) -> Dict[str, Any]:
        answer_text = raw_text.strip()
        default_citations = []
        if contexts:
            for ctx in contexts[:3]:
                excerpt = ctx.content[:80] + ("..." if len(ctx.content) > 80 else "")
                default_citations.append({
                    "clause_id": ctx.clause_id,
                    "clause_title": ctx.clause_title,
                    "source_ref": ctx.source_ref,
                    "quote_excerpt": excerpt,
                    "relevance": ctx.hybrid_score,
                    "page_number": ctx.page_start,
                })

        json_match = re.search(r"\{[\s\S]*\}", raw_text)
        if json_match:
            try:
                import json
                parsed = json.loads(json_match.group())
                if "answer" not in parsed:
                    parsed["answer"] = answer_text
                if "citations" not in parsed or not parsed["citations"]:
                    parsed["citations"] = default_citations
                if "can_answer" not in parsed:
                    parsed["can_answer"] = bool(contexts)
                if "confidence" not in parsed:
                    parsed["confidence"] = 0.5 if contexts else 0.0
                if "reasoning" not in parsed:
                    parsed["reasoning"] = "基于检索到的合同条款进行回答。"
                if "follow_up_questions" not in parsed:
                    parsed["follow_up_questions"] = []
                return parsed
            except Exception:
                pass

        return {
            "can_answer": bool(contexts),
            "confidence": 0.4 if contexts else 0.0,
            "answer": answer_text,
            "reasoning": "基于检索到的合同条款进行回答（JSON解析失败，使用原始输出）。",
            "citations": default_citations,
            "follow_up_questions": [],
            "structured_answer": None,
        }

    def batch_ask(
        self,
        questions: List[str],
        *,
        document_ids: Optional[List[int]] = None,
        clause_categories: Optional[List[str]] = None,
        session_id: Optional[str] = None,
    ) -> List[QAAnswer]:
        """
        批量执行问答

        Args:
            questions: 问题列表
            document_ids: 限定查询的合同文档ID列表
            clause_categories: 限定查询的条款类别列表
            session_id: 会话ID

        Returns:
            QAAnswer列表
        """
        results = []
        current_session = session_id
        for i, question in enumerate(questions):
            use_history = i > 0 and current_session is not None
            answer = self.ask(
                question=question,
                document_ids=document_ids,
                clause_categories=clause_categories,
                session_id=current_session,
                use_history=use_history,
            )
            results.append(answer)
        return results


def get_qa_engine() -> QAEngine:
    """获取检索问答引擎实例"""
    return QAEngine()
