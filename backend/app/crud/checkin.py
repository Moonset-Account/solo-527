from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.checkin import CheckIn, CheckInStatus, AttendanceFeedback
from app.models.registration import Registration
from app.models.device import Device
from app.models.user import User
from app.schemas.checkin import CheckInCreate, CheckInByCode


class CRUDCheckIn(CRUDBase[CheckIn, CheckInCreate, dict]):
    def create_checkin(
        self, db: Session, *, obj_in: CheckInCreate, operator_id: Optional[int] = None
    ) -> CheckIn:
        db_obj = CheckIn(
            **obj_in.model_dump(),
            operator_id=operator_id,
            status=CheckInStatus.SUCCESS,
            attendance_feedback=AttendanceFeedback.PRESENT,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def check_duplicate(self, db: Session, *, registration_id: int, event_id: int) -> bool:
        count = db.query(CheckIn).filter(
            CheckIn.registration_id == registration_id,
            CheckIn.event_id == event_id,
            CheckIn.status == CheckInStatus.SUCCESS,
        ).count()
        return count > 0

    def get_by_registration(self, db: Session, *, registration_id: int) -> List[CheckIn]:
        return db.query(CheckIn).filter(
            CheckIn.registration_id == registration_id
        ).order_by(CheckIn.checkin_time.desc()).all()

    def get_multi_by_event(
        self, db: Session, *, event_id: int,
        skip: int = 0, limit: int = 100,
        status: Optional[CheckInStatus] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> Tuple[List[CheckIn], int]:
        query = db.query(CheckIn).filter(CheckIn.event_id == event_id)
        if status:
            query = query.filter(CheckIn.status == status)
        if date_from:
            query = query.filter(CheckIn.checkin_time >= date_from)
        if date_to:
            query = query.filter(CheckIn.checkin_time <= date_to)
        total = query.count()
        items = query.order_by(CheckIn.checkin_time.desc()).offset(skip).limit(limit).all()
        return items, total

    def update_attendance_feedback(
        self, db: Session, *, checkin_id: int, feedback: AttendanceFeedback, remark: Optional[str] = None
    ) -> Optional[CheckIn]:
        checkin = self.get(db, id=checkin_id)
        if checkin:
            checkin.attendance_feedback = feedback
            if remark:
                checkin.remark = remark
            db.add(checkin)
            db.commit()
            db.refresh(checkin)
        return checkin

    def count_by_event(self, db: Session, *, event_id: int, status: Optional[CheckInStatus] = None) -> int:
        query = db.query(CheckIn).filter(CheckIn.event_id == event_id)
        if status:
            query = query.filter(CheckIn.status == status)
        return query.count()

    def count(self, db: Session, *, status: Optional[CheckInStatus] = None) -> int:
        query = db.query(CheckIn)
        if status:
            query = query.filter(CheckIn.status == status)
        return query.count()

    def get_checkin_detail(self, db: Session, *, checkin_id: int) -> Optional[dict]:
        checkin = self.get(db, id=checkin_id)
        if not checkin:
            return None
        result = {
            "id": checkin.id,
            "event_id": checkin.event_id,
            "registration_id": checkin.registration_id,
            "device_id": checkin.device_id,
            "operator_id": checkin.operator_id,
            "checkin_time": checkin.checkin_time,
            "status": checkin.status,
            "attendance_feedback": checkin.attendance_feedback,
            "checkin_method": checkin.checkin_method,
            "remark": checkin.remark,
        }
        if checkin.registration:
            result["registration_real_name"] = checkin.registration.real_name
            result["registration_no"] = checkin.registration.registration_no
        if checkin.device:
            result["device_name"] = checkin.device.device_name
        if checkin.operator:
            result["operator_name"] = checkin.operator.full_name or checkin.operator.username
        return result


crud_checkin = CRUDCheckIn(CheckIn)
