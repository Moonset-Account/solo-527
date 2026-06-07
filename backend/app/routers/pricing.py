from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..models import Book, RecycleRecord, PricingHistory, SaleRecord
from ..schemas import BookPriceUpdate, PricingHistory as PricingHistorySchema, PriceComparison, SaleStats
import uuid

router = APIRouter(prefix="/pricing", tags=["定价管理"])

CONDITION_PRICE_MAP = {
    "全新": "suggested_price_new",
    "九成新": "suggested_price_like_new",
    "八成新": "suggested_price_good",
    "七成新": "suggested_price_fair",
    "六成新及以下": "suggested_price_poor",
}


def generate_version() -> str:
    return f"V{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"


@router.post("/book/{book_id}/update-price")
def update_book_price(
    book_id: int,
    price_update: BookPriceUpdate,
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    
    price_field = CONDITION_PRICE_MAP.get(price_update.condition)
    if not price_field:
        raise HTTPException(status_code=400, detail="无效的品相")
    
    old_price = getattr(book, price_field) or 0
    new_price = price_update.new_price
    price_change = new_price - old_price
    change_percent = round((price_change / old_price * 100), 2) if old_price > 0 else None
    
    setattr(book, price_field, new_price)
    
    version = generate_version()
    history = PricingHistory(
        book_id=book.id,
        isbn=book.isbn,
        condition=price_update.condition,
        old_price=old_price,
        new_price=new_price,
        price_change=price_change,
        change_percent=change_percent,
        operator=price_update.operator,
        change_reason=price_update.change_reason,
        effective_date=datetime.now(),
        version=version
    )
    db.add(history)
    db.commit()
    db.refresh(book)
    
    return {
        "message": "价格更新成功",
        "book": book,
        "history": history,
        "version": version
    }


@router.get("/history/{isbn}", response_model=List[PricingHistorySchema])
def get_pricing_history(isbn: str, condition: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(PricingHistory).filter(PricingHistory.isbn == isbn)
    if condition:
        query = query.filter(PricingHistory.condition == condition)
    return query.order_by(PricingHistory.effective_date.desc()).all()


@router.get("/comparison/{isbn}", response_model=List[PriceComparison])
def get_price_comparison(isbn: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.isbn == isbn).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    
    histories = db.query(PricingHistory).filter(
        PricingHistory.isbn == isbn
    ).order_by(PricingHistory.effective_date.asc()).all()
    
    comparisons = []
    
    for history in histories:
        effective_date = history.effective_date
        
        before_sales = db.query(SaleRecord).filter(
            and_(
                SaleRecord.isbn == isbn,
                SaleRecord.condition == history.condition,
                SaleRecord.sale_date < effective_date
            )
        ).all()
        
        after_sales = db.query(SaleRecord).filter(
            and_(
                SaleRecord.isbn == isbn,
                SaleRecord.condition == history.condition,
                SaleRecord.sale_date >= effective_date
            )
        ).all()
        
        before_recycles = db.query(RecycleRecord).filter(
            and_(
                RecycleRecord.isbn == isbn,
                RecycleRecord.condition == history.condition,
                RecycleRecord.recycle_date < effective_date,
                RecycleRecord.is_sold == True
            )
        ).all()
        
        after_recycles = db.query(RecycleRecord).filter(
            and_(
                RecycleRecord.isbn == isbn,
                RecycleRecord.condition == history.condition,
                RecycleRecord.recycle_date >= effective_date,
                RecycleRecord.is_sold == True
            )
        ).all()
        
        def calc_stats(sales, recycles, period_label):
            sale_prices = [s.sale_price for s in sales]
            days_in_stock = [r.days_in_stock for r in recycles]
            
            avg_sale_price = sum(sale_prices) / len(sale_prices) if sale_prices else None
            
            margins = []
            for r in recycles:
                if r.sale_price and r.total_cost:
                    margins.append((r.sale_price - r.total_cost) / r.total_cost * 100)
            
            return SaleStats(
                period=period_label,
                avg_sale_price=round(avg_sale_price, 2) if avg_sale_price else None,
                total_sales=len(sales),
                avg_days_in_stock=round(sum(days_in_stock) / len(days_in_stock), 1) if days_in_stock else None,
                profit_margin=round(sum(margins) / len(margins), 2) if margins else None
            )
        
        before_stats = calc_stats(before_sales, before_recycles, "改价前")
        after_stats = calc_stats(after_sales, after_recycles, "改价后")
        
        comparisons.append(PriceComparison(
            isbn=isbn,
            title=book.title,
            condition=history.condition,
            before_price=history.old_price,
            after_price=history.new_price,
            price_change=history.price_change,
            change_percent=history.change_percent or 0,
            before_stats=before_stats,
            after_stats=after_stats,
            operator=history.operator,
            change_reason=history.change_reason,
            effective_date=history.effective_date,
            version=history.version
        ))
    
    return comparisons


@router.get("/versions")
def get_all_versions(db: Session = Depends(get_db)):
    versions = db.query(
        PricingHistory.version,
        PricingHistory.effective_date,
        PricingHistory.operator,
        func.count(PricingHistory.id).label("change_count")
    ).group_by(
        PricingHistory.version,
        PricingHistory.effective_date,
        PricingHistory.operator
    ).order_by(PricingHistory.effective_date.desc()).all()
    
    return [
        {
            "version": v.version,
            "effective_date": v.effective_date,
            "operator": v.operator,
            "change_count": v.change_count
        }
        for v in versions
    ]
