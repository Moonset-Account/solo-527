from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import and_, func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models import User, Order, Invoice, MaterialAuthorization, DeliveryNode
from ..schemas import OrderStatus, PaginationResult


class QueryService:
    def __init__(self, db: Session):
        self.db = db

    def get_invoices(
        self, current_user: User,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        status: Optional[str] = None,
        is_received: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20
    ) -> PaginationResult:
        query = self.db.query(Invoice).join(Order)
        
        if not current_user.is_test_account:
            query = query.filter(Order.is_test_data == False)
        
        if current_user.role == "photographer":
            query = query.filter(Order.photographer_id == current_user.id)
        
        if start_date:
            query = query.filter(Invoice.invoice_date >= start_date)
        if end_date:
            query = query.filter(Invoice.invoice_date <= end_date)
        if status:
            query = query.filter(Invoice.status == status)
        if is_received is not None:
            query = query.filter(Invoice.is_received == is_received)
        
        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(Invoice.invoice_date.desc()).offset(offset).limit(page_size).all()
        
        return PaginationResult(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )

    def get_invoice_summary(self, current_user: User) -> dict:
        query = self.db.query(Invoice).join(Order)
        
        if not current_user.is_test_account:
            query = query.filter(Order.is_test_data == False)
        
        if current_user.role == "photographer":
            query = query.filter(Order.photographer_id == current_user.id)
        
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0)
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        
        current_month_amount = query.filter(
            Invoice.invoice_date >= current_month
        ).with_entities(func.sum(Invoice.amount)).scalar() or 0
        
        last_month_amount = query.filter(
            and_(
                Invoice.invoice_date >= last_month,
                Invoice.invoice_date < current_month
            )
        ).with_entities(func.sum(Invoice.amount)).scalar() or 0
        
        pending_count = query.filter(Invoice.status == "pending").count()
        issued_count = query.filter(Invoice.status == "issued").count()
        received_count = query.filter(Invoice.is_received == True).count()
        
        return {
            "current_month_amount": float(current_month_amount),
            "last_month_amount": float(last_month_amount),
            "pending_count": pending_count,
            "issued_count": issued_count,
            "received_count": received_count,
            "total_amount": float(query.with_entities(func.sum(Invoice.amount)).scalar() or 0)
        }

    def get_deliveries(
        self, current_user: User,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> PaginationResult:
        query = self.db.query(DeliveryNode).join(Order)
        
        if not current_user.is_test_account:
            query = query.filter(Order.is_test_data == False)
        
        if current_user.role == "photographer":
            query = query.filter(Order.photographer_id == current_user.id)
        
        if start_date:
            query = query.filter(DeliveryNode.created_at >= start_date)
        if end_date:
            query = query.filter(DeliveryNode.created_at <= end_date)
        if status == "completed":
            query = query.filter(DeliveryNode.is_completed == True)
        elif status == "pending":
            query = query.filter(DeliveryNode.is_completed == False)
        
        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(DeliveryNode.created_at.desc()).offset(offset).limit(page_size).all()
        
        result_items = []
        for node in items:
            result_items.append({
                "id": node.id,
                "node_name": node.node_name,
                "node_type": node.node_type,
                "order_id": node.order_id,
                "order_no": node.order.order_no,
                "customer_name": node.order.customer_name,
                "expected_at": node.expected_at,
                "actual_at": node.actual_at,
                "is_completed": node.is_completed,
                "operator_name": node.operator.name if node.operator else None
            })
        
        return PaginationResult(
            items=result_items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )

    def get_delivery_summary(self, current_user: User) -> dict:
        query = self.db.query(DeliveryNode).join(Order)
        
        if not current_user.is_test_account:
            query = query.filter(Order.is_test_data == False)
        
        if current_user.role == "photographer":
            query = query.filter(Order.photographer_id == current_user.id)
        
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        today_deliveries = query.filter(
            and_(
                DeliveryNode.is_completed == True,
                DeliveryNode.actual_at >= today_start,
                DeliveryNode.actual_at <= today_end
            )
        ).count()
        
        pending_deliveries = query.filter(
            and_(
                DeliveryNode.is_completed == False,
                DeliveryNode.expected_at <= datetime.now()
            )
        ).count()
        
        upcoming_deliveries = query.filter(
            and_(
                DeliveryNode.is_completed == False,
                DeliveryNode.expected_at > datetime.now(),
                DeliveryNode.expected_at <= datetime.now() + timedelta(days=7)
            )
        ).count()
        
        total_completed = query.filter(DeliveryNode.is_completed == True).count()
        total_pending = query.filter(DeliveryNode.is_completed == False).count()
        
        return {
            "today_deliveries": today_deliveries,
            "pending_deliveries": pending_deliveries,
            "upcoming_deliveries": upcoming_deliveries,
            "total_completed": total_completed,
            "total_pending": total_pending,
            "completion_rate": round(total_completed / (total_completed + total_pending) * 100, 2) if (total_completed + total_pending) > 0 else 0
        }

    def get_authorizations(
        self, current_user: User,
        material_type: Optional[str] = None,
        is_approved: Optional[bool] = None,
        only_valid: bool = False,
        page: int = 1,
        page_size: int = 20
    ) -> PaginationResult:
        query = self.db.query(MaterialAuthorization).join(Order)
        
        if not current_user.is_test_account:
            query = query.filter(Order.is_test_data == False)
        
        if current_user.role == "photographer":
            query = query.filter(Order.photographer_id == current_user.id)
        
        if material_type:
            query = query.filter(MaterialAuthorization.material_type == material_type)
        if is_approved is not None:
            query = query.filter(MaterialAuthorization.is_approved == is_approved)
        if only_valid:
            query = query.filter(
                and_(
                    MaterialAuthorization.is_approved == True,
                    MaterialAuthorization.valid_from <= datetime.now(),
                    MaterialAuthorization.valid_to >= datetime.now()
                )
            )
        
        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(MaterialAuthorization.valid_from.desc()).offset(offset).limit(page_size).all()
        
        return PaginationResult(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )

    def get_authorization_summary(self, current_user: User) -> dict:
        query = self.db.query(MaterialAuthorization).join(Order)
        
        if not current_user.is_test_account:
            query = query.filter(Order.is_test_data == False)
        
        if current_user.role == "photographer":
            query = query.filter(Order.photographer_id == current_user.id)
        
        total = query.count()
        approved = query.filter(MaterialAuthorization.is_approved == True).count()
        pending = query.filter(MaterialAuthorization.is_approved == False).count()
        
        valid_now = query.filter(
            and_(
                MaterialAuthorization.is_approved == True,
                MaterialAuthorization.valid_from <= datetime.now(),
                MaterialAuthorization.valid_to >= datetime.now()
            )
        ).count()
        
        expiring_soon = query.filter(
            and_(
                MaterialAuthorization.is_approved == True,
                MaterialAuthorization.valid_to > datetime.now(),
                MaterialAuthorization.valid_to <= datetime.now() + timedelta(days=30)
            )
        ).count()
        
        expired = query.filter(
            and_(
                MaterialAuthorization.is_approved == True,
                MaterialAuthorization.valid_to < datetime.now()
            )
        ).count()
        
        return {
            "total": total,
            "approved": approved,
            "pending": pending,
            "valid_now": valid_now,
            "expiring_soon": expiring_soon,
            "expired": expired
        }
