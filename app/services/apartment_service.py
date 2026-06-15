from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models import Apartment, ChangeLog, Attachment, VacancyHistory
from app.schemas import ApartmentCreate, ApartmentUpdate


def get_apartment(db: Session, apartment_id: int) -> Optional[Apartment]:
    return db.query(Apartment).filter(Apartment.id == apartment_id).first()


def get_apartments(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    keyword: Optional[str] = None,
) -> List[Apartment]:
    query = db.query(Apartment)

    if status:
        query = query.filter(Apartment.status == status)
    if min_price:
        query = query.filter(Apartment.monthly_rent >= min_price)
    if max_price:
        query = query.filter(Apartment.monthly_rent <= max_price)
    if bedrooms:
        query = query.filter(Apartment.bedrooms == bedrooms)
    if keyword:
        query = query.filter(
            (Apartment.apartment_no.contains(keyword)) |
            (Apartment.address.contains(keyword)) |
            (Apartment.description.contains(keyword))
        )

    return query.order_by(Apartment.created_at.desc()).offset(skip).limit(limit).all()


def count_apartments(
    db: Session,
    status: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    keyword: Optional[str] = None,
) -> int:
    query = db.query(func.count(Apartment.id))

    if status:
        query = query.filter(Apartment.status == status)
    if min_price:
        query = query.filter(Apartment.monthly_rent >= min_price)
    if max_price:
        query = query.filter(Apartment.monthly_rent <= max_price)
    if bedrooms:
        query = query.filter(Apartment.bedrooms == bedrooms)
    if keyword:
        query = query.filter(
            (Apartment.apartment_no.contains(keyword)) |
            (Apartment.address.contains(keyword))
        )

    return query.scalar()


def create_apartment(db: Session, apartment: ApartmentCreate, operator_id: int = None) -> Apartment:
    db_apartment = Apartment(**apartment.model_dump())
    db.add(db_apartment)
    db.commit()
    db.refresh(db_apartment)

    _add_change_log(db, "apartments", db_apartment.id, None, None, "create", operator_id, "创建房源")

    _add_vacancy_history(db, db_apartment.id, None, apartment.status, operator_id)

    return db_apartment


def update_apartment(
    db: Session,
    apartment_id: int,
    apartment_update: ApartmentUpdate,
    operator_id: int = None
) -> Optional[Apartment]:
    db_apartment = get_apartment(db, apartment_id)
    if not db_apartment:
        return None

    old_status = db_apartment.status
    update_data = apartment_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        old_value = str(getattr(db_apartment, field))
        setattr(db_apartment, field, value)
        new_value = str(value)
        if old_value != new_value:
            _add_change_log(db, "apartments", apartment_id, field, old_value, new_value, "update", operator_id)

    if "status" in update_data and update_data["status"] != old_status:
        _add_vacancy_history(db, apartment_id, old_status, update_data["status"], operator_id)

    db.commit()
    db.refresh(db_apartment)
    return db_apartment


def update_apartment_status(
    db: Session,
    apartment_id: int,
    status: str,
    operator_id: int = None
) -> Optional[Apartment]:
    db_apartment = get_apartment(db, apartment_id)
    if not db_apartment:
        return None

    old_status = db_apartment.status
    if old_status != status:
        db_apartment.status = status
        _add_change_log(db, "apartments", apartment_id, "status", old_status, status, "update", operator_id, "状态变更")
        _add_vacancy_history(db, apartment_id, old_status, status, operator_id)
        db.commit()
        db.refresh(db_apartment)

    return db_apartment


def delete_apartment(db: Session, apartment_id: int, operator_id: int = None) -> bool:
    db_apartment = get_apartment(db, apartment_id)
    if not db_apartment:
        return False

    _add_change_log(db, "apartments", apartment_id, None, None, "delete", operator_id, "删除房源")
    db.delete(db_apartment)
    db.commit()
    return True


