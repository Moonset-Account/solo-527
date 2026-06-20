from __future__ import annotations
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.templating import templates
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse, ReminderVersionResponse
from app.services.reminder import ReminderService, ReminderVersionService

router = APIRouter(prefix="/reminders")


@router.get("/")
async def reminder_list_page(request: Request, db: AsyncSession = Depends(get_db)):
    return templates.TemplateResponse("reminders/index.html", {"request": request})


@router.get("/api/", response_model=list[ReminderResponse])
async def list_reminders(reminder_type: str | None = None, page: int = 1, size: int = 20, db: AsyncSession = Depends(get_db)):
    offset = (page - 1) * size
    svc = ReminderService(db)
    reminders = await svc.list(reminder_type=reminder_type, offset=offset, limit=size)
    return reminders


@router.post("/api/", response_model=ReminderResponse, status_code=201)
async def create_reminder(data: ReminderCreate, db: AsyncSession = Depends(get_db)):
    svc = ReminderService(db)
    reminder = await svc.create(**data.model_dump())
    await db.commit()
    await db.refresh(reminder)
    return reminder


@router.put("/api/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(reminder_id: str, data: ReminderUpdate, db: AsyncSession = Depends(get_db)):
    svc = ReminderService(db)
    reminder = await svc.update(reminder_id, **data.model_dump(exclude_unset=True))
    await db.commit()
    return reminder


@router.post("/api/{reminder_id}/toggle", response_model=ReminderResponse)
async def toggle_reminder(reminder_id: str, db: AsyncSession = Depends(get_db)):
    svc = ReminderService(db)
    reminder = await svc.toggle_active(reminder_id)
    await db.commit()
    return reminder


@router.get("/api/{reminder_id}/versions", response_model=list[ReminderVersionResponse])
async def list_reminder_versions(reminder_id: str, db: AsyncSession = Depends(get_db)):
    svc = ReminderVersionService(db)
    versions = await svc.list_by_reminder(reminder_id)
    return versions


@router.post("/api/{reminder_id}/rollback/{version_id}", response_model=ReminderResponse)
async def rollback_reminder(reminder_id: str, version_id: str, db: AsyncSession = Depends(get_db)):
    svc = ReminderService(db)
    reminder = await svc.rollback(reminder_id, version_id)
    await db.commit()
    return reminder


@router.get("/api/pending", response_model=list[ReminderResponse])
async def pending_reminders(db: AsyncSession = Depends(get_db)):
    svc = ReminderService(db)
    reminders = await svc.get_pending()
    return reminders
