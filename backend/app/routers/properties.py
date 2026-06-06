from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.exceptions import BusinessException
from app.models import Property, PropertyStatus, User, UserRole
from app.schemas.property import PropertyCreate, PropertyUpdate, PropertyResponse
from app.schemas.common import ApiResponse, PaginatedResponse
from app.core.logging import logger

router = APIRouter(prefix="/api/properties", tags=["房源管理"])


@router.get("", response_model=PaginatedResponse[PropertyResponse])
def get_properties(
    community: Optional[str] = None,
    status: Optional[PropertyStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Property)
    if community:
        query = query.filter(Property.community == community)
    if status:
        query = query.filter(Property.status == status)

    total = query.count()
    properties = query.order_by(Property.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        data=[PropertyResponse.model_validate(p) for p in properties],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/communities", response_model=ApiResponse[List[str]])
def get_communities(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    communities = db.query(Property.community).distinct().all()
    return ApiResponse(data=[c[0] for c in communities])


@router.get("/{property_id}", response_model=ApiResponse[PropertyResponse])
def get_property(
    property_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise BusinessException("房源不存在")
    return ApiResponse(data=PropertyResponse.model_validate(property_obj))


@router.post("", response_model=ApiResponse[PropertyResponse])
def create_property(
    property_in: PropertyCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限创建房源", code=403)

    property_obj = Property(**property_in.model_dump())
    db.add(property_obj)
    db.commit()
    db.refresh(property_obj)
    logger.info(f"Property {property_obj.name} created by {current_user.username}")
    return ApiResponse(data=PropertyResponse.model_validate(property_obj))


@router.put("/{property_id}", response_model=ApiResponse[PropertyResponse])
def update_property(
    property_id: int,
    property_in: PropertyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限修改房源", code=403)

    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise BusinessException("房源不存在")

    update_data = property_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(property_obj, field, value)

    db.commit()
    db.refresh(property_obj)
    logger.info(f"Property {property_obj.name} updated by {current_user.username}")
    return ApiResponse(data=PropertyResponse.model_validate(property_obj))


@router.delete("/{property_id}", response_model=ApiResponse)
def delete_property(
    property_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.ADMIN:
        raise BusinessException("无权限删除房源", code=403)

    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise BusinessException("房源不存在")

    property_obj.status = PropertyStatus.INACTIVE
    db.commit()
    logger.info(f"Property {property_obj.name} deactivated by {current_user.username}")
    return ApiResponse(message="房源已停用")
