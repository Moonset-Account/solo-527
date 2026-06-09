import pandas as pd
import uuid
import io
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.appointment import Appointment
from app.models.department import Department
from app.models.time_slot import TimeSlot
from app.schemas.data import (
    AppointmentCreate, DepartmentCreate, TimeSlotCreate, AppointmentImportResponse
)


class DataImportService:
    @staticmethod
    def generate_batch_id() -> str:
        return f"batch_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"

    @staticmethod
    def _read_file(file_content: bytes, filename: str) -> pd.DataFrame:
        ext = filename.lower().split(".")[-1]
        if ext == "csv":
            return pd.read_csv(io.BytesIO(file_content), dtype=str)
        elif ext in ["xlsx", "xls"]:
            return pd.read_excel(io.BytesIO(file_content), dtype=str)
        elif ext == "json":
            return pd.read_json(io.BytesIO(file_content))
        else:
            raise ValueError(f"不支持的文件格式: {ext}")

    @staticmethod
    def _safe_int(val, default=0) -> int:
        if pd.isna(val) or val is None or str(val).strip() == "":
            return default
        try:
            return int(float(str(val).strip()))
        except (ValueError, TypeError):
            return default

    @staticmethod
    def _safe_float(val, default=0.0) -> float:
        if pd.isna(val) or val is None or str(val).strip() == "":
            return default
        try:
            return float(str(val).strip())
        except (ValueError, TypeError):
            return default

    @staticmethod
    def _safe_str(val, default="") -> str:
        if pd.isna(val) or val is None:
            return default
        return str(val).strip()

    @staticmethod
    def _safe_bool(val, default=False) -> bool:
        if pd.isna(val) or val is None:
            return default
        s = str(val).lower().strip()
        return s in ["1", "true", "yes", "是", "y", "t"]

    @staticmethod
    def import_departments(
        db: Session, file_content: bytes, filename: str
    ) -> Tuple[int, int, List[str]]:
        df = DataImportService._read_file(file_content, filename)
        success = 0
        failed = 0
        errors = []

        required_cols = ["code", "name"]
        for col in required_cols:
            if col not in df.columns:
                return 0, len(df), [f"缺少必需列: {col}"]

        for idx, row in df.iterrows():
            try:
                code = DataImportService._safe_str(row.get("code"))
                if not code:
                    failed += 1
                    errors.append(f"第{idx+2}行: 科室编码不能为空")
                    continue

                existing = db.query(Department).filter(Department.code == code).first()
                if existing:
                    existing.name = DataImportService._safe_str(row.get("name"), existing.name)
                    existing.description = DataImportService._safe_str(row.get("description"), existing.description)
                    existing.default_no_show_rate = DataImportService._safe_int(row.get("default_no_show_rate"), existing.default_no_show_rate)
                    existing.is_active = DataImportService._safe_bool(row.get("is_active"), existing.is_active)
                else:
                    dept = Department(
                        code=code,
                        name=DataImportService._safe_str(row.get("name")),
                        description=DataImportService._safe_str(row.get("description")),
                        default_no_show_rate=DataImportService._safe_int(row.get("default_no_show_rate"), 15),
                        is_active=DataImportService._safe_bool(row.get("is_active"), True),
                    )
                    db.add(dept)
                success += 1
            except Exception as e:
                failed += 1
                errors.append(f"第{idx+2}行: {str(e)}")

        db.commit()
        return success, failed, errors

    @staticmethod
    def import_time_slots(
        db: Session, file_content: bytes, filename: str
    ) -> Tuple[int, int, List[str]]:
        df = DataImportService._read_file(file_content, filename)
        success = 0
        failed = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                dept_code = DataImportService._safe_str(row.get("department_code"))
                dept = db.query(Department).filter(Department.code == dept_code).first()
                if not dept:
                    failed += 1
                    errors.append(f"第{idx+2}行: 科室编码 '{dept_code}' 不存在")
                    continue

                day_of_week = DataImportService._safe_int(row.get("day_of_week"))
                start_time_str = DataImportService._safe_str(row.get("start_time"))
                end_time_str = DataImportService._safe_str(row.get("end_time"))

                if not (0 <= day_of_week <= 6):
                    failed += 1
                    errors.append(f"第{idx+2}行: day_of_week必须在0-6之间")
                    continue

                from datetime import time as dtime
                try:
                    sh, sm = start_time_str.split(":")[:2] if ":" in start_time_str else (start_time_str, "0")
                    eh, em = end_time_str.split(":")[:2] if ":" in end_time_str else (end_time_str, "0")
                    start_t = dtime(int(sh), int(sm))
                    end_t = dtime(int(eh), int(em))
                except Exception:
                    failed += 1
                    errors.append(f"第{idx+2}行: 时间格式错误，应为 HH:MM")
                    continue

                slot = TimeSlot(
                    department_id=dept.id,
                    day_of_week=day_of_week,
                    start_time=start_t,
                    end_time=end_t,
                    capacity=DataImportService._safe_int(row.get("capacity"), 20),
                    historical_no_show_count=DataImportService._safe_int(row.get("historical_no_show_count"), 0),
                    historical_total_count=DataImportService._safe_int(row.get("historical_total_count"), 0),
                    is_active=DataImportService._safe_bool(row.get("is_active"), True),
                )
                db.add(slot)
                success += 1
            except Exception as e:
                failed += 1
                errors.append(f"第{idx+2}行: {str(e)}")

        db.commit()
        return success, failed, errors

    @staticmethod
    def import_appointments(
        db: Session, file_content: bytes, filename: str
    ) -> AppointmentImportResponse:
        batch_id = DataImportService.generate_batch_id()
        try:
            df = DataImportService._read_file(file_content, filename)
        except Exception as e:
            return AppointmentImportResponse(
                total_count=0, success_count=0, failed_count=0,
                batch_id=batch_id, errors=[f"文件读取失败: {str(e)}"]
            )

        success = 0
        failed = 0
        errors = []
        total = len(df)

        dept_cache = {}
        for dept in db.query(Department).all():
            dept_cache[dept.code] = dept.id

        from datetime import date as ddate, time as dtime

        for idx, row in df.iterrows():
            try:
                appointment_no = DataImportService._safe_str(row.get("appointment_no")) or f"AUTO{idx}_{uuid.uuid4().hex[:6]}"

                existing = db.query(Appointment).filter(Appointment.appointment_no == appointment_no).first()
                if existing:
                    failed += 1
                    errors.append(f"第{idx+2}行: 预约号 '{appointment_no}' 已存在，已跳过")
                    continue

                dept_code = DataImportService._safe_str(row.get("department_code"))
                department_id = dept_cache.get(dept_code)
                if department_id is None:
                    failed += 1
                    errors.append(f"第{idx+2}行: 科室编码 '{dept_code}' 不存在")
                    continue

                date_str = DataImportService._safe_str(row.get("appointment_date"))
                try:
                    if "/" in date_str:
                        parts = date_str.split("/")
                        y, m, d = (int(parts[2]), int(parts[0]), int(parts[1])) if len(parts[0]) <= 2 else (int(parts[0]), int(parts[1]), int(parts[2]))
                    elif "-" in date_str:
                        parts = date_str.split("-")
                        y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
                    else:
                        y, m, d = 2024, 1, 1
                    appt_date = ddate(y, m, d)
                except Exception:
                    appt_date = ddate.today()

                time_str = DataImportService._safe_str(row.get("appointment_time"), "09:00")
                try:
                    if ":" in time_str:
                        parts = time_str.split(":")
                        h, mi = int(parts[0]), int(parts[1])
                    else:
                        h, mi = int(time_str), 0
                    appt_time = dtime(h % 24, mi % 60)
                except Exception:
                    appt_time = dtime(9, 0)

                appt = Appointment(
                    appointment_no=appointment_no,
                    patient_age=DataImportService._safe_int(row.get("patient_age")),
                    patient_gender=DataImportService._safe_str(row.get("patient_gender")),
                    department_id=department_id,
                    doctor_name=DataImportService._safe_str(row.get("doctor_name")),
                    appointment_date=appt_date,
                    appointment_time=appt_time,
                    appointment_type=DataImportService._safe_str(row.get("appointment_type"), "普通门诊"),
                    is_revisit=DataImportService._safe_bool(row.get("is_revisit"), False),
                    channel=DataImportService._safe_str(row.get("channel"), "现场挂号"),
                    reminder_method=DataImportService._safe_str(row.get("reminder_method"), "sms"),
                    days_in_advance=DataImportService._safe_int(row.get("days_in_advance"), 1),
                    historical_no_show_count=DataImportService._safe_int(row.get("historical_no_show_count"), 0),
                    historical_total_count=DataImportService._safe_int(row.get("historical_total_count"), 0),
                    distance_km=DataImportService._safe_float(row.get("distance_km")),
                    weather_condition=DataImportService._safe_str(row.get("weather_condition")),
                    is_holiday=DataImportService._safe_bool(row.get("is_holiday"), False),
                    actual_status=DataImportService._safe_str(row.get("actual_status"), "pending"),
                    remark=DataImportService._safe_str(row.get("remark")),
                    batch_id=batch_id,
                )
                db.add(appt)
                success += 1

                if success % 100 == 0:
                    db.commit()
            except Exception as e:
                failed += 1
                errors.append(f"第{idx+2}行: {str(e)}")

        db.commit()
        return AppointmentImportResponse(
            total_count=total,
            success_count=success,
            failed_count=failed,
            batch_id=batch_id,
            errors=errors[:100],
        )

    @staticmethod
    def create_appointment(db: Session, data: AppointmentCreate) -> Appointment:
        appt = Appointment(**data.model_dump())
        appt.batch_id = DataImportService.generate_batch_id()
        db.add(appt)
        db.commit()
        db.refresh(appt)
        return appt

    @staticmethod
    def create_department(db: Session, data: DepartmentCreate) -> Department:
        dept = Department(**data.model_dump())
        db.add(dept)
        db.commit()
        db.refresh(dept)
        return dept

    @staticmethod
    def create_time_slot(db: Session, data: TimeSlotCreate) -> TimeSlot:
        slot = TimeSlot(**data.model_dump())
        db.add(slot)
        db.commit()
        db.refresh(slot)
        return slot

    @staticmethod
    def list_departments(db: Session, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None) -> List[Department]:
        query = db.query(Department)
        if is_active is not None:
            query = query.filter(Department.is_active == is_active)
        return query.order_by(Department.name).offset(skip).limit(limit).all()

    @staticmethod
    def list_appointments(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        department_id: Optional[int] = None,
        status: Optional[str] = None,
        date_from: Optional[ddate] = None,
        date_to: Optional[ddate] = None,
        batch_id: Optional[str] = None,
    ) -> List[Appointment]:
        query = db.query(Appointment)
        if department_id:
            query = query.filter(Appointment.department_id == department_id)
        if status:
            query = query.filter(Appointment.actual_status == status)
        if date_from:
            query = query.filter(Appointment.appointment_date >= date_from)
        if date_to:
            query = query.filter(Appointment.appointment_date <= date_to)
        if batch_id:
            query = query.filter(Appointment.batch_id == batch_id)
        return query.order_by(Appointment.appointment_date.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_appointment(db: Session, appointment_id: int) -> Optional[Appointment]:
        return db.query(Appointment).filter(Appointment.id == appointment_id).first()

    @staticmethod
    def get_department(db: Session, dept_id: int) -> Optional[Department]:
        return db.query(Department).filter(Department.id == dept_id).first()
