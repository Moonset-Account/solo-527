from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Floor(Base):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True)
    floor_number = Column(Integer, unique=True, nullable=False)
    floor_name = Column(String, nullable=False)
    total_seats = Column(Integer, nullable=False)
    description = Column(String)


class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    area_name = Column(String, nullable=False)
    floor_id = Column(Integer, ForeignKey("floors.id"), nullable=False)
    total_seats = Column(Integer, nullable=False)
    seat_type = Column(String, nullable=False)

    floor = relationship("Floor", back_populates="areas")


Floor.areas = relationship("Area", back_populates="floor", cascade="all, delete-orphan")


class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    seat_code = Column(String, unique=True, nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    seat_type = Column(String, nullable=False)
    has_power = Column(Boolean, default=True)
    has_window = Column(Boolean, default=False)
    is_disabled = Column(Boolean, default=False)
    grid_x = Column(Integer)
    grid_y = Column(Integer)

    area = relationship("Area", back_populates="seats")


Area.seats = relationship("Seat", back_populates="area", cascade="all, delete-orphan")


class UserGroup(Base):
    __tablename__ = "user_groups"

    id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String, unique=True, nullable=False)


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False)
    user_group_id = Column(Integer, ForeignKey("user_groups.id"), nullable=False)
    reservation_date = Column(Date, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    status = Column(String, nullable=False)
    checkin_time = Column(DateTime)
    checkout_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    seat = relationship("Seat")
    user_group = relationship("UserGroup")


class NoShowRecord(Base):
    __tablename__ = "no_show_records"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False)
    user_group_id = Column(Integer, ForeignKey("user_groups.id"), nullable=False)
    record_date = Column(Date, nullable=False)
    reason = Column(String)

    reservation = relationship("Reservation")
    user_group = relationship("UserGroup")


class WaitQueue(Base):
    __tablename__ = "wait_queue"

    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    user_group_id = Column(Integer, ForeignKey("user_groups.id"), nullable=False)
    queue_date = Column(Date, nullable=False)
    queue_time = Column(String, nullable=False)
    queue_position = Column(Integer, nullable=False)
    wait_duration = Column(Float)
    is_served = Column(Boolean, default=False)

    area = relationship("Area")
    user_group = relationship("UserGroup")


class ExamWeek(Base):
    __tablename__ = "exam_weeks"

    id = Column(Integer, primary_key=True, index=True)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    semester = Column(String, nullable=False)
    is_exam_week = Column(Boolean, default=True)


class DeviceRepair(Base):
    __tablename__ = "device_repairs"

    id = Column(Integer, primary_key=True, index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False)
    report_date = Column(Date, nullable=False)
    repair_date = Column(Date)
    issue_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    description = Column(String)

    seat = relationship("Seat")


class DataImportLog(Base):
    __tablename__ = "data_import_logs"

    id = Column(Integer, primary_key=True, index=True)
    import_date = Column(DateTime, default=datetime.utcnow)
    source_file = Column(String)
    records_count = Column(Integer)
    status = Column(String)
    notes = Column(String)
