from sqlalchemy import Column, Integer, String, Numeric, Text, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import BaseModel


class ExceptionOrder(BaseModel):
    __tablename__ = "exception_orders"

    order_no = Column(String(50), unique=True, nullable=False, comment="异常单编号")
    lease_id = Column(Integer, ForeignKey("leases.id"), nullable=False, comment="租约ID")
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=True, comment="账单ID")
    exception_type = Column(String(50), nullable=False, comment="异常类型")
    title = Column(String(200), nullable=False, comment="标题")
    description = Column(Text, nullable=False, comment="异常描述")
    status = Column(String(20), default="pending", nullable=False, comment="状态")
    priority = Column(String(20), default="normal", nullable=False, comment="优先级")
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True, comment="处理人ID")
    resolution = Column(Text, nullable=True, comment="处理说明")
    resolved_at = Column(DateTime, nullable=True, comment="处理时间")
    disputed_amount = Column(Numeric(12, 2), nullable=True, comment="争议金额")

    lease = relationship("Lease", back_populates="exception_orders")
    bill = relationship("Bill", back_populates="exception_orders")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_exception_orders")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_exception_orders")
