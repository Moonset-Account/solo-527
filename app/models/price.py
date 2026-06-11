from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class PriceRecord(Base):
    __tablename__ = "price_records"

    id = Column(Integer, primary_key=True, index=True)
    material_name = Column(String(200), nullable=False)
    specification = Column(String(500))
    price = Column(Numeric(12, 2), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    purchase_id = Column(Integer, ForeignKey("purchase_requests.id"))
    record_date = Column(Date, nullable=False)
    expires_at = Column(Date)
    is_expired = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())

    supplier = relationship("Supplier", back_populates="price_records")
    purchase = relationship("PurchaseRequest", back_populates="price_records")
    creator = relationship("User", foreign_keys=[created_by])
