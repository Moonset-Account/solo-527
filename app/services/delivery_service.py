from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from fastapi import HTTPException
from typing import List, Tuple, Optional
from decimal import Decimal
from app.models import DeliveryRecord, DeliveryDiff, PurchaseRequest, PurchaseStatus, InvoiceStatus
from app.schemas import DeliveryRecordCreate, DeliveryRecordUpdate, DeliveryStats
from app.services.notification_service import NotificationService


class DeliveryService:
    @staticmethod
    def create_delivery(db: Session, delivery_in: DeliveryRecordCreate, user) -> DeliveryRecord:
        purchase = db.query(PurchaseRequest).filter(
            PurchaseRequest.id == delivery_in.purchase_id
        ).first()
        
        if not purchase:
            raise HTTPException(status_code=404, detail="采购需求不存在")
        
        if purchase.status not in [PurchaseStatus.APPROVED, PurchaseStatus.QUOTED, PurchaseStatus.EXPIRED]:
            raise HTTPException(status_code=400, detail="当前状态无法录入交付信息")
        
        delivery_data = delivery_in.model_dump()
        db_delivery = DeliveryRecord(**delivery_data)
        db.add(db_delivery)
        db.flush()
        
        quantity_diff = delivery_in.delivered_quantity - purchase.quantity
        if quantity_diff != 0:
            diff = DeliveryDiff(
                delivery_id=db_delivery.id,
                diff_type="quantity",
                diff_value=quantity_diff,
                description=f"交付数量差异：{quantity_diff:+} {purchase.unit}"
            )
            db.add(diff)
        
        total_delivered = db.query(func.sum(DeliveryRecord.delivered_quantity)).filter(
            DeliveryRecord.purchase_id == delivery_in.purchase_id
        ).scalar() or Decimal(0)
        total_delivered += delivery_in.delivered_quantity
        
        if total_delivered >= purchase.quantity:
            purchase.status = PurchaseStatus.DELIVERED
        
        db.commit()
        db.refresh(db_delivery)
        
        NotificationService.create_delivery_notification(db, db_delivery)
        
        return db_delivery

    @staticmethod
    def get_delivery_list(
        db: Session, purchase_id: Optional[int] = None,
        start_date: Optional = None, end_date: Optional = None,
        page: int = 1, page_size: int = 20
    ) -> Tuple[List[DeliveryRecord], int]:
        query = db.query(DeliveryRecord)
        
        if purchase_id:
            query = query.filter(DeliveryRecord.purchase_id == purchase_id)
        if start_date:
            query = query.filter(DeliveryRecord.delivery_date >= start_date)
        if end_date:
            query = query.filter(DeliveryRecord.delivery_date <= end_date)
        
        total = query.count()
        items = query.order_by(desc(DeliveryRecord.delivery_date)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        return items, total

    @staticmethod
    def get_delivery_detail(db: Session, delivery_id: int) -> DeliveryRecord:
        delivery = db.query(DeliveryRecord).filter(DeliveryRecord.id == delivery_id).first()
        if not delivery:
            raise HTTPException(status_code=404, detail="交付记录不存在")
        return delivery

    @staticmethod
    def update_delivery(
        db: Session, delivery_id: int, delivery_in: DeliveryRecordUpdate, user
    ) -> DeliveryRecord:
        delivery = db.query(DeliveryRecord).filter(DeliveryRecord.id == delivery_id).first()
        if not delivery:
            raise HTTPException(status_code=404, detail="交付记录不存在")
        
        update_data = delivery_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(delivery, field, value)
        
        db.commit()
        db.refresh(delivery)
        return delivery

    @staticmethod
    def get_delivery_stats(db: Session) -> DeliveryStats:
        total_deliveries = db.query(func.count(DeliveryRecord.id)).scalar() or 0
        
        from datetime import date
        today = date.today()
        
        on_time_count = db.query(func.count(DeliveryRecord.id)).join(
            PurchaseRequest, DeliveryRecord.purchase_id == PurchaseRequest.id
        ).filter(
            DeliveryRecord.delivery_date <= PurchaseRequest.expected_delivery
        ).scalar() or 0
        
        delayed_count = total_deliveries - on_time_count
        
        total_quantity = db.query(func.sum(DeliveryRecord.delivered_quantity)).scalar() or Decimal(0)
        
        total_expected = db.query(func.sum(PurchaseRequest.quantity)).filter(
            PurchaseRequest.status.in_([PurchaseStatus.DELIVERED, PurchaseStatus.CLOSED])
        ).scalar() or Decimal(0)
        
        diff_percent = ((total_quantity - total_expected) / total_expected * 100) if total_expected else Decimal(0)
        
        return DeliveryStats(
            total_deliveries=total_deliveries,
            on_time_count=on_time_count,
            delayed_count=delayed_count,
            total_quantity=total_quantity,
            total_expected=total_expected,
            diff_percent=diff_percent
        )
    
    @staticmethod
    def get_diff_type_stats(db: Session) -> dict:
        diffs = db.query(
            DeliveryDiff.diff_type,
            func.count(DeliveryDiff.id).label('count'),
            func.sum(func.abs(DeliveryDiff.diff_value)).label('total_value')
        ).group_by(DeliveryDiff.diff_type).all()
        
        result = {}
        for diff_type, count, total_value in diffs:
            result[diff_type] = {
                'count': count,
                'total_value': float(total_value) if total_value else 0
            }
        
        return result
    
    @staticmethod
    def get_monthly_delivery_data(db: Session, months: int = 6) -> list:
        from datetime import date, timedelta
        from sqlalchemy import extract
        
        today = date.today()
        start_date = date(today.year, today.month, 1) - timedelta(days=months * 30)
        
        records = db.query(
            extract('year', DeliveryRecord.delivery_date).label('year'),
            extract('month', DeliveryRecord.delivery_date).label('month'),
            func.count(DeliveryRecord.id).label('count'),
            func.sum(DeliveryRecord.delivered_quantity).label('quantity')
        ).filter(
            DeliveryRecord.delivery_date >= start_date
        ).group_by('year', 'month').order_by('year', 'month').all()
        
        result = []
        for year, month, count, quantity in records:
            result.append({
                'month': f"{int(year)}-{int(month):02d}",
                'count': count,
                'quantity': float(quantity) if quantity else 0
            })
        
        return result

    @staticmethod
    def get_purchase_deliveries(db: Session, purchase_id: int) -> List[DeliveryRecord]:
        return db.query(DeliveryRecord).filter(
            DeliveryRecord.purchase_id == purchase_id
        ).order_by(desc(DeliveryRecord.delivery_date)).all()

    @staticmethod
    def get_delivery_diffs(db: Session, delivery_id: int) -> List[DeliveryDiff]:
        return db.query(DeliveryDiff).filter(
            DeliveryDiff.delivery_id == delivery_id
        ).all()

    @staticmethod
    def sync_delivery_status(db: Session, purchase_id: int, user) -> PurchaseRequest:
        purchase = db.query(PurchaseRequest).filter(
            PurchaseRequest.id == purchase_id
        ).first()
        
        if not purchase:
            raise HTTPException(status_code=404, detail="采购需求不存在")
        
        total_delivered = db.query(func.sum(DeliveryRecord.delivered_quantity)).filter(
            DeliveryRecord.purchase_id == purchase_id
        ).scalar() or Decimal(0)
        
        if total_delivered >= purchase.quantity and purchase.status != PurchaseStatus.CLOSED:
            purchase.status = PurchaseStatus.DELIVERED
            db.commit()
            db.refresh(purchase)
        
        return purchase
