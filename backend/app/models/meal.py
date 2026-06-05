import uuid

from sqlalchemy import Column, String, Float, ForeignKey, Text, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.database import Base


class Meal(Base):
    __tablename__ = "meals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(128), nullable=False)
    meal_type = Column(String(32), nullable=False)
    ingredients = Column(ARRAY(String), default=[], nullable=False)
    allergens = Column(ARRAY(String), default=[], nullable=False)
    price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    orders = relationship("MealOrder", back_populates="meal")


class MealOrder(Base):
    __tablename__ = "meal_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    elder_id = Column(UUID(as_uuid=True), ForeignKey("elders.id", ondelete="CASCADE"), nullable=False)
    meal_id = Column(UUID(as_uuid=True), ForeignKey("meals.id", ondelete="CASCADE"), nullable=False)
    order_date = Column(String(10), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    has_dietary_conflict = Column(Boolean, default=False, nullable=False)
    conflict_details = Column(Text, nullable=True)

    elder = relationship("Elder", back_populates="meal_orders")
    meal = relationship("Meal", back_populates="orders")
