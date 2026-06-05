from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from ..models.offline import OfflineSyncRecord
from .base import CRUDBase


class CRUDOfflineSync(CRUDBase[OfflineSyncRecord, dict, dict]):
    def create_record(
        self, db: Session, *, user_id: int, sync_type: str, data: Dict[str, Any],
        device_id: Optional[str] = None
    ) -> OfflineSyncRecord:
        record = OfflineSyncRecord(
            user_id=user_id,
            device_id=device_id,
            sync_type=sync_type,
            data=data,
            status="pending",
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def get_pending_by_user(self, db: Session, *, user_id: int) -> List[OfflineSyncRecord]:
        return db.query(OfflineSyncRecord).filter(
            OfflineSyncRecord.user_id == user_id,
            OfflineSyncRecord.status == "pending"
        ).order_by(OfflineSyncRecord.created_at).all()

    def mark_as_synced(self, db: Session, *, record_id: int) -> Optional[OfflineSyncRecord]:
        record = self.get(db, id=record_id)
        if record:
            record.status = "synced"
            record.synced_at = datetime.utcnow()
            db.commit()
            db.refresh(record)
        return record

    def mark_as_failed(self, db: Session, *, record_id: int, error_message: str) -> Optional[OfflineSyncRecord]:
        record = self.get(db, id=record_id)
        if record:
            record.status = "failed"
            record.error_message = error_message
            record.retry_count += 1
            db.commit()
            db.refresh(record)
        return record

    def get_all_pending(self, db: Session) -> List[OfflineSyncRecord]:
        return db.query(OfflineSyncRecord).filter(
            OfflineSyncRecord.status == "pending"
        ).order_by(OfflineSyncRecord.created_at).all()


offline_sync = CRUDOfflineSync(OfflineSyncRecord)
