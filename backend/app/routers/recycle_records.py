from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..models import RecycleRecord, Book
from ..schemas import RecycleRecord as RecycleRecordSchema, RecycleRecordCreate, RecycleRecordUpdate

router = APIRouter(prefix="/recycle-records", tags=["回收记录"])


@router.get("/", response_model=List[RecycleRecordSchema])
def get_recycle_records(
    skip: int = 0,
    limit: int = 100,
    isbn: Optional[str] = None,
    condition: Optional[str] = None,
    channel: Optional[str] = None,
    is_sold: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RecycleRecord)
    if isbn:
        query = query.filter(RecycleRecord.isbn.contains(isbn))
    if condition:
        query = query.filter(RecycleRecord.condition == condition)
    if channel:
        query = query.filter(RecycleRecord.channel == channel)
    if is_sold is not None:
        query = query.filter(RecycleRecord.is_sold == is_sold)
    
    return query.order_by(RecycleRecord.recycle_date.desc()).offset(skip).limit(limit).all()


@router.get("/{record_id}", response_model=RecycleRecordSchema)
def get_recycle_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(RecycleRecord).filter(RecycleRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="回收记录不存在")
    return record


@router.get("/record-no/{record_no}", response_model=RecycleRecordSchema)
def get_recycle_record_by_no(record_no: str, db: Session = Depends(get_db)):
    record = db.query(RecycleRecord).filter(RecycleRecord.record_no == record_no).first()
    if not record:
        raise HTTPException(status_code=404, detail="回收记录不存在")
    return record


@router.post("/", response_model=RecycleRecordSchema)
def create_recycle_record(record: RecycleRecordCreate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == record.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    
    existing = db.query(RecycleRecord).filter(RecycleRecord.record_no == record.record_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="记录编号已存在")
    
    db_record = RecycleRecord(**record.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.put("/{record_id}", response_model=RecycleRecordSchema)
def update_recycle_record(
    record_id: int,
    record_update: RecycleRecordUpdate,
    db: Session = Depends(get_db)
):
    db_record = db.query(RecycleRecord).filter(RecycleRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="回收记录不存在")
    
    update_data = record_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_record, key, value)
    
    db.commit()
    db.refresh(db_record)
    return db_record


@router.delete("/{record_id}")
def delete_recycle_record(record_id: int, db: Session = Depends(get_db)):
    db_record = db.query(RecycleRecord).filter(RecycleRecord.id == record_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="回收记录不存在")
    
    db.delete(db_record)
    db.commit()
    return {"message": "删除成功"}
