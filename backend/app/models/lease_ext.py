from sqlalchemy import Column, Integer, String, Numeric, Text, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import BaseModel


class Lease(BaseModel):
    __tablename__ = "leases"

    lease_no = Column(String(50), unique=True, nullable=False, comment="租约编号")
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, comment="房源ID")
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, comment="租客ID")
    lease_type = Column(String(50), nullable=False, comment="租约类型")
    start_date = Column(Date, nullable=False, comment="开始日期")
    end_date = Column(Date, nullable=False, comment="结束日期")
    rent_amount = Column(Numeric(12, 2), nullable=False, comment="月租金")
    deposit_amount = Column(Numeric(12, 2), nullable=False, comment="押金金额")
    payment_cycle = Column(String(20), default="monthly", nullable=False, comment="付款周期")
    payment_day = Column(Integer, default=1, nullable=False, comment="付款日")
    status = Column(String(20), default="pending", nullable=False, comment="租约状态")
    consultant_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="顾问ID")
    sign_date = Column(Date, nullable=True, comment="签约日期")
    remark = Column(Text, nullable=True, comment="备注")

    property = relationship("Property", back_populates="leases")
    tenant = relationship("Tenant", back_populates="leases")
    bills = relationship("Bill", back_populates="lease")
    exception_orders = relationship("ExceptionOrder", back_populates="lease")
    follow_up_records = relationship("FollowUpRecord", back_populates="lease")


class FollowUpRecord(BaseModel):
    __tablename__ = "follow_up_records"

    lease_id = Column(Integer, ForeignKey("leases.id"), nullable=False, comment="租约ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="跟进人ID")
    follow_type = Column(String(50), nullable=False, comment="跟进类型")
    content = Column(Text, nullable=False, comment="跟进内容")
    next_follow_date = Column(Date, nullable=True, comment="下次跟进日期")

    lease = relationship("Lease", back_populates="follow_up_records")
    user = relationship("User", back_populates="follow_up_records")
