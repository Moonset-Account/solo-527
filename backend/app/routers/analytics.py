from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..models import Book, RecycleRecord, BookCondition, Channel
from ..schemas.recycle_record import PriceScatterData, BookAnalysisData, FilterParams

router = APIRouter(prefix="/analytics", tags=["数据分析"])

CONDITION_PRICE_MAP = {
    "全新": "suggested_price_new",
    "九成新": "suggested_price_like_new",
    "八成新": "suggested_price_good",
    "七成新": "suggested_price_fair",
    "六成新及以下": "suggested_price_poor",
}

UNSOLD_THRESHOLD_DAYS = 30


def get_suggested_price(book: Book, condition: str) -> Optional[float]:
    price_field = CONDITION_PRICE_MAP.get(condition)
    if price_field:
        return getattr(book, price_field)
    return None


def build_filter_query(query, filters: FilterParams):
    if filters.channels:
        query = query.filter(RecycleRecord.channel.in_(filters.channels))
    if filters.conditions:
        query = query.filter(RecycleRecord.condition.in_(filters.conditions))
    if filters.min_days_in_stock is not None:
        query = query.filter(RecycleRecord.days_in_stock >= filters.min_days_in_stock)
    if filters.max_days_in_stock is not None:
        query = query.filter(RecycleRecord.days_in_stock <= filters.max_days_in_stock)
    if filters.min_recycle_price is not None:
        query = query.filter(RecycleRecord.recycle_price >= filters.min_recycle_price)
    if filters.max_recycle_price is not None:
        query = query.filter(RecycleRecord.recycle_price <= filters.max_recycle_price)
    if filters.only_abnormal:
        query = query.filter(RecycleRecord.is_abnormal == True)
    if filters.only_unsold:
        query = query.filter(RecycleRecord.is_sold == False)
    if filters.isbn_keyword:
        query = query.filter(RecycleRecord.isbn.contains(filters.isbn_keyword))
    if filters.title_keyword:
        query = query.join(Book).filter(Book.title.contains(filters.title_keyword))
    if filters.start_date:
        query = query.filter(RecycleRecord.recycle_date >= filters.start_date)
    if filters.end_date:
        query = query.filter(RecycleRecord.recycle_date <= filters.end_date)
    if filters.category:
        query = query.join(Book).filter(Book.category == filters.category)
    return query


@router.post("/price-scatter", response_model=List[PriceScatterData])
def get_price_scatter(filters: FilterParams, db: Session = Depends(get_db)):
    query = db.query(RecycleRecord, Book).join(Book, RecycleRecord.book_id == Book.id)
    query = build_filter_query(query, filters)
    
    results = query.all()
    
    grouped_data: dict = {}
    
    for record, book in results:
        key = (record.isbn, record.condition)
        
        if key not in grouped_data:
            grouped_data[key] = {
                "isbn": record.isbn,
                "title": book.title,
                "condition": record.condition,
                "recycle_prices": [],
                "sale_prices": [],
                "days_in_stock_list": [],
                "channels": set(),
                "suggested_price": get_suggested_price(book, record.condition),
                "is_set": book.is_set,
                "is_abnormal_list": [],
                "record_nos": [],
                "total_costs": [],
            }
        
        data = grouped_data[key]
        data["recycle_prices"].append(record.recycle_price)
        data["channels"].add(record.channel)
        data["days_in_stock_list"].append(record.days_in_stock)
        data["is_abnormal_list"].append(record.is_abnormal)
        data["record_nos"].append(record.record_no)
        
        if record.sale_price:
            data["sale_prices"].append(record.sale_price)
        if record.total_cost:
            data["total_costs"].append(record.total_cost)
    
    scatter_data = []
    for key, data in grouped_data.items():
        avg_recycle_price = sum(data["recycle_prices"]) / len(data["recycle_prices"])
        avg_sale_price = sum(data["sale_prices"]) / len(data["sale_prices"]) if data["sale_prices"] else None
        avg_days_in_stock = sum(data["days_in_stock_list"]) / len(data["days_in_stock_list"])
        
        profit_margin = None
        if avg_sale_price and data["total_costs"]:
            avg_total_cost = sum(data["total_costs"]) / len(data["total_costs"])
            if avg_total_cost > 0:
                profit_margin = round((avg_sale_price - avg_total_cost) / avg_total_cost * 100, 2)
        
        is_abnormal = any(data["is_abnormal_list"])
        suggested_price = data["suggested_price"]
        if suggested_price and not is_abnormal:
            price_diff_pct = abs(avg_recycle_price - suggested_price) / suggested_price
            if price_diff_pct > 0.3:
                is_abnormal = True
        
        scatter_data.append(PriceScatterData(
            isbn=data["isbn"],
            title=data["title"],
            condition=data["condition"],
            recycle_price=round(avg_recycle_price, 2),
            suggested_price=suggested_price,
            sale_price=round(avg_sale_price, 2) if avg_sale_price else None,
            channel=list(data["channels"])[0] if data["channels"] else "",
            days_in_stock=round(avg_days_in_stock, 1),
            is_abnormal=is_abnormal,
            is_set=data["is_set"],
            record_no=data["record_nos"][0] if data["record_nos"] else "",
            profit_margin=profit_margin
        ))
    
    return scatter_data


