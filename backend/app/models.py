from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="technician")
    hashed_password = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farm_records = relationship("FarmRecord", back_populates="operator")
    sorting_orders = relationship("SortingOrder", back_populates="handler")


class Plot(Base):
    __tablename__ = "plots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True)
    area = Column(Float)
    greenhouse_type = Column(String(50))
    location = Column(String(200))
    status = Column(String(20), default="active")
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    batches = relationship("Batch", back_populates="plot")
    environment_data = relationship("EnvironmentData", back_populates="plot")
    environment_alerts = relationship("EnvironmentAlert", back_populates="plot")


class Variety(Base):
    __tablename__ = "varieties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True)
    category = Column(String(50))
    growth_cycle_days = Column(Integer)
    optimal_temp_min = Column(Float)
    optimal_temp_max = Column(Float)
    optimal_humidity_min = Column(Float)
    optimal_humidity_max = Column(Float)
    expected_yield = Column(Float)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batches = relationship("Batch", back_populates="variety")


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_no = Column(String(50), unique=True, index=True, nullable=False)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    variety_id = Column(Integer, ForeignKey("varieties.id"), nullable=False)
    plant_date = Column(Date)
    expected_harvest_date = Column(Date)
    actual_harvest_date = Column(Date)
    status = Column(String(20), default="growing")
    planting_quantity = Column(Integer)
    predicted_yield = Column(Float)
    actual_yield = Column(Float)
    remark = Column(Text)
    process_result = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    plot = relationship("Plot", back_populates="batches")
    variety = relationship("Variety", back_populates="batches")
    farm_records = relationship("FarmRecord", back_populates="batch")
    sorting_orders = relationship("SortingOrder", back_populates="batch")


class EnvironmentData(Base):
    __tablename__ = "environment_data"

    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    temperature = Column(Float)
    humidity = Column(Float)
    soil_moisture = Column(Float)
    light_intensity = Column(Float)
    co2_concentration = Column(Float)
    record_time = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    plot = relationship("Plot", back_populates="environment_data")


class EnvironmentAlert(Base):
    __tablename__ = "environment_alerts"

    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    alert_type = Column(String(30), nullable=False)
    alert_level = Column(String(20), default="warning")
    metric = Column(String(30))
    current_value = Column(Float)
    threshold_min = Column(Float)
    threshold_max = Column(Float)
    message = Column(String(500))
    is_handled = Column(Boolean, default=False)
    handled_by = Column(Integer, ForeignKey("users.id"))
    handled_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plot = relationship("Plot", back_populates="environment_alerts")


class SortingOrder(Base):
    __tablename__ = "sorting_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), default="kg")
    quality_level = Column(String(20))
    target_market = Column(String(100))
    status = Column(String(20), default="pending")
    handler_id = Column(Integer, ForeignKey("users.id"))
    scheduled_time = Column(DateTime(timezone=True))
    completed_time = Column(DateTime(timezone=True))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("Batch", back_populates="sorting_orders")
    handler = relationship("User", back_populates="sorting_orders")


class MachineReservation(Base):
    __tablename__ = "machine_reservations"

    id = Column(Integer, primary_key=True, index=True)
    reservation_no = Column(String(50), unique=True, index=True, nullable=False)
    machine_name = Column(String(100), nullable=False)
    machine_type = Column(String(50))
    applicant = Column(String(50))
    plot_id = Column(Integer, ForeignKey("plots.id"))
    purpose = Column(String(200))
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="pending")
    operator = Column(String(50))
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FarmRecord(Base):
    __tablename__ = "farm_records"

    id = Column(Integer, primary_key=True, index=True)
    record_no = Column(String(50), unique=True, index=True, nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    record_type = Column(String(30), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    operator_id = Column(Integer, ForeignKey("users.id"))
    record_time = Column(DateTime(timezone=True), nullable=False)
    weather = Column(String(30))
    materials_used = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("Batch", back_populates="farm_records")
    operator = relationship("User", back_populates="farm_records")


class TodoItem(Base):
    __tablename__ = "todo_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    priority = Column(String(20), default="medium")
    category = Column(String(30))
    related_type = Column(String(30))
    related_id = Column(Integer)
    due_time = Column(DateTime(timezone=True))
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True))
    assignee = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
