from sqlalchemy import Column, Integer, String, Numeric, Text, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import BaseModel


class Bill(BaseModel):
    __tablename__ = "bills"

    bill_no = Column(String(50), unique=True, nullable=False, comment="账单编号")
    lease_id = Column(Integer, ForeignKey("leases.id"), nullable=False, comment="租约ID")
    bill_type = Column(String(20), nullable=False, comment="账单类型")
    bill_period = Column(String(20), nullable=True, comment="账期")
    bill_date = Column(Date, nullable=False, comment="账单日期")
    due_date = Column(Date, nullable=False, comment="到期日期")
    amount = Column(Numeric(12, 2), nullable=False, comment="账单金额")
    paid_amount = Column(Numeric(12, 2), default=0, nullable=False, comment="已付金额")
    status = Column(String(20), default="pending", nullable=False, comment="账单状态")
    remark = Column(Text, nullable=True, comment="备注")

    lease = relationship("Lease", back_populates="bills")
    payments = relationship("BillPayment", back_populates="bill")
    exception_orders = relationship("ExceptionOrder", back_populates="bill")


class BillPayment(BaseModel):
    __tablename__ = "bill_payments"

    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False, comment="账单ID")
    payment_no = Column(String(50), unique=True, nullable=False, comment="支付流水号")
    amount = Column(Numeric(12, 2), nullable=False, comment="支付金额")
    payment_date = Column(Date, nullable=False, comment="支付日期")
    payment_method = Column(String(20), nullable=False, comment="支付方式")
    payer = Column(String(100), nullable=True, comment="付款人")
    remark = Column(Text, nullable=True, comment="备注")

    bill = relationship("Bill", back_populates="payments")
