from sqlalchemy import Column, String, Integer, Boolean, Numeric, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class ServicePackage(BaseModel):
    __tablename__ = "service_packages"

    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    orders = relationship("Order", back_populates="package", lazy="selectin")
