from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, Date, Time, JSON, Enum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    STAFF = "staff"
    MANAGER = "manager"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    phone = Column(String(20))
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_test_account = Column(Boolean, default=False, index=True)
    is_active = Column(Boolean, default=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    pets = relationship("Pet", back_populates="owner", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="customer")
    staff_profile = relationship("Staff", back_populates="user", uselist=False)


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255))
    phone = Column(String(20))
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    staff_members = relationship("Staff", back_populates="store")
    cages = relationship("Cage", back_populates="store")
    appointments = relationship("Appointment", back_populates="store")


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    position = Column(String(50))
    specialties = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="staff_profile")
    store = relationship("Store", back_populates="staff_members")
    assigned_appointments = relationship("AppointmentStaff", back_populates="staff")


class PetType(str, enum.Enum):
    DOG = "dog"
    CAT = "cat"
    OTHER = "other"


class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(50), nullable=False)
    pet_type = Column(Enum(PetType), default=PetType.DOG, nullable=False)
    breed = Column(String(100))
    weight = Column(Float)
    age = Column(Integer)
    gender = Column(String(10))
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="pets")
    appointments = relationship("Appointment", back_populates="pet")
    health_records = relationship("HealthRecord", back_populates="pet", cascade="all, delete-orphan")
    vaccines = relationship("PetVaccine", back_populates="pet", cascade="all, delete-orphan")
    allergies = relationship("PetVaccineAllergy", back_populates="pet", cascade="all, delete-orphan")
    boardings = relationship("Boarding", back_populates="pet")


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    duration_minutes = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    package_items = relationship("PackageItem", back_populates="service")
    appointments = relationship("AppointmentService", back_populates="service")


class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    original_price = Column(Float)
    valid_days = Column(Integer, default=365)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("PackageItem", back_populates="package", cascade="all, delete-orphan")
    appointments = relationship("AppointmentPackage", back_populates="package")
    user_packages = relationship("UserPackage", back_populates="package")


class PackageItem(Base):
    __tablename__ = "package_items"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    quantity = Column(Integer, default=1)

    package = relationship("Package", back_populates="items")
    service = relationship("Service", back_populates="package_items")


class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    appointment_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDING, index=True)
    notes = Column(Text)
    total_price = Column(Float, default=0)
    is_test_data = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("User", back_populates="appointments")
    pet = relationship("Pet", back_populates="appointments")
    store = relationship("Store", back_populates="appointments")
    services = relationship("AppointmentService", back_populates="appointment", cascade="all, delete-orphan")
    packages = relationship("AppointmentPackage", back_populates="appointment", cascade="all, delete-orphan")
    assigned_staff = relationship("AppointmentStaff", back_populates="appointment", cascade="all, delete-orphan")
    health_record = relationship("HealthRecord", back_populates="appointment", uselist=False)
    repurchase_anomaly = relationship(
        "RepurchaseAnomaly",
        back_populates="appointment",
        uselist=False,
        foreign_keys="RepurchaseAnomaly.appointment_id",
    )
    repurchase_anomaly_as_previous = relationship(
        "RepurchaseAnomaly",
        foreign_keys="RepurchaseAnomaly.previous_appointment_id",
    )


class AppointmentService(Base):
    __tablename__ = "appointment_services"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    price_at_time = Column(Float, nullable=False)

    appointment = relationship("Appointment", back_populates="services")
    service = relationship("Service", back_populates="appointments")


class AppointmentPackage(Base):
    __tablename__ = "appointment_packages"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    user_package_id = Column(Integer, ForeignKey("user_packages.id"))
    price_at_time = Column(Float, nullable=False)

    appointment = relationship("Appointment", back_populates="packages")
    package = relationship("Package", back_populates="appointments")
    user_package = relationship("UserPackage", back_populates="used_appointments")


class AppointmentStaff(Base):
    __tablename__ = "appointment_staff"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    role = Column(String(50), default="primary")

    appointment = relationship("Appointment", back_populates="assigned_staff")
    staff = relationship("Staff", back_populates="assigned_appointments")


class UserPackage(Base):
    __tablename__ = "user_packages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(Date, nullable=False)
    remaining_uses = Column(Integer, nullable=False)
    is_test_data = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    package = relationship("Package", back_populates="user_packages")
    used_appointments = relationship("AppointmentPackage", back_populates="user_package")


class CageStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"
    RESERVED = "reserved"


class Cage(Base):
    __tablename__ = "cages"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    name = Column(String(50), nullable=False)
    cage_type = Column(String(50))
    max_weight = Column(Float)
    location = Column(String(100))
    status = Column(Enum(CageStatus), default=CageStatus.AVAILABLE, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    store = relationship("Store", back_populates="cages")
    boardings = relationship("Boarding", back_populates="cage")


class BoardingStatus(str, enum.Enum):
    RESERVED = "reserved"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"


class Boarding(Base):
    __tablename__ = "boardings"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    cage_id = Column(Integer, ForeignKey("cages.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    actual_check_in = Column(DateTime)
    actual_check_out = Column(DateTime)
    status = Column(Enum(BoardingStatus), default=BoardingStatus.RESERVED, index=True)
    daily_rate = Column(Float, nullable=False)
    notes = Column(Text)
    is_test_data = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    pet = relationship("Pet", back_populates="boardings")
    cage = relationship("Cage", back_populates="boardings")


class HealthStatus(str, enum.Enum):
    NORMAL = "normal"
    ABNORMAL = "abnormal"
    CRITICAL = "critical"


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"))
    staff_id = Column(Integer, ForeignKey("users.id"))
    store_id = Column(Integer, ForeignKey("stores.id"))
    record_date = Column(Date, nullable=False, index=True)
    health_status = Column(Enum(HealthStatus), default=HealthStatus.NORMAL)
    abnormal_reason = Column(String(255))
    temperature = Column(Float)
    weight = Column(Float)
    symptoms = Column(Text)
    treatment = Column(Text)
    notes = Column(Text)
    is_test_data = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    pet = relationship("Pet", back_populates="health_records")
    appointment = relationship("Appointment", back_populates="health_record")


class Vaccine(Base):
    __tablename__ = "vaccines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    manufacturer = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    pet_vaccines = relationship("PetVaccine", back_populates="vaccine")
    allergy_configs = relationship("VaccineAllergyConfig", back_populates="vaccine")


class PetVaccine(Base):
    __tablename__ = "pet_vaccines"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    vaccine_id = Column(Integer, ForeignKey("vaccines.id"), nullable=False)
    vaccination_date = Column(Date, nullable=False)
    next_due_date = Column(Date)
    batch_number = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    pet = relationship("Pet", back_populates="vaccines")
    vaccine = relationship("Vaccine", back_populates="pet_vaccines")


class PetVaccineAllergy(Base):
    __tablename__ = "pet_vaccine_allergies"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    vaccine_name = Column(String(100), nullable=False)
    reaction_type = Column(String(100))
    severity = Column(String(50))
    reaction_date = Column(Date)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    pet = relationship("Pet", back_populates="allergies")


class ConfigType(str, enum.Enum):
    BOARDING_CAGE = "boarding_cage"
    HEALTH_CHANGE = "health_change"
    VACCINE_ALLERGY = "vaccine_allergy"
    REPURCHASE_RULE = "repurchase_rule"


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_type = Column(Enum(ConfigType), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    config_value = Column(JSON, nullable=False)
    conditions = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    valid_from = Column(Date)
    valid_to = Column(Date)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class VaccineAllergyConfig(Base):
    __tablename__ = "vaccine_allergy_configs"

    id = Column(Integer, primary_key=True, index=True)
    vaccine_id = Column(Integer, ForeignKey("vaccines.id"), nullable=False)
    reaction_type = Column(String(100), nullable=False)
    severity_level = Column(String(50))
    action_required = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vaccine = relationship("Vaccine", back_populates="allergy_configs")


class RepurchaseAnomaly(Base):
    __tablename__ = "repurchase_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    anomaly_type = Column(String(100), nullable=False)
    description = Column(Text)
    rule_triggered = Column(String(255))
    previous_appointment_id = Column(Integer, ForeignKey("appointments.id"))
    gap_days = Column(Integer)
    is_resolved = Column(Boolean, default=False)
    resolution_notes = Column(Text)
    is_test_data = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship(
        "Appointment",
        back_populates="repurchase_anomaly",
        foreign_keys=[appointment_id],
    )
    previous_appointment = relationship(
        "Appointment",
        foreign_keys=[previous_appointment_id],
    )
