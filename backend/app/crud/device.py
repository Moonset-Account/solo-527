from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.device import Device, DeviceStatus, DeviceType
from app.schemas.device import DeviceCreate, DeviceUpdate


class CRUDDevice(CRUDBase[Device, DeviceCreate, DeviceUpdate]):
    def get_by_device_code(self, db: Session, *, device_code: str) -> Optional[Device]:
        return db.query(Device).filter(Device.device_code == device_code).first()

    def get_multi_by_event(
        self, db: Session, *, event_id: int,
        skip: int = 0, limit: int = 100,
        device_status: Optional[DeviceStatus] = None,
        device_type: Optional[DeviceType] = None,
    ) -> Tuple[List[Device], int]:
        query = db.query(Device).filter(Device.event_id == event_id)
        if device_status:
            query = query.filter(Device.device_status == device_status)
        if device_type:
            query = query.filter(Device.device_type == device_type)
        total = query.count()
        items = query.order_by(Device.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def update_checkin_stats(self, db: Session, *, device_id: int, checkin_time) -> None:
        device = self.get(db, id=device_id)
        if device:
            device.last_checkin_time = checkin_time
            device.checkin_count = (device.checkin_count or 0) + 1
            db.add(device)
            db.commit()


crud_device = CRUDDevice(Device)
