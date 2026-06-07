from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class RecycleRecord(Base):
    __tablename__ = "recycle_records"
    
    id = Column(Integer, primary_key=True, index=True)
    record_no = Column(String(50), unique=True, index=True, nullable=False)
    
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    book = relationship("Book", backref="recycle_records")
    
    isbn = Column(String(20), index=True, nullable=False)
    condition = Column(String(20), nullable=False, comment="品相")
    
    recycle_price = Column(Float, nullable=False, comment="回收价")
    logistics_cost = Column(Float, default=0, comment="物流成本")
    other_cost = Column(Float, default=0, comment="其他成本")
    total_cost = Column(Float, nullable=False, comment="总成本")
    
    channel = Column(String(20), nullable=False, comment="回收渠道")
    operator = Column(String(50), comment="操作人")
    
    recycle_date = Column(DateTime(timezone=True), nullable=False, comment="回收日期")
    in_stock_date = Column(DateTime(timezone=True), comment="入库日期")
    sale_date = Column(DateTime(timezone=True), comment="售出日期")
    
    is_sold = Column(Boolean, default=False, comment="是否已售出")
    sale_price = Column(Float, comment="售出价格")
    days_in_stock = Column(Integer, default=0, comment="在库天数")
    
    is_abnormal = Column(Boolean, default=False, comment="是否异常价格")
    abnormal_reason = Column(String(200), comment="异常原因")
    
    pricing_version = Column(String(50), comment="定价版本")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
