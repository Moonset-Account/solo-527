from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Date, Time
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Cleaner(Base):
    __tablename__ = "cleaners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    employee_id = Column(String(20), unique=True, nullable=False)
    shift = Column(String(10), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    work_orders = relationship("WorkOrder", back_populates="cleaner")
    handover_from = relationship("ShiftHandover", foreign_keys="ShiftHandover.from_cleaner_id", back_populates="from_cleaner")
    handover_to = relationship("ShiftHandover", foreign_keys="ShiftHandover.to_cleaner_id", back_populates="to_cleaner")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(10), unique=True, nullable=False)
    floor = Column(Integer, nullable=False)
    room_type = Column(String(30), nullable=False)
    is_vip = Column(Boolean, default=False)
    status = Column(String(20), default="dirty")

    work_orders = relationship("WorkOrder", back_populates="room")


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(30), unique=True, nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    cleaner_id = Column(Integer, ForeignKey("cleaners.id"), nullable=False)
    shift = Column(String(10), nullable=False)
    status = Column(String(20), default="assigned")
    is_late_checkout = Column(Boolean, default=False)
    is_vip = Column(Boolean, default=False)
    assigned_at = Column(DateTime, nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    inspection_time = Column(DateTime, nullable=True)
    cleaning_duration = Column(Float, nullable=True)
    date = Column(Date, nullable=False)
    note = Column(Text, nullable=True)

    room = relationship("Room", back_populates="work_orders")
    cleaner = relationship("Cleaner", back_populates="work_orders")
    reworks = relationship("Rework", back_populates="work_order")


class Rework(Base):
    __tablename__ = "reworks"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    reason = Column(String(100), nullable=False)
    missing_item = Column(String(100), nullable=True)
    rework_time = Column(DateTime, nullable=False)
    minutes_after_inspection = Column(Float, nullable=True)
    reassigned_cleaner_id = Column(Integer, ForeignKey("cleaners.id"), nullable=True)
    rework_duration = Column(Float, nullable=True)
    floor = Column(Integer, nullable=True)
    room_type = Column(String(30), nullable=True)
    is_vip = Column(Boolean, default=False)

    work_order = relationship("WorkOrder", back_populates="reworks")
    reassigned_cleaner = relationship("Cleaner")


class ShiftHandover(Base):
    __tablename__ = "shift_handovers"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    from_cleaner_id = Column(Integer, ForeignKey("cleaners.id"), nullable=False)
    to_cleaner_id = Column(Integer, ForeignKey("cleaners.id"), nullable=False)
    handover_time = Column(DateTime, nullable=False)
    from_duration = Column(Float, nullable=True)
    to_duration = Column(Float, nullable=True)
    note = Column(Text, nullable=True)

    from_cleaner = relationship("Cleaner", foreign_keys=[from_cleaner_id], back_populates="handover_from")
    to_cleaner = relationship("Cleaner", foreign_keys=[to_cleaner_id], back_populates="handover_to")
