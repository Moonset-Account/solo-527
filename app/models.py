from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, Enum, JSON, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    COORDINATOR = "coordinator"
    DOCTOR = "doctor"
    VOLUNTEER = "volunteer"
    FINANCE = "finance"


class RegistrationStatus(str, enum.Enum):
    PENDING = "pending"
    QUALIFIED = "qualified"
    REJECTED = "rejected"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    SERVICED = "serviced"
    CANCELLED = "cancelled"


class ScheduleStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MedicineBoxStatus(str, enum.Enum):
    EMPTY = "empty"
    PACKED = "packed"
    IN_USE = "in_use"
    RETURNED = "returned"
    RECONCILED = "reconciled"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    role = Column(Enum(UserRole), default=UserRole.VOLUNTEER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    volunteer_profile = relationship("Volunteer", back_populates="user", uselist=False)
    created_notifications = relationship("Notification", back_populates="sender", foreign_keys="Notification.sender_id")
    received_notifications = relationship("Notification", back_populates="recipient", foreign_keys="Notification.recipient_id")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    license_number = Column(String(50), unique=True, nullable=False)
    specialty = Column(String(100), nullable=False)
    title = Column(String(50))
    hospital = Column(String(200))
    biography = Column(Text)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="doctor_profile")
    schedules = relationship("Schedule", back_populates="doctor")
    service_records = relationship("ServiceRecord", back_populates="doctor")


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=False)
    district = Column(String(100))
    city = Column(String(100))
    province = Column(String(100))
    contact_person = Column(String(100))
    contact_phone = Column(String(20))
    capacity = Column(Integer)
    facilities = Column(JSON)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    schedules = relationship("Schedule", back_populates="location")
    registrations = relationship("Registration", back_populates="location")


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    id_card = Column(String(18), unique=True)
    skills = Column(JSON)
    organization = Column(String(200))
    total_service_hours = Column(Float, default=0)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="volunteer_profile")
    schedule_assignments = relationship("ScheduleVolunteer", back_populates="volunteer")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    generic_name = Column(String(200))
    category = Column(String(100))
    specification = Column(String(200))
    unit = Column(String(20), nullable=False)
    manufacturer = Column(String(200))
    batch_number = Column(String(100))
    expiry_date = Column(Date)
    stock_quantity = Column(Integer, default=0)
    minimum_stock = Column(Integer, default=10)
    storage_condition = Column(String(200))
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    box_items = relationship("MedicineBoxItem", back_populates="medicine")


class MedicineBox(Base):
    __tablename__ = "medicine_boxes"

    id = Column(Integer, primary_key=True, index=True)
    box_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200))
    status = Column(Enum(MedicineBoxStatus), default=MedicineBoxStatus.EMPTY, nullable=False)
    current_location = Column(String(200))
    last_checked_by = Column(Integer, ForeignKey("users.id"))
    last_checked_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship("MedicineBoxItem", back_populates="box", cascade="all, delete-orphan")
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=True)
    schedule = relationship("Schedule", back_populates="medicine_boxes")


class MedicineBoxItem(Base):
    __tablename__ = "medicine_box_items"

    id = Column(Integer, primary_key=True, index=True)
    box_id = Column(Integer, ForeignKey("medicine_boxes.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    packed_quantity = Column(Integer, nullable=False)
    used_quantity = Column(Integer, default=0)
    returned_quantity = Column(Integer, default=0)
    notes = Column(Text)

    box = relationship("MedicineBox", back_populates="items")
    medicine = relationship("Medicine", back_populates="box_items")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    max_patients = Column(Integer, default=30)
    status = Column(Enum(ScheduleStatus), default=ScheduleStatus.DRAFT, nullable=False)
    confirmed_by = Column(Integer, ForeignKey("users.id"))
    confirmed_at = Column(DateTime(timezone=True))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    doctor = relationship("Doctor", back_populates="schedules")
    location = relationship("Location", back_populates="schedules")
    volunteers = relationship("ScheduleVolunteer", back_populates="schedule", cascade="all, delete-orphan")
    registrations = relationship("Registration", back_populates="schedule")
    medicine_boxes = relationship("MedicineBox", back_populates="schedule")
    service_records = relationship("ServiceRecord", back_populates="schedule")
    check_ins = relationship("CheckIn", back_populates="schedule")


class ScheduleVolunteer(Base):
    __tablename__ = "schedule_volunteers"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"), nullable=False)
    role = Column(String(100))
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime(timezone=True))

    schedule = relationship("Schedule", back_populates="volunteers")
    volunteer = relationship("Volunteer", back_populates="schedule_assignments")


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(50), unique=True, nullable=False)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    patient_name = Column(String(100), nullable=False)
    patient_gender = Column(String(10))
    patient_age = Column(Integer)
    patient_id_card = Column(String(18))
    patient_phone = Column(String(20))
    patient_address = Column(String(500))
    chief_complaint = Column(Text)
    is_eligible = Column(Boolean)
    eligibility_reason = Column(String(500))
    status = Column(Enum(RegistrationStatus), default=RegistrationStatus.PENDING, nullable=False)
    queue_number = Column(Integer)
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime(timezone=True))
    confirmed_by = Column(Integer, ForeignKey("users.id"))
    confirmed_at = Column(DateTime(timezone=True))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    schedule = relationship("Schedule", back_populates="registrations")
    location = relationship("Location", back_populates="registrations")
    service_record = relationship("ServiceRecord", back_populates="registration", uselist=False)
    check_in = relationship("CheckIn", back_populates="registration", uselist=False)


