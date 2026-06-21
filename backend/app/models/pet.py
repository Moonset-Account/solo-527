from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Pet(BaseModel):
    __tablename__ = "pets"

    name = Column(String(100), nullable=False, index=True)
    species = Column(String(20), nullable=False)
    breed = Column(String(100), nullable=False)
    gender = Column(String(10), nullable=False)
    birthday = Column(Date, nullable=True)
    weight = Column(Float, nullable=True)
    avatar = Column(String(255), nullable=True)
    health_status = Column(String(255), nullable=True)
    allergy_info = Column(Text, nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)

    customer = relationship("Customer", back_populates="pets", lazy="selectin")
    photos = relationship("PetPhoto", back_populates="pet", lazy="selectin", cascade="all, delete-orphan")
    health_records = relationship("HealthRecord", back_populates="pet", lazy="selectin", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="pet", lazy="selectin")
    adoption_applications = relationship("AdoptionApplication", back_populates="pet", lazy="selectin")


class PetPhoto(BaseModel):
    __tablename__ = "pet_photos"

    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    url = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    taken_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    pet = relationship("Pet", back_populates="photos", lazy="selectin")
    order = relationship("Order", back_populates="photos", lazy="selectin")


class HealthRecord(BaseModel):
    __tablename__ = "health_records"

    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False, index=True)
    record_type = Column(String(20), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    record_date = Column(Date, nullable=False)

    pet = relationship("Pet", back_populates="health_records", lazy="selectin")
