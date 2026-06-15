import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.auth import get_current_user_from_request
from app.database import get_db
from app.models.event import Event, EventFlow, EventPhoto, FacilityStatus
from app.models.user import User
from app.services.event_service import EventService
from app.tasks.duplicate_detect import _detect_duplicate

router = APIRouter(prefix="/events", tags=["events"])


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    event_type: str
    lng: float | None = None
    lat: float | None = None
    address: str | None = None
    photos: list[str] | None = None


class AssignRequest(BaseModel):
    assignee_id: int
    deadline: str | None = None


class RectifyRequest(BaseModel):
    comment: str | None = None


class ReviewRequest(BaseModel):
    action: str
    comment: str | None = None


@router.get("")
async def list_events(
    status: str | None = None,
    event_type: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    svc = EventService(db)
    return await svc.list_events(
        status=status, event_type=event_type, search=search, page=page, page_size=page_size
    )


@router.post("")
async def create_event(
    data: EventCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user_from_request(request, db)
    svc = EventService(db)
    event_id = await svc.create_event(data, user.id)

    if data.photos:
        for url in data.photos:
            photo = EventPhoto(event_id=event_id, url=url, tag=data.event_type)
            db.add(photo)
        await db.commit()

    try:
        await _detect_duplicate(event_id)
    except Exception:
        pass

    result = await svc.get_event_detail(event_id)
    return result


@router.get("/stats")
async def event_stats(db: AsyncSession = Depends(get_db)):
    svc = EventService(db)
    return await svc.get_stats()


@router.get("/users/list")
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.id))
    users = result.scalars().all()
    return [{"id": u.id, "name": u.name, "role": u.role, "username": u.username} for u in users]


@router.get("/facilities")
async def list_facilities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FacilityStatus).order_by(FacilityStatus.id.desc()))
    facilities = result.scalars().all()
    return [
        {
            "id": f.id,
            "facility_code": f.facility_code,
            "facility_name": f.facility_name,
            "is_intact": f.is_intact,
            "checked_at": f.checked_at.isoformat() if f.checked_at else None,
        }
        for f in facilities
    ]


@router.get("/{event_id}")
async def get_event(event_id: int, db: AsyncSession = Depends(get_db)):
    svc = EventService(db)
    event = await svc.get_event_detail(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.put("/{event_id}/assign")
async def assign_event(
    event_id: int,
    data: AssignRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user_from_request(request, db)
    svc = EventService(db)
    return await svc.assign_event(event_id, data.assignee_id, user.id, data.deadline)


@router.put("/{event_id}/rectify")
async def rectify_event(
    event_id: int,
    data: RectifyRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user_from_request(request, db)
    svc = EventService(db)
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status in ("pending", "assigned"):
        new_status = "rectifying"
        flow_action = "rectifying"
    elif event.status == "rectifying":
        new_status = "reviewing"
        flow_action = "reviewed"
    else:
        flow_action = event.status
        new_status = event.status

    event.status = new_status
    flow = EventFlow(
        event_id=event_id,
        action=flow_action,
        operator_id=user.id,
        comment=data.comment,
    )
    db.add(flow)
    await db.commit()
    await db.refresh(event)
    return {"id": event.id, "status": event.status}


@router.put("/{event_id}/review")
async def review_event(
    event_id: int,
    data: ReviewRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    user = await get_current_user_from_request(request, db)
    svc = EventService(db)
    return await svc.review_event(event_id, user.id, data.action, data.comment)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    upload_dir = "./uploads"
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "file")[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    return {"url": f"/uploads/{filename}"}


@router.get("/{event_id}/flow-logs")
async def event_flow_logs(event_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EventFlow).where(EventFlow.event_id == event_id).order_by(EventFlow.created_at)
    )
    flows = result.scalars().all()
    return [
        {
            "id": f.id,
            "event_id": f.event_id,
            "action": f.action,
            "operator_id": f.operator_id,
            "comment": f.comment,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in flows
    ]
