from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Numeric, Text, Index
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Order(BaseModel):
    __tablename__ = "orders"

    order_no = Column(String(50), unique=True, nullable=False, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    service_type = Column(String(100), nullable=False)
    package_id = Column(Integer, ForeignKey("service_packages.id"), nullable=True)
    appointment_time = Column(DateTime, nullable=False)
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    amount = Column(Numeric(10, 2), nullable=False)
    remark = Column(Text, nullable=True)

    pet = relationship("Pet", back_populates="orders", lazy="selectin")
    customer = relationship("Customer", back_populates="orders", lazy="selectin")
    package = relationship("ServicePackage", back_populates="orders", lazy="selectin")
    photos = relationship("PetPhoto", back_populates="order", lazy="selectin")
    after_sale = relationship("AfterSale", back_populates="order", lazy="selectin", uselist=False)
    follow_up_tasks = relationship("FollowUpTask", lazy="selectin",
                                   primaryjoin="and_(Order.id==FollowUpTask.related_id, "
                                               "FollowUpTask.related_type=='order')",
                                   foreign_keys="FollowUpTask.related_id")

    __table_args__ = (
        Index("idx_orders_status_appointment", "status", "appointment_time"),
    )


class AfterSale(BaseModel):
    __tablename__ = "after_sales"

    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True, index=True)
    problem_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    solution = Column(Text, nullable=False)
    refund_amount = Column(Numeric(10, 2), nullable=True)
    handled_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    order = relationship("Order", back_populates="after_sale", lazy="selectin")
