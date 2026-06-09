from __future__ import annotations

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.qa import (
    QARequest, QAResponse, SemanticSearchRequest, SemanticSearchResponse, Citation
)
from app.services.qa_service import QAService
from app.api.deps import get_qa_service, get_current_user_id

router = APIRouter(tags=["QA & Search"])


# ========= Semantic Search (推理侧) =========

@router.post("/search", response_model=SemanticSearchResponse)
def semantic_search(
    req: SemanticSearchRequest,
    svc: QAService = Depends(get_qa_service),
):
    """语义搜索：基于向量相似度检索相关代码/文档片段，带引用跳转信息。"""
    try:
        return svc.semantic_search(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search", response_model=SemanticSearchResponse)
def semantic_search_get(
    query: str = Query(..., min_length=1, max_length=500),
    top_k: int = Query(8, ge=1, le=50),
    model_version: Optional[str] = None,
    svc: QAService = Depends(get_qa_service),
):
    req = SemanticSearchRequest(query=query, top_k=top_k, model_version=model_version)
    try:
        return svc.semantic_search(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ========= RAG Q&A (推理侧) =========

@router.post("/qa", response_model=QAResponse)
def ask_question(
    req: QARequest,
    svc: QAService = Depends(get_qa_service),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """RAG问答：基于检索到的上下文生成回答，严格引用来源，低置信度会提示。"""
    req.user_id = req.user_id or user_id
    try:
        return svc.answer_question(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/qa/conversations", response_model=dict)
def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    user_id: Optional[str] = None,
    model_version: Optional[str] = None,
    session_id: Optional[str] = None,
    svc: QAService = Depends(get_qa_service),
):
    items, total = svc.list_conversations(
        page=page, page_size=page_size,
        user_id=user_id, model_version=model_version, session_id=session_id,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/qa/conversations/{conv_id}", response_model=dict)
def get_conversation(
    conv_id: int,
    include_citations: bool = Query(True),
    svc: QAService = Depends(get_qa_service),
):
    conv = svc.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    data = {
        "id": conv.id,
        "session_id": conv.session_id,
        "user_id": conv.user_id,
        "question": conv.question,
        "answer": conv.answer,
        "model_version": conv.model_version,
        "confidence_score": conv.confidence_score,
        "confidence_level": conv.confidence_level.value if hasattr(conv.confidence_level, 'value') else str(conv.confidence_level),
        "reasoning": conv.reasoning,
        "low_confidence_warning": conv.low_confidence_warning,
        "requires_human_review": conv.requires_human_review,
        "latency_ms": conv.latency_ms,
        "created_at": conv.created_at,
    }
    if include_citations:
        citations = svc.get_conversation_citations(conv_id)
        data["citations"] = [
            {
                "id": c.id,
                "document_id": c.document_id,
                "node_id": c.node_id,
                "source_title": c.source_title,
                "file_path": c.file_path,
                "source_url": c.source_url,
                "line_start": c.line_start,
                "line_end": c.line_end,
                "snippet": c.snippet,
                "relevance_score": c.relevance_score,
            }
            for c in citations
        ]
    return data


@router.get("/qa/conversations/{conv_id}/citations", response_model=List[dict])
def get_conversation_citations(
    conv_id: int,
    svc: QAService = Depends(get_qa_service),
):
    """获取某次回答的所有引用，用于来源跳转。"""
    conv = svc.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    citations = svc.get_conversation_citations(conv_id)
    return [
        {
            "id": c.id,
            "document_id": c.document_id,
            "node_id": c.node_id,
            "source_title": c.source_title,
            "file_path": c.file_path,
            "source_url": c.source_url,
            "line_start": c.line_start,
            "line_end": c.line_end,
            "snippet": c.snippet,
            "relevance_score": c.relevance_score,
            "jump_url": (
                c.source_url
                if c.source_url
                else (f"file://{c.file_path}#L{c.line_start}-L{c.line_end}" if c.file_path else None)
            ),
        }
        for c in citations
    ]
