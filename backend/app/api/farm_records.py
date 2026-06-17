from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/farm-records", tags=["农事记录"])


@router.get("", response_model=List[schemas.FarmRecordListItem])
def get_farm_records(
    batch_id: Optional[int] = None,
    record_type: Optional[str] = None,
    operator_id: Optional[int] = None,
    keyword: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = (
        db.query(
            models.FarmRecord,
            models.Batch.batch_no.label("batch_no"),
            models.Variety.name.label("variety_name"),
            models.User.full_name.label("operator_name"),
        )
        .join(models.Batch, models.FarmRecord.batch_id == models.Batch.id)
        .join(models.Variety, models.Batch.variety_id == models.Variety.id)
        .outerjoin(models.User, models.FarmRecord.operator_id == models.User.id)
    )
    if batch_id:
        query = query.filter(models.FarmRecord.batch_id == batch_id)
    if record_type:
        query = query.filter(models.FarmRecord.record_type == record_type)
    if operator_id:
        query = query.filter(models.FarmRecord.operator_id == operator_id)
    if keyword:
        query = query.filter(
            models.FarmRecord.title.contains(keyword)
            | models.FarmRecord.record_no.contains(keyword)
            | models.Batch.batch_no.contains(keyword)
        )
    if start_date:
        query = query.filter(models.FarmRecord.record_time >= start_date)
    if end_date:
        query = query.filter(models.FarmRecord.record_time <= end_date)
    results = query.order_by(models.FarmRecord.id.desc()).offset(skip).limit(limit).all()
    records = []
    for record, batch_no, variety_name, operator_name in results:
        record_dict = record.__dict__.copy()
        record_dict["batch_no"] = batch_no
        record_dict["variety_name"] = variety_name
        record_dict["operator_name"] = operator_name
        records.append(record_dict)
    return records


@router.get("/{record_id}", response_model=schemas.FarmRecord)
def get_farm_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.FarmRecord).filter(models.FarmRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="农事记录不存在")
    return record


@router.post("", response_model=schemas.FarmRecord)
def create_farm_record(record: schemas.FarmRecordCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(models.FarmRecord).filter(models.FarmRecord.record_no == record.record_no).first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="记录编号已存在")
    db_record = models.FarmRecord(**record.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.put("/{record_id}", response_model=schemas.FarmRecord)
def update_farm_record(
    record_id: int, record_update: schemas.FarmRecordUpdate, db: Session = Depends(get_db)
):
    record = db.query(models.FarmRecord).filter(models.FarmRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="农事记录不存在")
    update_data = record_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}")
def delete_farm_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.FarmRecord).filter(models.FarmRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="农事记录不存在")
    db.delete(record)
    db.commit()
    return {"message": "删除成功"}


@router.get("/stats/summary")
def get_records_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.FarmRecord)
    if start_date:
        query = query.filter(models.FarmRecord.record_time >= start_date)
    if end_date:
        query = query.filter(models.FarmRecord.record_time <= end_date)
    records = query.all()

    by_type = {}
    for r in records:
        by_type.setdefault(r.record_type, 0)
        by_type[r.record_type] += 1
    return {
        "total": len(records),
        "by_type": [{"name": k, "value": v} for k, v in by_type.items()],
    }