class CheckIn(Base):
    __tablename__ = "check_ins"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    registration_id = Column(Integer, ForeignKey("registrations.id"), unique=True, nullable=False)
    check_in_time = Column(DateTime(timezone=True), server_default=func.now())
    checked_in_by = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)

    schedule = relationship("Schedule", back_populates="check_ins")
    registration = relationship("Registration", back_populates="check_in")


class ServiceRecord(Base):
    __tablename__ = "service_records"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    registration_id = Column(Integer, ForeignKey("registrations.id"), unique=True, nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    service_start_time = Column(DateTime(timezone=True))
    service_end_time = Column(DateTime(timezone=True))
    diagnosis = Column(Text)
    treatment_notes = Column(Text)
    referral_suggested = Column(Boolean, default=False)
    referral_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    schedule = relationship("Schedule", back_populates="service_records")
    registration = relationship("Registration", back_populates="service_record")
    doctor = relationship("Doctor", back_populates="service_records")
    prescriptions = relationship("PrescriptionItem", back_populates="service_record")


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    service_record_id = Column(Integer, ForeignKey("service_records.id"), nullable=False)
    medicine_name = Column(String(200), nullable=False)
    specification = Column(String(200))
    quantity = Column(Integer, nullable=False)
    unit = Column(String(20), nullable=False)
    dosage = Column(String(200))
    notes = Column(Text)

    service_record = relationship("ServiceRecord", back_populates="prescriptions")


class ReturnedItem(Base):
    __tablename__ = "returned_items"

    id = Column(Integer, primary_key=True, index=True)
    box_id = Column(Integer, ForeignKey("medicine_boxes.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    returned_quantity = Column(Integer, nullable=False)
    returned_by = Column(Integer, ForeignKey("users.id"))
    returned_at = Column(DateTime(timezone=True), server_default=func.now())
    condition_notes = Column(Text)
    verified_by = Column(Integer, ForeignKey("users.id"))
    verified_at = Column(DateTime(timezone=True))

    box = relationship("MedicineBox")
    medicine = relationship("Medicine")


class MonthlyReconciliation(Base):
    __tablename__ = "monthly_reconciliations"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(String(7), nullable=False)
    total_schedules = Column(Integer, default=0)
    total_patients = Column(Integer, default=0)
    total_medicines_used = Column(Integer, default=0)
    total_medicines_returned = Column(Integer, default=0)
    total_service_hours = Column(Float, default=0)
    status = Column(String(20), default="draft")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_by = Column(Integer, ForeignKey("users.id"))
    verified_at = Column(DateTime(timezone=True))
    notes = Column(Text)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    notification_type = Column(String(50))
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    recipient = relationship("User", back_populates="received_notifications", foreign_keys=[recipient_id])
    sender = relationship("User", back_populates="created_notifications", foreign_keys=[sender_id])


class ImportExportTask(Base):
    __tablename__ = "import_export_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(String(20), nullable=False)
    entity_type = Column(String(50), nullable=False)
    file_name = Column(String(500))
    file_path = Column(String(500))
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    total_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    error_message = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))


class ErrorLog(Base):
    __tablename__ = "error_logs"

    id = Column(Integer, primary_key=True, index=True)
    error_type = Column(String(100))
    error_message = Column(Text, nullable=False)
    stack_trace = Column(Text)
    endpoint = Column(String(500))
    user_id = Column(Integer, ForeignKey("users.id"))
    request_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
