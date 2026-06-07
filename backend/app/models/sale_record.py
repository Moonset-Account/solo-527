from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class SaleRecord(Base):
    __tablename__ = "sale_records"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_no = Column(String(50), unique=True, index=True, nullable=False)
    
    recycle_record_id = Column(Integer, ForeignKey("recycle_records.id"), nullable=False)
    recycle_record = relationship("RecycleRecord", backref="sale_records")
    
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    book = relationship("Book", backref="sale_records")
    
    isbn = Column(String(20), index=True, nullable=False)
    condition = Column(String(20), nullable=False)
    
    sale_price = Column(Float, nullable=False)
    sale_date = Column(DateTime(timezone=True), nullable=False)
    
    channel = Column(String(50), comment="销售渠道")
    operator = Column(String(50), comment="操作人")
    
    pricing_version = Column(String(50), comment="对应定价版本")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
