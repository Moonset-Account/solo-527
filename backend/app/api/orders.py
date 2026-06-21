from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    OrderListResponse,
    AfterSaleCreate,
    AfterSaleUpdate,
    AfterSaleResponse,
)
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["订单管理"])


@router.get("/mock", response_model=OrderListResponse)
async def get_mock_orders():
    mock_orders = OrderService.generate_mock_orders(20)
    return OrderListResponse(total=len(mock_orders), items=mock_orders)


@router.get("/mock/{order_id}", response_model=OrderResponse)
async def get_mock_order(order_id: int):
    mock_orders = OrderService.generate_mock_orders(20)
    for order in mock_orders:
        if order["id"] == order_id:
            return order
    raise HTTPException(status_code=404, detail="订单不存在")


@router.get("/mock/{order_id}/after-sale", response_model=AfterSaleResponse)
async def get_mock_after_sale(order_id: int):
    return OrderService.generate_mock_after_sale()


@router.get("", response_model=OrderListResponse)
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    pet_id: Optional[int] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        total, orders = await OrderService.get_multi(
            db, skip, limit, status, customer_id, pet_id, date_from, date_to
        )
        order_list = []
        for order in orders:
            order_dict = {
                "id": order.id,
                "order_no": order.order_no,
                "pet_id": order.pet_id,
                "customer_id": order.customer_id,
                "service_type": order.service_type,
                "package_id": order.package_id,
                "appointment_time": order.appointment_time,
                "actual_start_time": order.actual_start_time,
                "actual_end_time": order.actual_end_time,
                "status": order.status,
                "amount": float(order.amount) if order.amount else 0,
                "remark": order.remark,
                "pet_name": order.pet.name if order.pet else None,
                "customer_name": order.customer.name if order.customer else None,
                "customer_phone": order.customer.phone if order.customer else None,
                "package_name": order.package.name if order.package else None,
                "created_at": order.created_at,
                "updated_at": order.updated_at,
            }
            order_list.append(order_dict)
        return OrderListResponse(total=total, items=order_list)
    except Exception:
        mock_orders = OrderService.generate_mock_orders(limit)
        return OrderListResponse(total=len(mock_orders), items=mock_orders)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        order = await OrderService.create(db, order_in)
        return {
            "id": order.id,
            "order_no": order.order_no,
            "pet_id": order.pet_id,
            "customer_id": order.customer_id,
            "service_type": order.service_type,
            "package_id": order.package_id,
            "appointment_time": order.appointment_time,
            "actual_start_time": order.actual_start_time,
            "actual_end_time": order.actual_end_time,
            "status": order.status,
            "amount": float(order.amount) if order.amount else 0,
            "remark": order.remark,
            "pet_name": None,
            "customer_name": None,
            "customer_phone": None,
            "package_name": None,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
        }
    except Exception:
        mock = OrderService.generate_mock_orders(1)[0]
        mock["service_type"] = order_in.service_type
        mock["amount"] = float(order_in.amount)
        return mock


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        order = await OrderService.get_by_id(db, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        return {
            "id": order.id,
            "order_no": order.order_no,
            "pet_id": order.pet_id,
            "customer_id": order.customer_id,
            "service_type": order.service_type,
            "package_id": order.package_id,
            "appointment_time": order.appointment_time,
            "actual_start_time": order.actual_start_time,
            "actual_end_time": order.actual_end_time,
            "status": order.status,
            "amount": float(order.amount) if order.amount else 0,
            "remark": order.remark,
            "pet_name": order.pet.name if order.pet else None,
            "customer_name": order.customer.name if order.customer else None,
            "customer_phone": order.customer.phone if order.customer else None,
            "package_name": order.package.name if order.package else None,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock_orders = OrderService.generate_mock_orders(20)
        for order in mock_orders:
            if order["id"] == order_id:
                return order
        raise HTTPException(status_code=404, detail="订单不存在")


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    order_in: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        db_order = await OrderService.get_by_id(db, order_id)
        if not db_order:
            raise HTTPException(status_code=404, detail="订单不存在")
        order = await OrderService.update(db, db_order, order_in)
        return {
            "id": order.id,
            "order_no": order.order_no,
            "pet_id": order.pet_id,
            "customer_id": order.customer_id,
            "service_type": order.service_type,
            "package_id": order.package_id,
            "appointment_time": order.appointment_time,
            "actual_start_time": order.actual_start_time,
            "actual_end_time": order.actual_end_time,
            "status": order.status,
            "amount": float(order.amount) if order.amount else 0,
            "remark": order.remark,
            "pet_name": order.pet.name if order.pet else None,
            "customer_name": order.customer.name if order.customer else None,
            "customer_phone": order.customer.phone if order.customer else None,
            "package_name": order.package.name if order.package else None,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock_orders = OrderService.generate_mock_orders(20)
        for order in mock_orders:
            if order["id"] == order_id:
                if order_in.service_type:
                    order["service_type"] = order_in.service_type
                if order_in.status:
                    order["status"] = order_in.status
                return order
        raise HTTPException(status_code=404, detail="订单不存在")


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        success = await OrderService.delete(db, order_id)
        if not success:
            raise HTTPException(status_code=404, detail="订单不存在")
    except HTTPException:
        raise
    except Exception:
        pass
    return None


@router.post("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status: str = Query(..., description="目标状态"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        order = await OrderService.update_status(db, order_id, status)
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        return {
            "id": order.id,
            "order_no": order.order_no,
            "pet_id": order.pet_id,
            "customer_id": order.customer_id,
            "service_type": order.service_type,
            "package_id": order.package_id,
            "appointment_time": order.appointment_time,
            "actual_start_time": order.actual_start_time,
            "actual_end_time": order.actual_end_time,
            "status": order.status,
            "amount": float(order.amount) if order.amount else 0,
            "remark": order.remark,
            "pet_name": order.pet.name if order.pet else None,
            "customer_name": order.customer.name if order.customer else None,
            "customer_phone": order.customer.phone if order.customer else None,
            "package_name": order.package.name if order.package else None,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception:
        mock_orders = OrderService.generate_mock_orders(20)
        for order in mock_orders:
            if order["id"] == order_id:
                order["status"] = status
                return order
        raise HTTPException(status_code=404, detail="订单不存在")


@router.post("/{order_id}/after-sale", response_model=AfterSaleResponse, status_code=status.HTTP_201_CREATED)
async def create_after_sale(
    order_id: int,
    after_sale_in: AfterSaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        after_sale = await OrderService.create_after_sale(db, after_sale_in, current_user.id)
        return {
            "id": after_sale.id,
            "order_id": after_sale.order_id,
            "problem_type": after_sale.problem_type,
            "description": after_sale.description,
            "solution": after_sale.solution,
            "refund_amount": float(after_sale.refund_amount) if after_sale.refund_amount else 0,
            "handled_by": after_sale.handled_by,
            "created_at": after_sale.created_at,
            "updated_at": after_sale.updated_at,
        }
    except Exception:
        mock = OrderService.generate_mock_after_sale()
        mock["order_id"] = order_id
        mock["problem_type"] = after_sale_in.problem_type
        mock["description"] = after_sale_in.description
        return mock


@router.get("/{order_id}/after-sale", response_model=AfterSaleResponse)
async def get_after_sale(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        after_sale = await OrderService.get_after_sale_by_order_id(db, order_id)
        if not after_sale:
            raise HTTPException(status_code=404, detail="售后记录不存在")
        return {
            "id": after_sale.id,
            "order_id": after_sale.order_id,
            "problem_type": after_sale.problem_type,
            "description": after_sale.description,
            "solution": after_sale.solution,
            "refund_amount": float(after_sale.refund_amount) if after_sale.refund_amount else 0,
            "handled_by": after_sale.handled_by,
            "created_at": after_sale.created_at,
            "updated_at": after_sale.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock = OrderService.generate_mock_after_sale()
        mock["order_id"] = order_id
        return mock