@router.post("/book-analysis", response_model=List[BookAnalysisData])
def get_book_analysis(filters: FilterParams, db: Session = Depends(get_db)):
    query = db.query(RecycleRecord, Book).join(Book, RecycleRecord.book_id == Book.id)
    query = build_filter_query(query, filters)
    
    results = query.all()
    
    analysis_map = {}
    
    for record, book in results:
        key = (record.isbn, record.condition)
        
        if key not in analysis_map:
            analysis_map[key] = {
                "isbn": record.isbn,
                "title": book.title,
                "condition": record.condition,
                "recycle_prices": [],
                "sale_prices": [],
                "days_in_stock_list": [],
                "logistics_costs": [],
                "total_count": 0,
                "sold_count": 0,
                "channels": set()
            }
        
        data = analysis_map[key]
        data["recycle_prices"].append(record.recycle_price)
        data["logistics_costs"].append(record.logistics_cost)
        data["days_in_stock_list"].append(record.days_in_stock)
        data["total_count"] += 1
        data["channels"].add(record.channel)
        
        if record.is_sold and record.sale_price:
            data["sold_count"] += 1
            data["sale_prices"].append(record.sale_price)
    
    analysis_list = []
    for key, data in analysis_map.items():
        avg_recycle_price = sum(data["recycle_prices"]) / len(data["recycle_prices"]) if data["recycle_prices"] else 0
        avg_sale_price = sum(data["sale_prices"]) / len(data["sale_prices"]) if data["sale_prices"] else None
        avg_days_in_stock = sum(data["days_in_stock_list"]) / len(data["days_in_stock_list"]) if data["days_in_stock_list"] else 0
        avg_logistics_cost = sum(data["logistics_costs"]) / len(data["logistics_costs"]) if data["logistics_costs"] else 0
        
        avg_profit_margin = None
        if avg_sale_price and avg_recycle_price > 0:
            avg_total_cost = avg_recycle_price + avg_logistics_cost
            avg_profit_margin = round((avg_sale_price - avg_total_cost) / avg_total_cost * 100, 2)
        
        turnover_rate = data["sold_count"] / data["total_count"] if data["total_count"] > 0 else 0
        
        analysis_list.append(BookAnalysisData(
            isbn=data["isbn"],
            title=data["title"],
            condition=data["condition"],
            avg_recycle_price=round(avg_recycle_price, 2),
            avg_sale_price=round(avg_sale_price, 2) if avg_sale_price else None,
            avg_profit_margin=avg_profit_margin,
            avg_days_in_stock=round(avg_days_in_stock, 1),
            total_count=data["total_count"],
            sold_count=data["sold_count"],
            unsold_count=data["total_count"] - data["sold_count"],
            turnover_rate=round(turnover_rate, 4),
            avg_logistics_cost=round(avg_logistics_cost, 2),
            channels=list(data["channels"])
        ))
    
    return sorted(analysis_list, key=lambda x: (x.isbn, x.condition))


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total_records = db.query(func.count(RecycleRecord.id)).scalar()
    total_books = db.query(func.count(Book.id)).scalar()
    sold_count = db.query(func.count(RecycleRecord.id)).filter(RecycleRecord.is_sold == True).scalar()
    unsold_count = total_records - sold_count
    unsold_over_threshold = db.query(func.count(RecycleRecord.id)).filter(
        and_(RecycleRecord.is_sold == False, RecycleRecord.days_in_stock >= UNSOLD_THRESHOLD_DAYS)
    ).scalar()
    abnormal_count = db.query(func.count(RecycleRecord.id)).filter(RecycleRecord.is_abnormal == True).scalar()
    
    avg_profit = None
    sold_records = db.query(RecycleRecord).filter(
        and_(RecycleRecord.is_sold == True, RecycleRecord.sale_price != None)
    ).all()
    
    if sold_records:
        profits = []
        for r in sold_records:
            if r.total_cost and r.sale_price:
                profits.append((r.sale_price - r.total_cost) / r.total_cost * 100)
        if profits:
            avg_profit = round(sum(profits) / len(profits), 2)
    
    return {
        "total_records": total_records,
        "total_books": total_books,
        "sold_count": sold_count,
        "unsold_count": unsold_count,
        "unsold_over_threshold": unsold_over_threshold,
        "unsold_threshold_days": UNSOLD_THRESHOLD_DAYS,
        "abnormal_count": abnormal_count,
        "avg_profit_margin": avg_profit,
        "channels": Channel.ALL,
        "conditions": BookCondition.ALL
    }


@router.get("/unsold-threshold")
def get_unsold_threshold():
    return {"threshold_days": UNSOLD_THRESHOLD_DAYS}
