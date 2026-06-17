from sqlalchemy import Column, Integer, String, Numeric, Text, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import BaseModel


class Property(BaseModel):
    __tablename__ = "properties"

    name = Column(String(100), nullable=False, comment="房源名称")
    code = Column(String(50), unique=True, nullable=False, comment="房源编号")
    address = Column(String(255), nullable=False, comment="地址")
    area = Column(Numeric(10, 2), nullable=True, comment="面积")
    property_type = Column(String(50), nullable=False, comment="房源类型")
    floor = Column(Integer, nullable=True, comment="楼层")
    total_floors = Column(Integer, nullable=True, comment="总楼层")
    owner_id = Column(Integer, ForeignKey("owners.id"), nullable=False, comment="业主ID")
    status = Column(String(20), default="available", nullable=False, comment="状态")
    description = Column(Text, nullable=True, comment="描述")

    owner = relationship("Owner", back_populates="properties")
    leases = relationship("Lease", back_populates="property")


class Owner(BaseModel):
    __tablename__ = "owners"

    name = Column(String(100), nullable=False, comment="业主名称")
    contact_person = Column(String(50), nullable=True, comment="联系人")
    phone = Column(String(20), nullable=True, comment="联系电话")
    email = Column(String(100), nullable=True, comment="邮箱")
    id_card = Column(String(20), nullable=True, comment="身份证号")
    bank_account = Column(String(50), nullable=True, comment="银行账号")
    bank_name = Column(String(100), nullable=True, comment="开户银行")
    address = Column(String(255), nullable=True, comment="地址")
    remark = Column(Text, nullable=True, comment="备注")

    properties = relationship("Property", back_populates="owner")


class Tenant(BaseModel):
    __tablename__ = "tenants"

    name = Column(String(100), nullable=False, comment="租客名称")
    contact_person = Column(String(50), nullable=True, comment="联系人")
    phone = Column(String(20), nullable=True, comment="联系电话")
    email = Column(String(100), nullable=True, comment="邮箱")
    id_card = Column(String(20), nullable=True, comment="身份证号")
    company = Column(String(100), nullable=True, comment="公司名称")
    industry = Column(String(50), nullable=True, comment="行业")
    employee_count = Column(Integer, nullable=True, comment="员工人数")
    address = Column(String(255), nullable=True, comment="地址")
    remark = Column(Text, nullable=True, comment="备注")

    leases = relationship("Lease", back_populates="tenant")
