import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.reminder import (
    ReminderCreate,
    ReminderListResponse,
    ReminderResponse,
    ReminderUpdate,
)
from app.services.reminder_service import ReminderService

router = APIRouter(prefix="/reminders", tags=["Reminders"])


class EscalateRequest(BaseModel):
    escalated_to: str


@router.get("/", response_model=ReminderListResponse)
async def list_reminders(
    assigned_to: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = ReminderService(db)
    return await service.list_reminders(
        assigned_to=assigned_to,
        status=status,
        type=type,
        page=page,
        page_size=page_size,
    )


@router.get("/{reminder_id}", response_model=ReminderResponse)
async def get_reminder(reminder_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = ReminderService(db)
    reminder = await service.get_reminder(reminder_id)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder


@router.post("/", response_model=ReminderResponse, status_code=201)
async def create_reminder(data: ReminderCreate, db: AsyncSession = Depends(get_db)):
    service = ReminderService(db)
    return await service.create_reminder(data)


@router.put("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(reminder_id: uuid.UUID, data: ReminderUpdate, db: AsyncSession = Depends(get_db)):
    service = ReminderService(db)
    reminder = await service.update_reminder(reminder_id, data)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder


@router.post("/{reminder_id}/escalate", response_model=ReminderResponse)
async def escalate_reminder(reminder_id: uuid.UUID, data: EscalateRequest, db: AsyncSession = Depends(get_db)):
    service = ReminderService(db)
    reminder = await service.escalate_reminder(reminder_id, data.escalated_to)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder
