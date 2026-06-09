from __future__ import annotations

import logging
import uuid
import time
from typing import Optional, Dict, Any, List, Tuple

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.data.models import ConfidenceLevel
from app.repositories.system_repo import QAConversationRepository, ModelVersionRepository
from app.schemas.qa import (
    QARequest, QAResponse, Citation, SemanticSearchRequest, SemanticSearchResponse, SearchResult
)
from app.engines.rag_engine import QueryEngine

logger = logging.getLogger(__name__)


class QAService:
    """问答服务：封装语义搜索与RAG问答（推理侧）。"""

    def __init__(self, db: Session):
        self.db = db
        self.conv_repo = QAConversationRepository(db)
        self.model_repo = ModelVersionRepository(db)
        self.settings = get_settings()

    def _resolve_model_version(self, requested: Optional[str]) -> str:
        if requested:
            mv = self.model_repo.get_by_tag(requested)
            if mv:
                return mv.version_tag
        default = self.model_repo.get_default()
        if default:
            return default.version_tag
        return self.settings.DEFAULT_MODEL_VERSION

    def _classify_confidence(self, score: float) -> Tuple[ConfidenceLevel, bool, bool]:
        if score >= self.settings.CONFIDENCE_THRESHOLD_MEDIUM:
            return ConfidenceLevel.HIGH, False, False
        elif score >= self.settings.CONFIDENCE_THRESHOLD_LOW:
            return ConfidenceLevel.MEDIUM, False, False
        else:
            return ConfidenceLevel.LOW, True, True

    def semantic_search(self, req: SemanticSearchRequest) -> SemanticSearchResponse:
        start = time.perf_counter()
        model_version = self._resolve_model_version(req.model_version)
        engine = QueryEngine(model_version=model_version)

        raw_results = engine.semantic_search(
            query=req.query,
            top_k=req.top_k,
        )
        results = []
        for r in raw_results:
            results.append(SearchResult(
                node_id=r["node_id"],
                score=r["score"],
                content=r["content"],
                citation=Citation(**r["citation"]),
            ))
        latency = int((time.perf_counter() - start) * 1000)
        return SemanticSearchResponse(
            query=req.query,
            model_version=model_version,
            results=results,
            total_results=len(results),
            latency_ms=latency,
        )

    def answer_question(self, req: QARequest) -> QAResponse:
        start = time.perf_counter()
        model_version = self._resolve_model_version(req.model_version)
        session_id = req.session_id or uuid.uuid4().hex

        engine = QueryEngine(model_version=model_version)
        answer_data = engine.answer_question(
            question=req.question,
            top_k_context=req.top_k_context,
        )

        answer = answer_data["answer"]
        confidence = float(answer_data["confidence"])
        sources_raw: List[Dict[str, Any]] = answer_data.get("sources", [])
        reasoning = answer_data.get("reasoning") if req.return_reasoning else None

        confidence_level, low_conf_warning, needs_human = self._classify_confidence(confidence)

        citations = [Citation(**s) for s in sources_raw] if req.include_citations else []
        disclaimers: List[str] = []
        if low_conf_warning:
            disclaimers.append(
                "本回答置信度较低，请结合上下文和来源文档综合判断。"
            )
        if not citations:
            disclaimers.append(
                "未检索到足够的上下文来源，本回答可能存在偏差，建议使用语义搜索进一步验证。"
            )
        disclaimers.append(
            "本回答由内部知识库自动生成，如与官方代码或文档有出入，请以实际仓库和权威文档为准。"
        )

        conv = self.conv_repo.create({
            "session_id": session_id,
            "user_id": req.user_id,
            "question": req.question,
            "answer": answer,
            "model_version": model_version,
            "confidence_score": confidence,
            "confidence_level": confidence_level,
            "sources_used": [s.model_dump() if isinstance(s, Citation) else s for s in citations],
            "reasoning": reasoning,
            "low_confidence_warning": low_conf_warning,
            "requires_human_review": needs_human,
            "latency_ms": int((time.perf_counter() - start) * 1000),
        }, citations=[s.model_dump() if isinstance(s, Citation) else s for s in citations])

        latency = int((time.perf_counter() - start) * 1000)
        return QAResponse(
            conversation_id=conv.id,
            session_id=conv.session_id,
            question=conv.question,
            answer=conv.answer,
            model_version=conv.model_version,
            confidence_score=conv.confidence_score,
            confidence_level=conv.confidence_level,
            citations=citations,
            reasoning=conv.reasoning,
            low_confidence_warning=conv.low_confidence_warning,
            requires_human_review=conv.requires_human_review,
            disclaimers=disclaimers,
            latency_ms=latency,
        )

    def get_conversation(self, conv_id: int):
        return self.conv_repo.get(conv_id)

    def get_conversation_citations(self, conv_id: int):
        return self.conv_repo.get_citations(conv_id)

    def list_conversations(self, page: int = 1, page_size: int = 20, **filters):
        return self.conv_repo.list(page=page, page_size=page_size, **filters)
