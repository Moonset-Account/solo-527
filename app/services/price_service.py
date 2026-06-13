from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from fastapi import HTTPException
from typing import Optional, List, Tuple
from datetime import date
from decimal import Decimal
from app.models import PriceRecord, Supplier
from app.schemas import PriceRecordCreate, PriceRecordUpdate, PriceStats, PriceHistoryQuery


class PriceService:
    @staticmethod
    def create_price_record(db: Session, price_in: PriceRecordCreate) -> PriceRecord:
        price_data = price_in.model_dump()
        db_price = PriceRecord(**price_data)
        db.add(db_price)
        db.commit()
        db.refresh(db_price)
        return db_price

    @staticmethod
    def get_price_history(
        db: Session, query: PriceHistoryQuery, page: int = 1, page_size: int = 20
    ) -> Tuple[List[PriceRecord], int]:
        q = db.query(PriceRecord)
        
        if query.material_name:
            q = q.filter(PriceRecord.material_name.ilike(f"%{query.material_name}%"))
        if query.specification:
            q = q.filter(PriceRecord.specification.ilike(f"%{query.specification}%"))
        if query.start_date:
            q = q.filter(PriceRecord.record_date >= query.start_date)
        if query.end_date:
            q = q.filter(PriceRecord.record_date <= query.end_date)
        
        total = q.count()
        items = q.order_by(desc(PriceRecord.record_date)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        return items, total

    @staticmethod
    def get_price_stats(
        db: Session, material_name: str, specification: Optional[str] = None
    ) -> PriceStats:
        q = db.query(PriceRecord).filter(
            PriceRecord.material_name == material_name
        )
        
        if specification:
            q = q.filter(PriceRecord.specification == specification)
        
        records = q.order_by(PriceRecord.record_date.desc()).all()
        
        if not records:
            raise HTTPException(status_code=404, detail="未找到价格记录")
        
        prices = [r.price for r in records]
        current_price = records[0].price
        
        if len(prices) >= 2:
            prev_price = records[1].price
            price_change = current_price - prev_price
            change_percent = (price_change / prev_price) * 100 if prev_price else Decimal(0)
        else:
            price_change = Decimal(0)
            change_percent = Decimal(0)
        
        return PriceStats(
            material_name=material_name,
            specification=specification or "",
            avg_price=sum(prices) / len(prices),
            min_price=min(prices),
            max_price=max(prices),
            current_price=current_price,
            price_change=price_change,
            change_percent=change_percent
        )

    @staticmethod
    def get_expiring_prices(db: Session, days: int = 7) -> List[PriceRecord]:
        from datetime import timedelta
        today = date.today()
        expiry_date = today + timedelta(days=days)
        
        return db.query(PriceRecord).filter(
            PriceRecord.expires_at <= expiry_date,
            PriceRecord.is_expired == False
        ).order_by(PriceRecord.expires_at).all()

    @staticmethod
    def get_materials(db: Session) -> List[str]:
        result = db.query(
            PriceRecord.material_name,
            PriceRecord.specification
        ).distinct().all()
        
        return [f"{r[0]} - {r[1]}" if r[1] else r[0] for r in result]

    @staticmethod
    def get_material_list(db: Session) -> List[dict]:
        result = db.query(
            PriceRecord.material_name,
            PriceRecord.specification
        ).distinct().all()
        
        return [
            {
                "material_name": r[0],
                "specification": r[1],
                "display_name": f"{r[0]} - {r[1]}" if r[1] else r[0]
            }
            for r in result
        ]

    @staticmethod
    def update_price_record(
        db: Session, record_id: int, price_in: PriceRecordUpdate
    ) -> PriceRecord:
        price = db.query(PriceRecord).filter(PriceRecord.id == record_id).first()
        if not price:
            raise HTTPException(status_code=404, detail="价格记录不存在")
        
        update_data = price_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(price, field, value)
        
        db.commit()
        db.refresh(price)
        return price

    @staticmethod
    def get_supplier_prices(
        db: Session, supplier_id: int, page: int = 1, page_size: int = 20
    ) -> Tuple[List[PriceRecord], int]:
        q = db.query(PriceRecord).filter(
            PriceRecord.supplier_id == supplier_id
        )
        
        total = q.count()
        items = q.order_by(desc(PriceRecord.record_date)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        return items, total

    @staticmethod
    def get_price_trend_data(
        db: Session, material_name: str, specification: Optional[str] = None,
        start_date: Optional[date] = None, end_date: Optional[date] = None
    ) -> dict:
        q = db.query(PriceRecord).filter(
            PriceRecord.material_name == material_name
        )
        
        if specification:
            q = q.filter(PriceRecord.specification == specification)
        if start_date:
            q = q.filter(PriceRecord.record_date >= start_date)
        if end_date:
            q = q.filter(PriceRecord.record_date <= end_date)
        
        records = q.order_by(PriceRecord.record_date).all()
        
        if not records:
            return {
                "labels": [],
                "data": [],
                "material_name": material_name,
                "specification": specification or "",
                "max_price": 0,
                "min_price": 0,
                "max_price_date": "",
                "min_price_date": ""
            }
        
        labels = [r.record_date.isoformat() for r in records]
        data = [float(r.price) for r in records]
        
        max_price = max(data)
        min_price = min(data)
        max_idx = data.index(max_price)
        min_idx = data.index(min_price)
        
        return {
            "labels": labels,
            "data": data,
            "material_name": material_name,
            "specification": specification or "",
            "max_price": max_price,
            "min_price": min_price,
            "max_price_date": labels[max_idx],
            "min_price_date": labels[min_idx]
        }
