from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class DeliveryRecord(Base):
    __tablename__ = "delivery_records"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchase_requests.id", ondelete="CASCADE"))
    delivered_quantity = Column(Numeric(12, 2), nullable=False)
    delivery_date = Column(Date, nullable=False)
    invoice_status_code = Column(String(50))
    remark = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    purchase = relationship("PurchaseRequest", back_populates="delivery_records")
    diffs = relationship("DeliveryDiff", back_populates="delivery")


class DeliveryDiff(Base):
    __tablename__ = "delivery_diffs"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("delivery_records.id", ondelete="CASCADE"))
    diff_type = Column(String(50), nullable=False)
    diff_value = Column(Numeric(12, 2), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    delivery = relationship("DeliveryRecord", back_populates="diffs")
