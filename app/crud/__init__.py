from typing import Optional, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models import User, Doctor, Location, Volunteer, Medicine, MedicineBox, Schedule, Registration, ServiceRecord
from app.schemas import (
    UserCreate, UserUpdate,
    DoctorCreate, DoctorUpdate,
    LocationCreate, LocationUpdate,
    VolunteerCreate, VolunteerUpdate,
    MedicineCreate, MedicineUpdate,
    MedicineBoxCreate, MedicineBoxUpdate,
    ScheduleCreate, ScheduleUpdate,
    RegistrationCreate, RegistrationUpdate,
    ServiceRecordCreate
)
from app.auth import get_password_hash


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        db_obj = User(
            username=obj_in.username,
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            full_name=obj_in.full_name,
            phone=obj_in.phone,
            role=obj_in.role
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


class CRUDDoctor(CRUDBase[Doctor, DoctorCreate, DoctorUpdate]):
    def get_by_user_id(self, db: Session, user_id: int) -> Optional[Doctor]:
        return db.query(Doctor).filter(Doctor.user_id == user_id).first()

    def get_available(self, db: Session) -> List[Doctor]:
        return db.query(Doctor).filter(Doctor.is_available == True).all()


class CRUDLocation(CRUDBase[Location, LocationCreate, LocationUpdate]):
    def get_active(self, db: Session) -> List[Location]:
        return db.query(Location).filter(Location.is_active == True).all()

    def search(self, db: Session, keyword: str) -> List[Location]:
        return db.query(Location).filter(
            (Location.name.contains(keyword)) | (Location.address.contains(keyword))
        ).all()


class CRUDVolunteer(CRUDBase[Volunteer, VolunteerCreate, VolunteerUpdate]):
    def get_by_user_id(self, db: Session, user_id: int) -> Optional[Volunteer]:
        return db.query(Volunteer).filter(Volunteer.user_id == user_id).first()

    def get_available(self, db: Session) -> List[Volunteer]:
        return db.query(Volunteer).filter(Volunteer.is_available == True).all()


class CRUDMedicine(CRUDBase[Medicine, MedicineCreate, MedicineUpdate]):
    def get_active(self, db: Session) -> List[Medicine]:
        return db.query(Medicine).filter(Medicine.is_active == True).all()

    def get_low_stock(self, db: Session) -> List[Medicine]:
        return db.query(Medicine).filter(
            Medicine.is_active == True,
            Medicine.stock_quantity <= Medicine.minimum_stock
        ).all()

    def search(self, db: Session, keyword: str) -> List[Medicine]:
        return db.query(Medicine).filter(
            (Medicine.name.contains(keyword)) | (Medicine.generic_name.contains(keyword))
        ).all()

    def update_stock(self, db: Session, medicine_id: int, quantity_change: int) -> Optional[Medicine]:
        medicine = self.get(db, id=medicine_id)
        if medicine:
            medicine.stock_quantity += quantity_change
            db.commit()
            db.refresh(medicine)
        return medicine


class CRUDMedicineBox(CRUDBase[MedicineBox, MedicineBoxCreate, MedicineBoxUpdate]):
    def get_by_code(self, db: Session, box_code: str) -> Optional[MedicineBox]:
        return db.query(MedicineBox).filter(MedicineBox.box_code == box_code).first()

    def get_by_schedule(self, db: Session, schedule_id: int) -> List[MedicineBox]:
        return db.query(MedicineBox).filter(MedicineBox.schedule_id == schedule_id).all()


class CRUDSchedule(CRUDBase[Schedule, ScheduleCreate, ScheduleUpdate]):
    def get_by_doctor(self, db: Session, doctor_id: int) -> List[Schedule]:
        return db.query(Schedule).filter(Schedule.doctor_id == doctor_id).all()

    def get_by_location(self, db: Session, location_id: int) -> List[Schedule]:
        return db.query(Schedule).filter(Schedule.location_id == location_id).all()

    def get_by_date_range(self, db: Session, start_date, end_date) -> List[Schedule]:
        return db.query(Schedule).filter(
            Schedule.date >= start_date,
            Schedule.date <= end_date
        ).all()


class CRUDRegistration(CRUDBase[Registration, RegistrationCreate, RegistrationUpdate]):
    def get_by_schedule(self, db: Session, schedule_id: int) -> List[Registration]:
        return db.query(Registration).filter(Registration.schedule_id == schedule_id).order_by(Registration.queue_number).all()

    def get_by_phone(self, db: Session, phone: str) -> List[Registration]:
        return db.query(Registration).filter(Registration.patient_phone == phone).all()

    def get_next_queue_number(self, db: Session, schedule_id: int) -> int:
        max_queue = db.query(Registration).filter(
            Registration.schedule_id == schedule_id
        ).with_entities(func.max(Registration.queue_number)).scalar()
        return (max_queue or 0) + 1


class CRUDServiceRecord(CRUDBase[ServiceRecord, ServiceRecordCreate, ServiceRecordCreate]):
    def get_by_schedule(self, db: Session, schedule_id: int) -> List[ServiceRecord]:
        return db.query(ServiceRecord).filter(ServiceRecord.schedule_id == schedule_id).all()

    def get_by_doctor(self, db: Session, doctor_id: int) -> List[ServiceRecord]:
        return db.query(ServiceRecord).filter(ServiceRecord.doctor_id == doctor_id).all()

    def get_by_registration(self, db: Session, registration_id: int) -> Optional[ServiceRecord]:
        return db.query(ServiceRecord).filter(ServiceRecord.registration_id == registration_id).first()


from sqlalchemy import func

user = CRUDUser(User)
doctor = CRUDDoctor(Doctor)
location = CRUDLocation(Location)
volunteer = CRUDVolunteer(Volunteer)
medicine = CRUDMedicine(Medicine)
medicine_box = CRUDMedicineBox(MedicineBox)
schedule = CRUDSchedule(Schedule)
registration = CRUDRegistration(Registration)
service_record = CRUDServiceRecord(ServiceRecord)
