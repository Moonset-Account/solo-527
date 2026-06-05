import uuid

from sqlalchemy import Column, String, Float, ForeignKey, Text, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    elder_id = Column(UUID(as_uuid=True), ForeignKey("elders.id", ondelete="CASCADE"), nullable=False)
    courier_id = Column(UUID(as_uuid=True), ForeignKey("couriers.id", ondelete="SET NULL"), nullable=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("meal_orders.id", ondelete="SET NULL"), nullable=True)
    meal_price = Column(Float, nullable=True)
    status = Column(String(32), default="pending", nullable=False)
    signed_photo_url = Column(Text, nullable=True)
    signed_at = Column(DateTime(timezone=True), nullable=True)
    exception_note = Column(Text, nullable=True)
    needs_redispatch = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    route = relationship("Route", back_populates="deliveries")
    elder = relationship("Elder", back_populates="deliveries")
    courier = relationship("Courier")
    order = relationship("MealOrder")
