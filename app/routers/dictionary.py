from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Form, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.templating import Jinja2Templates

from app.database import get_db
from app.models import Dictionary, DictionaryVersion

templates = Jinja2Templates(directory="app/templates")

router = APIRouter(prefix="/dictionary", tags=["dictionary"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/")
async def dictionary_page(request: Request, db: DbSession, dict_code: str | None = Query(None)):
    stmt = select(Dictionary).where(Dictionary.is_active == True).order_by(Dictionary.dict_code, Dictionary.sort_order)
    if dict_code:
        stmt = stmt.where(Dictionary.dict_code == dict_code)
    result = await db.execute(stmt)
    entries = list(result.scalars().all())
    return templates.TemplateResponse(
        "dictionary.html", {"request": request, "entries": entries, "filter_code": dict_code}
    )


@router.post("/")
async def create_entry(
    request: Request,
    db: DbSession,
    dict_code: str = Form(...),
    dict_key: str = Form(...),
    dict_value: str = Form(...),
    label: str = Form(None),
    sort_order: int = Form(0),
):
    entry = Dictionary(
        dict_code=dict_code,
        dict_key=dict_key,
        dict_value=dict_value,
        label=label,
        sort_order=sort_order,
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    await db.commit()
    return templates.TemplateResponse(
        "partials/dictionary_row.html", {"request": request, "entry": entry}
    )


@router.put("/{dict_id}")
async def update_entry(
    request: Request,
    db: DbSession,
    dict_id: UUID,
    dict_value: str = Form(None),
    label: str = Form(None),
    sort_order: int = Form(None),
    changed_by: str = Form(...),
    change_reason: str = Form(None),
):
    result = await db.execute(select(Dictionary).where(Dictionary.id == dict_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        return templates.TemplateResponse(
            "partials/error.html", {"request": request, "message": "Entry not found"}, status_code=404
        )

    version_record = DictionaryVersion(
        dictionary_id=entry.id,
        version=entry.version,
        dict_value=entry.dict_value,
        label=entry.label,
        changed_by=changed_by,
        change_reason=change_reason,
    )
    db.add(version_record)

    if dict_value is not None:
        entry.dict_value = dict_value
    if label is not None:
        entry.label = label
    if sort_order is not None:
        entry.sort_order = sort_order
    entry.version = (entry.version or 0) + 1

    await db.flush()
    await db.refresh(entry)
    await db.commit()
    return templates.TemplateResponse(
        "partials/dictionary_row.html", {"request": request, "entry": entry}
    )


@router.post("/{dict_id}/rollback")
async def rollback_entry(
    request: Request,
    db: DbSession,
    dict_id: UUID,
    target_version: int = Form(...),
):
    result = await db.execute(select(Dictionary).where(Dictionary.id == dict_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        return templates.TemplateResponse(
            "partials/error.html", {"request": request, "message": "Entry not found"}, status_code=404
        )

    version_stmt = select(DictionaryVersion).where(
        DictionaryVersion.dictionary_id == dict_id,
        DictionaryVersion.version == target_version,
    )
    version_result = await db.execute(version_stmt)
    version_record = version_result.scalar_one_or_none()
    if version_record is None:
        return templates.TemplateResponse(
            "partials/error.html", {"request": request, "message": "Version not found"}, status_code=404
        )

    entry.dict_value = version_record.dict_value
    entry.label = version_record.label
    entry.version = target_version

    await db.flush()
    await db.refresh(entry)
    await db.commit()
    return templates.TemplateResponse(
        "partials/dictionary_row.html", {"request": request, "entry": entry}
    )


@router.get("/{dict_id}/versions")
async def entry_versions(request: Request, db: DbSession, dict_id: UUID):
    stmt = (
        select(DictionaryVersion)
        .where(DictionaryVersion.dictionary_id == dict_id)
        .order_by(DictionaryVersion.version.desc())
    )
    result = await db.execute(stmt)
    versions = list(result.scalars().all())
    return templates.TemplateResponse(
        "partials/version_history.html", {"request": request, "versions": versions}
    )


@router.get("/api/", tags=["api"])
async def api_dictionary_list(db: DbSession, dict_code: str | None = Query(None)):
    stmt = select(Dictionary).where(Dictionary.is_active == True).order_by(Dictionary.dict_code, Dictionary.sort_order)
    if dict_code:
        stmt = stmt.where(Dictionary.dict_code == dict_code)
    result = await db.execute(stmt)
    entries = result.scalars().all()
    return [
        {
            "id": str(e.id),
            "dict_code": e.dict_code,
            "dict_key": e.dict_key,
            "dict_value": e.dict_value,
            "label": e.label,
            "sort_order": e.sort_order,
            "version": e.version,
            "is_active": e.is_active,
        }
        for e in entries
    ]
