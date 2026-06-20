from __future__ import annotations
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.templating import templates
from app.schemas.dictionary import DictionaryCreate, DictionaryUpdate, DictionaryResponse, DictionaryVersionResponse
from app.services.dictionary import DictionaryService, DictionaryVersionService

router = APIRouter(prefix="/dictionaries")


@router.get("/")
async def dictionary_list_page(request: Request, db: AsyncSession = Depends(get_db)):
    return templates.TemplateResponse("dictionaries/index.html", {"request": request})


@router.get("/api/", response_model=list[DictionaryResponse])
async def list_dictionaries(dict_type: str | None = None, db: AsyncSession = Depends(get_db)):
    svc = DictionaryService(db)
    if dict_type:
        entries = await svc.list_by_type(dict_type)
    else:
        entries = []
    return entries


@router.post("/api/", response_model=DictionaryResponse, status_code=201)
async def create_dictionary(data: DictionaryCreate, db: AsyncSession = Depends(get_db)):
    svc = DictionaryService(db)
    entry = await svc.create(**data.model_dump())
    await db.commit()
    await db.refresh(entry)
    return entry


@router.put("/api/{dict_id}", response_model=DictionaryResponse)
async def update_dictionary(dict_id: str, data: DictionaryUpdate, db: AsyncSession = Depends(get_db)):
    svc = DictionaryService(db)
    entry = await svc.update(dict_id, **data.model_dump(exclude_unset=True))
    await db.commit()
    return entry


@router.post("/api/{dict_id}/toggle", response_model=DictionaryResponse)
async def toggle_dictionary(dict_id: str, db: AsyncSession = Depends(get_db)):
    svc = DictionaryService(db)
    entry = await svc.toggle_active(dict_id)
    await db.commit()
    return entry


@router.get("/api/{dict_id}/versions", response_model=list[DictionaryVersionResponse])
async def list_dictionary_versions(dict_id: str, db: AsyncSession = Depends(get_db)):
    svc = DictionaryVersionService(db)
    versions = await svc.list_by_dictionary(dict_id)
    return versions


@router.post("/api/{dict_id}/rollback/{version_id}", response_model=DictionaryResponse)
async def rollback_dictionary(dict_id: str, version_id: str, db: AsyncSession = Depends(get_db)):
    svc = DictionaryService(db)
    entry = await svc.rollback(dict_id, version_id)
    await db.commit()
    return entry
