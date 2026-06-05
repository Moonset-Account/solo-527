import uuid

from sqlalchemy import Column, String, Boolean, Float, ForeignKey, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Elder(Base):
    __tablename__ = "elders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(64), nullable=False)
    building = Column(String(32), nullable=False)
    unit = Column(String(16), nullable=False)
    room = Column(String(16), nullable=False)
    phone = Column(String(20), nullable=False)
    id_card = Column(String(18), nullable=True)
    subsidy_quota = Column(Float, default=0.0, nullable=False)
    subsidy_used = Column(Float, default=0.0, nullable=False)
    is_temp_suspended = Column(Boolean, default=False, nullable=False)
    suspend_reason = Column(Text, nullable=True)
    suspend_until = Column(Date, nullable=True)
    community_id = Column(UUID(as_uuid=True), nullable=True)

    family_contacts = relationship("FamilyContact", back_populates="elder", cascade="all, delete-orphan")
    dietary_restrictions = relationship("DietaryRestriction", back_populates="elder", cascade="all, delete-orphan")
    meal_orders = relationship("MealOrder", back_populates="elder")
    deliveries = relationship("Delivery", back_populates="elder")
    subsidy_records = relationship("SubsidyRecord", back_populates="elder")


class FamilyContact(Base):
    __tablename__ = "family_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    elder_id = Column(UUID(as_uuid=True), ForeignKey("elders.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(64), nullable=False)
    phone = Column(String(20), nullable=False)
    kinship = Column(String(32), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)

    elder = relationship("Elder", back_populates="family_contacts")


class DietaryRestriction(Base):
    __tablename__ = "dietary_restrictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    elder_id = Column(UUID(as_uuid=True), ForeignKey("elders.id", ondelete="CASCADE"), nullable=False)
    restriction_type = Column(String(64), nullable=False)
    ingredient = Column(String(64), nullable=False)
    severity = Column(String(16), default="warn", nullable=False)

    elder = relationship("Elder", back_populates="dietary_restrictions")
