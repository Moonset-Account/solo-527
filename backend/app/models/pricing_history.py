from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class PricingHistory(Base):
    __tablename__ = "pricing_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    book = relationship("Book", backref="pricing_histories")
    
    isbn = Column(String(20), index=True, nullable=False)
    condition = Column(String(20), nullable=False, comment="品相")
    
    old_price = Column(Float, nullable=False, comment="改前价格")
    new_price = Column(Float, nullable=False, comment="改后价格")
    price_change = Column(Float, nullable=False, comment="价格变动")
    change_percent = Column(Float, comment="变动百分比")
    
    operator = Column(String(50), nullable=False, comment="操作人")
    change_reason = Column(Text, comment="改价原因")
    
    effective_date = Column(DateTime(timezone=True), nullable=False, comment="生效时间")
    version = Column(String(50), nullable=False, comment="定价版本")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
