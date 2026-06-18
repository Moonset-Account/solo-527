from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Form, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.templating import Jinja2Templates

from app.database import get_db
from app.models import Reminder, ReminderVersion

templates = Jinja2Templates(directory="app/templates")

router = APIRouter(prefix="/reminders", tags=["reminders"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/")
async def reminder_list(request: Request, db: DbSession, target_role: str | None = Query(None)):
    stmt = select(Reminder).order_by(Reminder.created_at.desc())
    if target_role:
        stmt = stmt.where(Reminder.target_role == target_role)
    result = await db.execute(stmt)
    reminders = list(result.scalars().all())
    return templates.TemplateResponse(
        "reminders.html", {"request": request, "reminders": reminders, "filter_role": target_role}
    )


@router.post("/")
async def create_reminder(
    request: Request,
    db: DbSession,
    title: str = Form(...),
    content: str = Form(...),
    reminder_type: str = Form(...),
    severity: str = Form("info"),
    target_role: str = Form(...),
    created_by: str = Form(...),
    station_id: UUID = Form(None),
):
    reminder = Reminder(
        title=title,
        content=content,
        reminder_type=reminder_type,
        severity=severity,
        target_role=target_role,
        created_by=created_by,
        station_id=station_id,
    )
    db.add(reminder)
    await db.flush()
    await db.refresh(reminder)
    await db.commit()
    return templates.TemplateResponse(
        "partials/reminder_row.html", {"request": request, "reminder": reminder}
    )


@router.put("/{reminder_id}")
async def update_reminder(
    request: Request,
    db: DbSession,
    reminder_id: UUID,
    title: str = Form(None),
    content: str = Form(None),
    severity: str = Form(None),
    changed_by: str = Form(...),
    change_reason: str = Form(None),
):
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
    reminder = result.scalar_one_or_none()
    if reminder is None:
        return templates.TemplateResponse(
            "partials/error.html", {"request": request, "message": "Reminder not found"}, status_code=404
        )

    version_record = ReminderVersion(
        reminder_id=reminder.id,
        version=reminder.version,
        title=reminder.title,
        content=reminder.content,
        changed_by=changed_by,
        change_reason=change_reason,
    )
    db.add(version_record)

    if title is not None:
        reminder.title = title
    if content is not None:
        reminder.content = content
    if severity is not None:
        reminder.severity = severity
    reminder.version = (reminder.version or 0) + 1

    await db.flush()
    await db.refresh(reminder)
    await db.commit()
    return templates.TemplateResponse(
        "partials/reminder_row.html", {"request": request, "reminder": reminder}
    )


@router.post("/{reminder_id}/read")
async def mark_as_read(request: Request, db: DbSession, reminder_id: UUID):
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
    reminder = result.scalar_one_or_none()
    if reminder is None:
        return templates.TemplateResponse(
            "partials/error.html", {"request": request, "message": "Reminder not found"}, status_code=404
        )
    reminder.is_read = True
    await db.flush()
    await db.refresh(reminder)
    await db.commit()
    return templates.TemplateResponse(
        "partials/reminder_row.html", {"request": request, "reminder": reminder}
    )


@router.post("/{reminder_id}/rollback")
async def rollback_reminder(
    request: Request,
    db: DbSession,
    reminder_id: UUID,
    target_version: int = Form(...),
):
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
    reminder = result.scalar_one_or_none()
    if reminder is None:
        return templates.TemplateResponse(
            "partials/error.html", {"request": request, "message": "Reminder not found"}, status_code=404
        )

    version_stmt = select(ReminderVersion).where(
        ReminderVersion.reminder_id == reminder_id,
        ReminderVersion.version == target_version,
    )
    version_result = await db.execute(version_stmt)
    version_record = version_result.scalar_one_or_none()
    if version_record is None:
        return templates.TemplateResponse(
            "partials/error.html", {"request": request, "message": "Version not found"}, status_code=404
        )

    reminder.title = version_record.title
    reminder.content = version_record.content
    reminder.version = target_version

    await db.flush()
    await db.refresh(reminder)
    await db.commit()
    return templates.TemplateResponse(
        "partials/reminder_row.html", {"request": request, "reminder": reminder}
    )


@router.get("/{reminder_id}/versions")
async def reminder_versions(request: Request, db: DbSession, reminder_id: UUID):
    stmt = (
        select(ReminderVersion)
        .where(ReminderVersion.reminder_id == reminder_id)
        .order_by(ReminderVersion.version.desc())
    )
    result = await db.execute(stmt)
    versions = list(result.scalars().all())
    return templates.TemplateResponse(
        "partials/version_history.html", {"request": request, "versions": versions}
    )


@router.get("/api/", tags=["api"])
async def api_reminder_list(db: DbSession, target_role: str | None = Query(None)):
    stmt = select(Reminder).order_by(Reminder.created_at.desc())
    if target_role:
        stmt = stmt.where(Reminder.target_role == target_role)
    result = await db.execute(stmt)
    reminders = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "station_id": str(r.station_id) if r.station_id else None,
            "title": r.title,
            "content": r.content,
            "reminder_type": r.reminder_type,
            "severity": r.severity,
            "is_read": r.is_read,
            "version": r.version,
            "target_role": r.target_role,
            "created_by": r.created_by,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in reminders
    ]
