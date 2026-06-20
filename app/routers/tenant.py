from __future__ import annotations
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.templating import templates
from app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse, FeatureFlagCreate, FeatureFlagUpdate, FeatureFlagResponse
from app.services.tenant import TenantService, FeatureFlagService

router = APIRouter(prefix="/tenants")


@router.get("/")
async def tenant_list_page(request: Request, db: AsyncSession = Depends(get_db)):
    return templates.TemplateResponse("tenants/index.html", {"request": request})


@router.get("/api/", response_model=list[TenantResponse])
async def list_tenants(page: int = 1, size: int = 20, db: AsyncSession = Depends(get_db)):
    offset = (page - 1) * size
    svc = TenantService(db)
    tenants = await svc.list_tenants(offset=offset, limit=size)
    return tenants


@router.post("/api/", response_model=TenantResponse, status_code=201)
async def create_tenant(data: TenantCreate, db: AsyncSession = Depends(get_db)):
    svc = TenantService(db)
    tenant = await svc.create(**data.model_dump())
    await db.commit()
    await db.refresh(tenant)
    return tenant


@router.put("/api/{tenant_id}", response_model=TenantResponse)
async def update_tenant(tenant_id: str, data: TenantUpdate, db: AsyncSession = Depends(get_db)):
    svc = TenantService(db)
    tenant = await svc.update(tenant_id, **data.model_dump(exclude_unset=True))
    await db.commit()
    return tenant


@router.post("/api/{tenant_id}/toggle", response_model=TenantResponse)
async def toggle_tenant(tenant_id: str, db: AsyncSession = Depends(get_db)):
    svc = TenantService(db)
    tenant = await svc.toggle_active(tenant_id)
    await db.commit()
    return tenant


@router.get("/{tenant_id}/feature-flags")
async def feature_flags_partial(request: Request, tenant_id: str, db: AsyncSession = Depends(get_db)):
    svc = FeatureFlagService(db)
    flags = await svc.list_by_tenant(tenant_id)
    return templates.TemplateResponse("tenants/feature_flags.html", {"request": request, "flags": flags, "tenant_id": tenant_id})


@router.post("/api/{tenant_id}/feature-flags", response_model=FeatureFlagResponse, status_code=201)
async def create_feature_flag(tenant_id: str, data: FeatureFlagCreate, db: AsyncSession = Depends(get_db)):
    svc = FeatureFlagService(db)
    payload = data.model_dump()
    payload["tenant_id"] = tenant_id
    flag = await svc.create(**payload)
    await db.commit()
    await db.refresh(flag)
    return flag


@router.put("/api/feature-flags/{flag_id}", response_model=FeatureFlagResponse)
async def update_feature_flag(flag_id: str, data: FeatureFlagUpdate, db: AsyncSession = Depends(get_db)):
    svc = FeatureFlagService(db)
    flag = await svc.update(flag_id, **data.model_dump(exclude_unset=True))
    await db.commit()
    return flag


@router.post("/api/feature-flags/{flag_id}/toggle", response_model=FeatureFlagResponse)
async def toggle_feature_flag(flag_id: str, db: AsyncSession = Depends(get_db)):
    svc = FeatureFlagService(db)
    flag = await svc.toggle(flag_id)
    await db.commit()
    return flag
