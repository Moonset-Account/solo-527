from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.exceptions import BusinessException
from app.models import RoomStatus, RoomStatusType, User, UserRole, Property
from app.schemas.room_status import (
    RoomStatusCreate, RoomStatusUpdate, RoomStatusResponse,
    RoomStatusCalendarQuery, CheckInVerifyRequest
)
from app.schemas.common import ApiResponse
from app.services.task_service import TaskService
from app.core.logging import logger

router = APIRouter(prefix="/api/room-statuses", tags=["房态管理"])


@router.get("/calendar", response_model=ApiResponse[List[RoomStatusResponse]])
def get_room_status_calendar(
    start_date: date = Query(...),
    end_date: date = Query(...),
    community: Optional[str] = None,
    property_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(RoomStatus).filter(
        RoomStatus.date.between(start_date, end_date)
    )

    if property_id:
        query = query.filter(RoomStatus.property_id == property_id)
    elif community:
        property_ids = [p.id for p in db.query(Property.id).filter(Property.community == community).all()]
        if property_ids:
            query = query.filter(RoomStatus.property_id.in_(property_ids))

    room_statuses = query.order_by(RoomStatus.property_id, RoomStatus.date).all()
    return ApiResponse(data=[RoomStatusResponse.model_validate(rs) for rs in room_statuses])


@router.get("/{property_id}/{date_str}", response_model=ApiResponse[RoomStatusResponse])
def get_room_status(
    property_id: int,
    date_str: date,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    room_status = db.query(RoomStatus).filter(
        RoomStatus.property_id == property_id,
        RoomStatus.date == date_str
    ).first()
    if not room_status:
        room_status = RoomStatus(
            property_id=property_id,
            date=date_str,
            status=RoomStatusType.AVAILABLE
        )
        db.add(room_status)
        db.commit()
        db.refresh(room_status)
    return ApiResponse(data=RoomStatusResponse.model_validate(room_status))


@router.post("", response_model=ApiResponse[RoomStatusResponse])
def create_or_update_room_status(
    room_status_in: RoomStatusCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限操作", code=403)

    existing = db.query(RoomStatus).filter(
        RoomStatus.property_id == room_status_in.property_id,
        RoomStatus.date == room_status_in.date
    ).first()

    if existing:
        for field, value in room_status_in.model_dump().items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        logger.info(f"Room status updated for property {room_status_in.property_id} on {room_status_in.date}")
        return ApiResponse(data=RoomStatusResponse.model_validate(existing))

    room_status = RoomStatus(**room_status_in.model_dump())
    db.add(room_status)
    db.commit()
    db.refresh(room_status)
    logger.info(f"Room status created for property {room_status_in.property_id} on {room_status_in.date}")
    return ApiResponse(data=RoomStatusResponse.model_validate(room_status))


@router.put("/{room_status_id}", response_model=ApiResponse[RoomStatusResponse])
def update_room_status(
    room_status_id: int,
    room_status_in: RoomStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限操作", code=403)

    room_status = db.query(RoomStatus).filter(RoomStatus.id == room_status_id).first()
    if not room_status:
        raise BusinessException("房态记录不存在")

    update_data = room_status_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(room_status, field, value)

    db.commit()
    db.refresh(room_status)
    return ApiResponse(data=RoomStatusResponse.model_validate(room_status))


@router.post("/check-can-check-in", response_model=ApiResponse[dict])
def check_can_check_in(
    request: CheckInVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    can_check_in = TaskService.can_check_in(db, request.property_id, request.date)
    return ApiResponse(data={"can_check_in": can_check_in})
