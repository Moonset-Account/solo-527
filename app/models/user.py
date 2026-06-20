from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, Date, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    BRAND_OPERATOR = "brand_operator"
    MEMBER = "member"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    phone = Column(String(20))
    role = Column(SAEnum(UserRole), default=UserRole.MEMBER, nullable=False)
    is_active = Column(Boolean, default=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    brand = relationship("Brand", back_populates="users")
    member_profile = relationship("MemberProfile", back_populates="user", uselist=False)
    operations = relationship("OperationLog", back_populates="operator")


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="brand")
    members = relationship("MemberProfile", back_populates="brand")


class MemberProfile(Base):
    __tablename__ = "member_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)
    member_no = Column(String(50), unique=True, index=True)
    nickname = Column(String(100))
    avatar = Column(String(500))
    total_points = Column(Integer, default=0)
    available_points = Column(Integer, default=0)
    frozen_points = Column(Integer, default=0)
    level = Column(String(50), default="普通会员")
    total_spent = Column(Float, default=0.0)
    order_count = Column(Integer, default=0)
    last_purchase_date = Column(Date)
    birthday = Column(Date)
    baby_birthday = Column(Date)
    baby_gender = Column(String(10))
    region = Column(String(200))
    tags = Column(JSON, default=list)
    is_vip = Column(Boolean, default=False)
    referrer_id = Column(Integer, ForeignKey("member_profiles.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="member_profile")
    brand = relationship("Brand", back_populates="members")
    point_records = relationship("PointRecord", back_populates="member")
    coupons = relationship("MemberCoupon", back_populates="member")
    redemptions = relationship("RedemptionOrder", back_populates="member")
    benefits = relationship("MemberBenefit", back_populates="member")
