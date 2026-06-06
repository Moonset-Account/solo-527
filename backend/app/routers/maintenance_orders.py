from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.exceptions import BusinessException
from app.models import (
    MaintenanceOrder, MaintenanceOrderStatus, MaintenanceType, MaintenancePriority,
    User, UserRole, Property
)
from app.schemas.maintenance_order import (
    MaintenanceOrderCreate, MaintenanceOrderUpdate, MaintenanceOrderResponse,
    MaintenanceOrderAssign, MaintenanceOrderSubmit, MaintenanceOrderReview,
    MaintenanceOrderQuery
)
from app.schemas.common import ApiResponse, PaginatedResponse
from app.services.maintenance_service import MaintenanceService
from app.core.config import settings
from app.core.logging import logger

router = APIRouter(prefix="/api/maintenance-orders", tags=["维修工单"])


@router.get("", response_model=ApiResponse[PaginatedResponse[MaintenanceOrderResponse]])
def get_maintenance_orders(
    status: Optional[MaintenanceOrderStatus] = None,
    property_id: Optional[int] = None,
    technician_id: Optional[int] = None,
    maintenance_type: Optional[MaintenanceType] = None,
    priority: Optional[MaintenancePriority] = None,
    is_overdue: Optional[int] = None,
    community: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(MaintenanceOrder).join(Property)

    if current_user.role == UserRole.MAINTENANCE:
        query = query.filter(MaintenanceOrder.technician_id == current_user.id)

    if status:
        query = query.filter(MaintenanceOrder.status == status)
    if property_id:
        query = query.filter(MaintenanceOrder.property_id == property_id)
    if technician_id:
        query = query.filter(MaintenanceOrder.technician_id == technician_id)
    if maintenance_type:
        query = query.filter(MaintenanceOrder.maintenance_type == maintenance_type)
    if priority:
        query = query.filter(MaintenanceOrder.priority == priority)
    if is_overdue is not None:
        query = query.filter(MaintenanceOrder.is_overdue == is_overdue)
    if community:
        query = query.filter(Property.community == community)
    if start_date:
        query = query.filter(MaintenanceOrder.created_at >= start_date)
    if end_date:
        query = query.filter(MaintenanceOrder.created_at <= end_date)

    total = query.count()
    orders = query.order_by(MaintenanceOrder.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return ApiResponse(data=PaginatedResponse(
        data=[MaintenanceOrderResponse.model_validate(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size
    ))


@router.get("/{order_id}", response_model=ApiResponse[MaintenanceOrderResponse])
def get_maintenance_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    order = db.query(MaintenanceOrder).filter(MaintenanceOrder.id == order_id).first()
    if not order:
        raise BusinessException("维修工单不存在")
    if current_user.role == UserRole.MAINTENANCE and order.technician_id != current_user.id:
        raise BusinessException("无权限查看此工单", code=403)
    return ApiResponse(data=MaintenanceOrderResponse.model_validate(order))


@router.post("", response_model=ApiResponse[MaintenanceOrderResponse])
def create_maintenance_order(
    order_in: MaintenanceOrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限创建工单", code=403)

    property_obj = db.query(Property).filter(Property.id == order_in.property_id).first()
    if not property_obj:
        raise BusinessException("房源不存在")

    order_no = MaintenanceService.generate_order_no()
    deadline = order_in.deadline_time
    if not deadline and order_in.scheduled_time:
        deadline = order_in.scheduled_time + timedelta(minutes=settings.MAINTENANCE_TIMEOUT_MINUTES)

    order = MaintenanceOrder(
        order_no=order_no,
        property_id=order_in.property_id,
        created_by=current_user.id,
        status=MaintenanceOrderStatus.PENDING,
        maintenance_type=order_in.maintenance_type,
        priority=order_in.priority,
        scheduled_time=order_in.scheduled_time,
        deadline_time=deadline,
        estimated_cost=order_in.estimated_cost,
        title=order_in.title,
        description=order_in.description
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    logger.info(f"Maintenance order {order_no} created by {current_user.username}")
    return ApiResponse(data=MaintenanceOrderResponse.model_validate(order))


@router.post("/{order_id}/assign", response_model=ApiResponse[MaintenanceOrderResponse])
def assign_maintenance_order(
    order_id: int,
    assign_in: MaintenanceOrderAssign,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限分配工单", code=403)

    order = MaintenanceService.assign_maintenance_order(
        db, order_id, assign_in.technician_id, current_user.id, assign_in.scheduled_time
    )
    return ApiResponse(data=MaintenanceOrderResponse.model_validate(order))


@router.post("/{order_id}/start", response_model=ApiResponse[MaintenanceOrderResponse])
def start_maintenance_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    order = MaintenanceService.start_maintenance_order(db, order_id, current_user.id)
    return ApiResponse(data=MaintenanceOrderResponse.model_validate(order))


@router.post("/{order_id}/submit", response_model=ApiResponse[MaintenanceOrderResponse])
def submit_maintenance_order(
    order_id: int,
    submit_in: MaintenanceOrderSubmit,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    order = MaintenanceService.submit_maintenance_order(
        db, order_id, current_user.id, submit_in.solution, submit_in.actual_cost
    )
    return ApiResponse(data=MaintenanceOrderResponse.model_validate(order))


@router.post("/{order_id}/approve", response_model=ApiResponse[MaintenanceOrderResponse])
def approve_maintenance_order(
    order_id: int,
    review_in: MaintenanceOrderReview,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限验收", code=403)

    order = MaintenanceService.approve_maintenance_order(
        db, order_id, current_user.id, review_in.remarks
    )
    return ApiResponse(data=MaintenanceOrderResponse.model_validate(order))


@router.post("/{order_id}/reject", response_model=ApiResponse[MaintenanceOrderResponse])
def reject_maintenance_order(
    order_id: int,
    review_in: MaintenanceOrderReview,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限驳回", code=403)
    if not review_in.remarks:
        raise BusinessException("请填写驳回原因")

    order = MaintenanceService.reject_maintenance_order(
        db, order_id, current_user.id, review_in.remarks
    )
    return ApiResponse(data=MaintenanceOrderResponse.model_validate(order))


@router.post("/{order_id}/cancel", response_model=ApiResponse[MaintenanceOrderResponse])
def cancel_maintenance_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限取消", code=403)

    order = db.query(MaintenanceOrder).filter(MaintenanceOrder.id == order_id).first()
    if not order:
        raise BusinessException("维修工单不存在")
    if order.status in [MaintenanceOrderStatus.COMPLETED, MaintenanceOrderStatus.CANCELLED]:
        raise BusinessException("当前状态不可取消")

    order.status = MaintenanceOrderStatus.CANCELLED
    db.commit()
    db.refresh(order)
    logger.info(f"Maintenance order {order.order_no} cancelled by {current_user.username}")
    return ApiResponse(data=MaintenanceOrderResponse.model_validate(order))
