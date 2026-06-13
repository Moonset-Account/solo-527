import os
import uuid
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_, and_
from fastapi.responses import FileResponse

from app.config import settings
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app.models import (
    User, RoleEnum, Ticket, TicketStatus, TicketPriority,
    Attachment, TicketNote, TicketTimeline, TicketSimilarity
)
from app.schemas import (
    TicketCreate, TicketUpdate, TicketResponse, TicketDetailResponse,
    TicketListResponse, TicketNoteCreate, TicketNoteResponse,
    TicketTimelineResponse, AttachmentResponse, TicketSimilarityResponse
)

router = APIRouter(prefix="/tickets", tags=["工单"])


def _get_sla_deadline(priority: TicketPriority, created_at: datetime) -> datetime:
    hours_map = {
        TicketPriority.URGENT: 2,
        TicketPriority.HIGH: 8,
        TicketPriority.MEDIUM: 24,
        TicketPriority.LOW: 72,
    }
    hours = hours_map.get(priority, 24)
    return created_at + timedelta(hours=hours)


async def _add_timeline(
    db: AsyncSession, ticket_id: int, event_type: str,
    description: str, user_id: Optional[int] = None, metadata: dict = None
):
    timeline = TicketTimeline(
        ticket_id=ticket_id,
        event_type=event_type,
        description=description,
        created_by=user_id,
        metadata=metadata or {}
    )
    db.add(timeline)


