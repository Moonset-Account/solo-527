from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.contract import ContractDocument
from app.models.task import Feedback, FeedbackType
from app.models.user import User
from app.schemas.base import BaseResponse, PageResponse
from app.schemas.qa import (
    ConversationInfo,
    QAAnswer,
    QAAnswerRequest,
    QAFeedbackRequest,
    SourceReference,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/qa", tags=["QA"])

_MEM_CONVERSATIONS: Dict[str, ConversationInfo] = {}


@router.post("/answer", response_model=BaseResponse[QAAnswer])
async def qa_answer(
    req: QAAnswerRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract_result = await db.execute(
        select(ContractDocument.id).where(ContractDocument.id == req.contract_id)
    )
    if not contract_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="合同不存在")

    conv_id = req.conversation_id or f"conv_{uuid.uuid4().hex[:12]}"

    answer = QAAnswer(
        answer_id=f"ans_{uuid.uuid4().hex[:16]}",
        contract_id=req.contract_id,
        conversation_id=conv_id,
        question=req.question,
        answer="这是一个示例回答。实际实现将调用QAEngine。",
        sources=[],
        confidence=0.85,
        model_version="mock-v1",
        tokens_used=150,
        latency_ms=320,
        created_at=datetime.utcnow(),
    )

    return BaseResponse(data=answer, message="问答完成")


@router.get("/conversations", response_model=BaseResponse[PageResponse[ConversationInfo]])
async def list_conversations(
    contract_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = [
        ConversationInfo(
            conversation_id=cid,
            contract_id=c.contract_id,
            title=f"会话 {cid[:8]}",
            messages=[],
            message_count=len(c.messages),
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for cid, c in _MEM_CONVERSATIONS.items()
        if contract_id is None or c.contract_id == contract_id
    ]
    total = len(items)
    start = (page - 1) * page_size
    page_items = items[start:start + page_size]
    return BaseResponse(data=PageResponse.build(page_items, total, page, page_size))


@router.post("/feedback", response_model=BaseResponse[dict])
async def submit_qa_feedback(
    req: QAFeedbackRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fb = Feedback(
        user_id=current_user.id,
        feedback_type=req.feedback_type,
        score=req.score,
        content=req.content,
        corrected_text=req.corrected_text,
        metadata={"answer_id": req.answer_id, **(req.metadata or {})},
    )
    db.add(fb)
    await db.commit()
    await db.refresh(fb)

    return BaseResponse(
        data={"feedback_id": fb.id, "answer_id": req.answer_id},
        message="反馈已提交",
    )