def get_change_logs(db: Session, table_name: str, record_id: int, limit: int = 50) -> List[ChangeLog]:
    return (
        db.query(ChangeLog)
        .options(joinedload(ChangeLog.operator))
        .filter(ChangeLog.table_name == table_name, ChangeLog.record_id == record_id)
        .order_by(ChangeLog.created_at.desc())
        .limit(limit)
        .all()
    )


def get_attachments(db: Session, apartment_id: int) -> List[Attachment]:
    return db.query(Attachment).filter(Attachment.apartment_id == apartment_id).all()


def add_attachment(
    db: Session,
    apartment_id: int,
    file_name: str,
    file_path: str,
    file_size: int = None,
    file_type: str = None,
    category: str = None,
    operator_id: int = None
) -> Attachment:
    attachment = Attachment(
        apartment_id=apartment_id,
        file_name=file_name,
        file_path=file_path,
        file_size=file_size,
        file_type=file_type,
        category=category,
        uploaded_by=operator_id
    )
    db.add(attachment)
    _add_change_log(db, "apartments", apartment_id, "attachments", None, file_name, "update", operator_id, f"上传附件: {file_name}")
    db.commit()
    db.refresh(attachment)
    return attachment


def delete_attachment(db: Session, attachment_id: int, operator_id: int = None) -> bool:
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        return False
    apartment_id = attachment.apartment_id
    file_name = attachment.file_name
    db.delete(attachment)
    _add_change_log(db, "apartments", apartment_id, "attachments", file_name, None, "update", operator_id, f"删除附件: {file_name}")
    db.commit()
    return True


def update_apartment_remark(
    db: Session,
    apartment_id: int,
    remark: str,
    operator_id: int = None
) -> Optional[Apartment]:
    apartment = get_apartment(db, apartment_id)
    if not apartment:
        return None
    old_remark = apartment.remark or ""
    apartment.remark = remark
    _add_change_log(db, "apartments", apartment_id, "remark", old_remark, remark, "update", operator_id, "更新备注")
    db.commit()
    db.refresh(apartment)
    return apartment


def _add_change_log(
    db: Session,
    table_name: str,
    record_id: int,
    field_name: Optional[str],
    old_value: Optional[str],
    new_value: Optional[str],
    change_type: str,
    operator_id: Optional[int],
    remark: Optional[str] = None
):
    log = ChangeLog(
        table_name=table_name,
        record_id=record_id,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        change_type=change_type,
        operator_id=operator_id,
        remark=remark
    )
    db.add(log)


def _add_vacancy_history(
    db: Session,
    apartment_id: int,
    from_status: Optional[str],
    to_status: str,
    operator_id: Optional[int]
):
    from datetime import date
    history = VacancyHistory(
        apartment_id=apartment_id,
        from_status=from_status,
        to_status=to_status,
        change_date=date.today(),
        remark=f"由 {from_status or '新建'} 变更为 {to_status}"
    )
    db.add(history)


def get_vacancy_stats(db: Session) -> dict:
    total = db.query(func.count(Apartment.id)).scalar()
    vacant = db.query(func.count(Apartment.id)).filter(Apartment.status == "vacant").scalar()
    occupied = db.query(func.count(Apartment.id)).filter(Apartment.status == "occupied").scalar()
    reserved = db.query(func.count(Apartment.id)).filter(Apartment.status == "reserved").scalar()

    vacancy_rate = round((vacant / total * 100), 2) if total > 0 else 0

    return {
        "total": total,
        "vacant": vacant,
        "occupied": occupied,
        "reserved": reserved,
        "vacancy_rate": vacancy_rate
    }


def get_vacancy_history(db: Session, apartment_id: int, limit: int = 20) -> List[VacancyHistory]:
    return (
        db.query(VacancyHistory)
        .filter(VacancyHistory.apartment_id == apartment_id)
        .order_by(VacancyHistory.change_date.desc())
        .limit(limit)
        .all()
    )
