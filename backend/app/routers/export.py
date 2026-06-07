from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
from datetime import datetime
import io
import pandas as pd
from ..core.database import get_db
from ..models import Book, RecycleRecord
from ..schemas.recycle_record import ExportParams

router = APIRouter(prefix="/export", tags=["导出报表"])

CONDITION_PRICE_MAP = {
    "全新": "suggested_price_new",
    "九成新": "suggested_price_like_new",
    "八成新": "suggested_price_good",
    "七成新": "suggested_price_fair",
    "六成新及以下": "suggested_price_poor",
}


def get_suggested_price(book: Book, condition: str) -> Optional[float]:
    price_field = CONDITION_PRICE_MAP.get(condition)
    if price_field:
        return getattr(book, price_field)
    return None


def build_filter_query(query, filters: ExportParams):
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
    if filters.pricing_version:
        query = query.filter(RecycleRecord.pricing_version == filters.pricing_version)
    return query


@router.post("/report")
def export_report(filters: ExportParams, db: Session = Depends(get_db)):
    query = db.query(RecycleRecord, Book).join(Book, RecycleRecord.book_id == Book.id)
    query = build_filter_query(query, filters)
    
    results = query.all()
    
    data = []
    for record, book in results:
        suggested_price = get_suggested_price(book, record.condition)
        
        profit_margin = None
        if record.sale_price and record.total_cost:
            profit_margin = round((record.sale_price - record.total_cost) / record.total_cost * 100, 2)
        
        data.append({
            "记录编号": record.record_no,
            "ISBN": record.isbn,
            "书名": book.title,
            "作者": book.author,
            "出版社": book.publisher,
            "是否套装": "是" if book.is_set else "否",
            "套装册数": book.set_count,
            "品相": record.condition,
            "回收价(元)": record.recycle_price,
            "建议回收价(元)": suggested_price,
            "物流成本(元)": record.logistics_cost,
            "其他成本(元)": record.other_cost,
            "总成本(元)": record.total_cost,
            "回收渠道": record.channel,
            "操作人": record.operator,
            "回收日期": record.recycle_date.strftime("%Y-%m-%d") if record.recycle_date else "",
            "入库日期": record.in_stock_date.strftime("%Y-%m-%d") if record.in_stock_date else "",
            "是否售出": "是" if record.is_sold else "否",
            "售出价格(元)": record.sale_price,
            "售出日期": record.sale_date.strftime("%Y-%m-%d") if record.sale_date else "",
            "在库天数": record.days_in_stock,
            "毛利率(%)": profit_margin,
            "是否异常价格": "是" if record.is_abnormal else "否",
            "异常原因": record.abnormal_reason,
            "定价版本": record.pricing_version,
        })
    
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="回收记录明细", index=False)
        
        filter_info = pd.DataFrame({
            "项目": [
                "导出时间",
                "定价版本",
                "渠道筛选",
                "品相筛选",
                "最小在库天数",
                "最大在库天数",
                "最小回收价",
                "最大回收价",
                "仅显示异常",
                "仅显示未售出",
                "ISBN关键词",
                "书名关键词",
                "开始日期",
                "结束日期",
                "分类"
            ],
            "值": [
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                filters.pricing_version or "全部",
                ", ".join(filters.channels) if filters.channels else "全部",
                ", ".join(filters.conditions) if filters.conditions else "全部",
                filters.min_days_in_stock or "不限",
                filters.max_days_in_stock or "不限",
                filters.min_recycle_price or "不限",
                filters.max_recycle_price or "不限",
                "是" if filters.only_abnormal else "否",
                "是" if filters.only_unsold else "否",
                filters.isbn_keyword or "无",
                filters.title_keyword or "无",
                filters.start_date.strftime("%Y-%m-%d") if filters.start_date else "不限",
                filters.end_date.strftime("%Y-%m-%d") if filters.end_date else "不限",
                filters.category or "全部"
            ]
        })
        filter_info.to_excel(writer, sheet_name="筛选口径", index=False)
    
    output.seek(0)
    
    filename = f"二手书回收定价报表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
