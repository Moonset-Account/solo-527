from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from app.models import Attachment, ChangeLog
from app.models import User


def _add_change_log(
    db: Session,
    table_name: str,
    record_id: int,
    field_name: Optional[str],
    old_value: Optional[str],
    new_value: Optional[str],
    change_type: str = "update",
    operator_id: Optional[int] = None,
    remark: Optional[str] = None,
):
    log = ChangeLog(
        table_name=table_name,
        record_id=record_id,
        field_name=field_name,
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(new_value) if new_value is not None else None,
        operator_id=operator_id,
        change_type=change_type,
        remark=remark,
    )
    db.add(log)


def get_change_logs(db: Session, table_name: str, record_id: int, limit: int = 50) -> List[ChangeLog]:
    return (
        db.query(ChangeLog)
        .options(joinedload(ChangeLog.operator))
        .filter(ChangeLog.table_name == table_name, ChangeLog.record_id == record_id)
        .order_by(ChangeLog.created_at.desc())
        .limit(limit)
        .all()
    )


def get_attachments(db: Session, entity_type: str, entity_id: int) -> List[Attachment]:
    return (
        db.query(Attachment)
        .filter(Attachment.entity_type == entity_type, Attachment.entity_id == entity_id)
        .order_by(Attachment.created_at.desc())
        .all()
    )


def add_attachment(
    db: Session,
    entity_type: str,
    entity_id: int,
    file_name: str,
    file_path: str,
    file_size: int = None,
    file_type: str = None,
    category: str = None,
    operator_id: int = None,
    apartment_id: int = None,
) -> Attachment:
    attachment = Attachment(
        entity_type=entity_type,
        entity_id=entity_id,
        apartment_id=apartment_id,
        file_name=file_name,
        file_path=file_path,
        file_size=file_size,
        file_type=file_type,
        category=category,
        uploaded_by=operator_id,
    )
    db.add(attachment)
    _add_change_log(
        db, entity_type, entity_id, "attachments",
        None, file_name, "update", operator_id, f"上传附件: {file_name}"
    )
    db.commit()
    db.refresh(attachment)
    return attachment


def delete_attachment(db: Session, attachment_id: int, operator_id: int = None) -> bool:
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        return False
    table_name = attachment.entity_type or "apartments"
    record_id = attachment.entity_id or attachment.apartment_id
    file_name = attachment.file_name
    db.delete(attachment)
    _add_change_log(
        db, table_name, record_id, "attachments",
        file_name, None, "update", operator_id, f"删除附件: {file_name}"
    )
    db.commit()
    return True


def update_entity_remark(
    db: Session,
    entity,
    table_name: str,
    remark: str,
    operator_id: int = None,
) -> None:
    old_remark = entity.remark or ""
    entity.remark = remark
    _add_change_log(
        db, table_name, entity.id, "remark",
        old_remark, remark, "update", operator_id, "更新备注"
    )
    db.commit()
    db.refresh(entity)
