from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.lease import (
    PropertyCreate, PropertyUpdate, PropertyResponse, PropertyQuery,
    OwnerCreate, OwnerUpdate, OwnerResponse, OwnerQuery,
    TenantCreate, TenantUpdate, TenantResponse, TenantQuery,
)
from app.schemas.common import PageResult, ResponseModel
from app.api.deps import get_current_user, require_permission
from app.services import PropertyService, OwnerService, TenantService

router = APIRouter(tags=["基础数据"])


@router.get("/properties", response_model=ResponseModel[PageResult])
def list_properties(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    property_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:view")),
):
    query = PropertyQuery(page=page, page_size=page_size, keyword=keyword, property_type=property_type, status=status)
    result = PropertyService.list(db, query)
    items = [PropertyResponse.model_validate(p) for p in result.items]
    return ResponseModel(
        data=PageResult(total=result.total, page=result.page, page_size=result.page_size, items=items)
    )


@router.post("/properties", response_model=ResponseModel[PropertyResponse])
def create_property(
    data: PropertyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:manage")),
):
    property_obj = PropertyService.create(db, data, created_by=current_user.id)
    return ResponseModel(data=PropertyResponse.model_validate(property_obj))


@router.get("/properties/{property_id}", response_model=ResponseModel[PropertyResponse])
def get_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:view")),
):
    property_obj = PropertyService.get(db, property_id)
    if not property_obj:
        raise HTTPException(status_code=404, detail="房源不存在")
    return ResponseModel(data=PropertyResponse.model_validate(property_obj))


@router.put("/properties/{property_id}", response_model=ResponseModel[PropertyResponse])
def update_property(
    property_id: int,
    data: PropertyUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:manage")),
):
    property_obj = PropertyService.update(db, property_id, data, updated_by=current_user.id)
    if not property_obj:
        raise HTTPException(status_code=404, detail="房源不存在")
    return ResponseModel(data=PropertyResponse.model_validate(property_obj))


@router.delete("/properties/{property_id}")
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:manage")),
):
    if not PropertyService.delete(db, property_id, updated_by=current_user.id):
        raise HTTPException(status_code=404, detail="房源不存在")
    return ResponseModel(message="删除成功")


@router.get("/owners", response_model=ResponseModel[PageResult])
def list_owners(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:view")),
):
    query = OwnerQuery(page=page, page_size=page_size, keyword=keyword)
    result = OwnerService.list(db, query)
    items = [OwnerResponse.model_validate(o) for o in result.items]
    return ResponseModel(
        data=PageResult(total=result.total, page=result.page, page_size=result.page_size, items=items)
    )


@router.post("/owners", response_model=ResponseModel[OwnerResponse])
def create_owner(
    data: OwnerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:manage")),
):
    owner = OwnerService.create(db, data, created_by=current_user.id)
    return ResponseModel(data=OwnerResponse.model_validate(owner))


@router.get("/owners/{owner_id}", response_model=ResponseModel[OwnerResponse])
def get_owner(
    owner_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:view")),
):
    owner = OwnerService.get(db, owner_id)
    if not owner:
        raise HTTPException(status_code=404, detail="业主不存在")
    return ResponseModel(data=OwnerResponse.model_validate(owner))


@router.put("/owners/{owner_id}", response_model=ResponseModel[OwnerResponse])
def update_owner(
    owner_id: int,
    data: OwnerUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:manage")),
):
    owner = OwnerService.update(db, owner_id, data, updated_by=current_user.id)
    if not owner:
        raise HTTPException(status_code=404, detail="业主不存在")
    return ResponseModel(data=OwnerResponse.model_validate(owner))


@router.delete("/owners/{owner_id}")
def delete_owner(
    owner_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:manage")),
):
    if not OwnerService.delete(db, owner_id, updated_by=current_user.id):
        raise HTTPException(status_code=404, detail="业主不存在")
    return ResponseModel(message="删除成功")


@router.get("/tenants", response_model=ResponseModel[PageResult])
def list_tenants(
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None,
    industry: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:view")),
):
    query = TenantQuery(page=page, page_size=page_size, keyword=keyword, industry=industry)
    result = TenantService.list(db, query)
    items = [TenantResponse.model_validate(t) for t in result.items]
    return ResponseModel(
        data=PageResult(total=result.total, page=result.page, page_size=result.page_size, items=items)
    )


@router.post("/tenants", response_model=ResponseModel[TenantResponse])
def create_tenant(
    data: TenantCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:manage")),
):
    tenant = TenantService.create(db, data, created_by=current_user.id)
    return ResponseModel(data=TenantResponse.model_validate(tenant))


@router.get("/tenants/{tenant_id}", response_model=ResponseModel[TenantResponse])
def get_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:view")),
):
    tenant = TenantService.get(db, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="租客不存在")
    return ResponseModel(data=TenantResponse.model_validate(tenant))


@router.put("/tenants/{tenant_id}", response_model=ResponseModel[TenantResponse])
def update_tenant(
    tenant_id: int,
    data: TenantUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:manage")),
):
    tenant = TenantService.update(db, tenant_id, data, updated_by=current_user.id)
    if not tenant:
        raise HTTPException(status_code=404, detail="租客不存在")
    return ResponseModel(data=TenantResponse.model_validate(tenant))


@router.delete("/tenants/{tenant_id}")
def delete_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("lease:manage")),
):
    if not TenantService.delete(db, tenant_id, updated_by=current_user.id):
        raise HTTPException(status_code=404, detail="租客不存在")
    return ResponseModel(message="删除成功")
