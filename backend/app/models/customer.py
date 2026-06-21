from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Customer(BaseModel):
    __tablename__ = "customers"

    name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), nullable=False, index=True)
    address = Column(String(255), nullable=True)

    pets = relationship("Pet", back_populates="customer", lazy="selectin")
    orders = relationship("Order", back_populates="customer", lazy="selectin")