@router.post("", response_model=TicketResponse)
async def create_ticket(
    ticket_in: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ticket = Ticket(
        title=ticket_in.title,
        description=ticket_in.description,
        priority=ticket_in.priority,
        category=ticket_in.category,
        created_by=current_user.id,
        status=TicketStatus.PENDING,
    )
    ticket.sla_deadline = _get_sla_deadline(ticket.priority, datetime.utcnow())

    db.add(ticket)
    await db.flush()

    await _add_timeline(db, ticket.id, "created", "工单已创建", current_user.id)

    await db.commit()
    await db.refresh(ticket)

    try:
        from app.celery_worker import analyze_ticket_similarity
        analyze_ticket_similarity.delay(ticket.id)
    except Exception:
        pass

    return ticket


@router.get("", response_model=TicketListResponse)
async def list_tickets(
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    assigned_to: Optional[int] = None,
    created_by: Optional[int] = None,
    category: Optional[str] = None,
    has_overdue_risk: Optional[bool] = None,
    is_duplicate: Optional[bool] = None,
    keyword: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Ticket)
    conditions = []

    if status:
        conditions.append(Ticket.status == status)
    if priority:
        conditions.append(Ticket.priority == priority)
    if assigned_to:
        conditions.append(Ticket.assigned_to == assigned_to)
    if created_by:
        conditions.append(Ticket.created_by == created_by)
    if category:
        conditions.append(Ticket.category == category)
    if has_overdue_risk is not None:
        conditions.append(Ticket.has_overdue_risk == has_overdue_risk)
    if is_duplicate is not None:
        conditions.append(Ticket.is_duplicate == is_duplicate)
    if keyword:
        conditions.append(or_(
            Ticket.title.ilike(f"%{keyword}%"),
            Ticket.description.ilike(f"%{keyword}%")
        ))

    if current_user.role == RoleEnum.CUSTOMER:
        conditions.append(Ticket.created_by == current_user.id)
    elif current_user.role == RoleEnum.AGENT:
        conditions.append(or_(
            Ticket.assigned_to == current_user.id,
            Ticket.created_by == current_user.id
        ))

    if conditions:
        query = query.where(and_(*conditions))

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.order_by(Ticket.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    tickets = result.scalars().all()

    return TicketListResponse(
        items=[TicketResponse.model_validate(t) for t in tickets],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{ticket_id}", response_model=TicketDetailResponse)
async def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.orm import selectinload

    query = select(Ticket).options(
        selectinload(Ticket.requester),
        selectinload(Ticket.assigned_agent),
        selectinload(Ticket.attachments),
        selectinload(Ticket.notes),
        selectinload(Ticket.timeline_events)
    ).where(Ticket.id == ticket_id)

    result = await db.execute(query)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == RoleEnum.CUSTOMER and ticket.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return ticket


@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: int,
    ticket_in: TicketUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == RoleEnum.CUSTOMER and ticket.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    old_status = ticket.status
    update_data = ticket_in.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] != old_status:
        if update_data["status"] == TicketStatus.PROCESSING and ticket.first_response_at is None:
            ticket.first_response_at = datetime.utcnow()
            ticket.response_time_seconds = int(
                (ticket.first_response_at - ticket.created_at).total_seconds()
            )
        if update_data["status"] == TicketStatus.RESOLVED and ticket.resolved_at is None:
            ticket.resolved_at = datetime.utcnow()
            ticket.resolution_time_seconds = int(
                (ticket.resolved_at - ticket.created_at).total_seconds()
            )

    for field, value in update_data.items():
        setattr(ticket, field, value)

    if "priority" in update_data:
        ticket.sla_deadline = _get_sla_deadline(ticket.priority, ticket.created_at)

    await _add_timeline(
        db, ticket.id, "updated",
        f"工单已更新: {', '.join(update_data.keys())}",
        current_user.id,
        update_data
    )

    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/notes", response_model=TicketNoteResponse)
async def add_note(
    ticket_id: int,
    note_in: TicketNoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    note = TicketNote(
        ticket_id=ticket_id,
        content=note_in.content,
        created_by=current_user.id,
        is_internal=note_in.is_internal
    )
    db.add(note)
    await db.flush()

    await _add_timeline(
        db, ticket_id, "note_added",
        f"{'内部' if note_in.is_internal else '公开'}备注已添加",
        current_user.id
    )

    await db.commit()
    await db.refresh(note)
    return note


@router.post("/{ticket_id}/attachments", response_model=AttachmentResponse)
async def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    stored_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    with open(file_path, "wb") as f:
        f.write(content)

    attachment = Attachment(
        ticket_id=ticket_id,
        filename=stored_filename,
        original_filename=file.filename or stored_filename,
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type,
        uploaded_by=current_user.id
    )
    db.add(attachment)

    await _add_timeline(
        db, ticket_id, "attachment_added",
        f"附件已上传: {file.filename}",
        current_user.id
    )

    await db.commit()
    await db.refresh(attachment)
    return attachment


@router.get("/{ticket_id}/attachments/{attachment_id}/download")
async def download_attachment(
    ticket_id: int,
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Attachment).where(
            Attachment.id == attachment_id,
            Attachment.ticket_id == ticket_id
        )
    )
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        attachment.file_path,
        media_type=attachment.mime_type,
        filename=attachment.original_filename
    )


@router.get("/{ticket_id}/similar", response_model=list[TicketSimilarityResponse])
async def get_similar_tickets(
    ticket_id: int,
    threshold: float = 0.5,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TicketSimilarity).where(
            TicketSimilarity.ticket_id == ticket_id,
            TicketSimilarity.similarity_score >= threshold
        ).order_by(TicketSimilarity.similarity_score.desc()).limit(10)
    )
    similarities = result.scalars().all()

    response = []
    for sim in similarities:
        sim_result = await db.execute(
            select(Ticket.title).where(Ticket.id == sim.similar_ticket_id)
        )
        ticket_title = sim_result.scalar_one_or_none()
        resp = TicketSimilarityResponse(
            ticket_id=sim.ticket_id,
            similar_ticket_id=sim.similar_ticket_id,
            similarity_score=sim.similarity_score,
            ticket_title=ticket_title,
            calculated_at=sim.calculated_at
        )
        response.append(resp)

    return response


@router.post("/{ticket_id}/mark-duplicate")
async def mark_as_duplicate(
    ticket_id: int,
    duplicate_of_id: int,
    current_user: User = Depends(RoleChecker([RoleEnum.ADMIN, RoleEnum.SUPERVISOR, RoleEnum.AGENT])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    result = await db.execute(select(Ticket).where(Ticket.id == duplicate_of_id))
    original = result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Original ticket not found")

    ticket.is_duplicate = True
    ticket.duplicate_of_ticket_id = duplicate_of_id
    ticket.status = TicketStatus.CLOSED

    await _add_timeline(
        db, ticket_id, "marked_duplicate",
        f"标记为重复工单 #{duplicate_of_id}",
        current_user.id
    )

    await db.commit()
    return {"message": "Ticket marked as duplicate"}
