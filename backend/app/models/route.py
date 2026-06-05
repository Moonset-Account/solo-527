import uuid

from sqlalchemy import Column, String, Date, Integer, ForeignKey, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Courier(Base):
    __tablename__ = "couriers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(64), nullable=False)
    phone = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    routes = relationship("Route", back_populates="courier")


class Route(Base):
    __tablename__ = "routes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(128), nullable=False)
    date = Column(Date, nullable=False)
    courier_id = Column(UUID(as_uuid=True), ForeignKey("couriers.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(32), default="planned", nullable=False)
    total_stops = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    courier = relationship("Courier", back_populates="routes")
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan", order_by="RouteStop.stop_order")
    cold_box = relationship("ColdBox", back_populates="route", uselist=False)
    deliveries = relationship("Delivery", back_populates="route")


class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    elder_id = Column(UUID(as_uuid=True), ForeignKey("elders.id", ondelete="CASCADE"), nullable=False)
    stop_order = Column(Integer, nullable=False)
    building = Column(String(32), nullable=False)
    meal_count = Column(Integer, default=1, nullable=False)

    route = relationship("Route", back_populates="stops")
    elder = relationship("Elder")
