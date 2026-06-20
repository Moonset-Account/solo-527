from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, Date, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class PointRecord(Base):
    __tablename__ = "point_records"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("member_profiles.id"), nullable=False)
    change_type = Column(String(50), nullable=False)
    points = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    source_type = Column(String(50))
    source_id = Column(Integer)
    cost_amount = Column(Float, default=0.0)
    description = Column(Text)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    expired_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("MemberProfile", back_populates="point_records")


class CouponTemplate(Base):
    __tablename__ = "coupon_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True)
    coupon_type = Column(String(50), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    discount_value = Column(Float, nullable=False)
    min_order_amount = Column(Float, default=0.0)
    max_discount_amount = Column(Float)
    description = Column(Text)
    valid_days = Column(Integer, default=30)
    valid_from = Column(Date)
    valid_to = Column(Date)
    total_quantity = Column(Integer, default=0)
    issued_quantity = Column(Integer, default=0)
    used_quantity = Column(Integer, default=0)
    per_user_limit = Column(Integer, default=1)
    is_repurchase = Column(Boolean, default=False)
    applicable_products = Column(JSON, default=list)
    applicable_categories = Column(JSON, default=list)
    cost_per_unit = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    coupons = relationship("MemberCoupon", back_populates="template")
    versions = relationship("CouponTemplateVersion", back_populates="template")


class CouponTemplateVersion(Base):
    __tablename__ = "coupon_template_versions"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("coupon_templates.id"), nullable=False)
    version = Column(Integer, nullable=False)
    name = Column(String(100))
    data = Column(JSON, nullable=False)
    change_summary = Column(Text)
    changed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    template = relationship("CouponTemplate", back_populates="versions")


class MemberCoupon(Base):
    __tablename__ = "member_coupons"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("member_profiles.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("coupon_templates.id"), nullable=False)
    coupon_code = Column(String(50), unique=True, index=True)
    status = Column(String(20), default="unused")
    received_at = Column(DateTime, default=datetime.utcnow)
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=False)
    used_at = Column(DateTime)
    used_order_no = Column(String(100))
    source = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("MemberProfile", back_populates="coupons")
    template = relationship("CouponTemplate", back_populates="coupons")


class PointBenefit(Base):
    __tablename__ = "point_benefits"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    benefit_type = Column(String(50), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    points_required = Column(Integer, nullable=False)
    description = Column(Text)
    value_amount = Column(Float, default=0.0)
    cost_amount = Column(Float, default=0.0)
    stock = Column(Integer, default=0)
    total_issued = Column(Integer, default=0)
    per_user_limit = Column(Integer, default=1)
    valid_days = Column(Integer)
    is_active = Column(Boolean, default=True)
    image_url = Column(String(500))
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    member_benefits = relationship("MemberBenefit", back_populates="benefit")
    versions = relationship("PointBenefitVersion", back_populates="benefit")


class PointBenefitVersion(Base):
    __tablename__ = "point_benefit_versions"

    id = Column(Integer, primary_key=True, index=True)
    benefit_id = Column(Integer, ForeignKey("point_benefits.id"), nullable=False)
    version = Column(Integer, nullable=False)
    name = Column(String(100))
    data = Column(JSON, nullable=False)
    change_summary = Column(Text)
    changed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    benefit = relationship("PointBenefit", back_populates="versions")


class MemberBenefit(Base):
    __tablename__ = "member_benefits"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("member_profiles.id"), nullable=False)
    benefit_id = Column(Integer, ForeignKey("point_benefits.id"), nullable=False)
    status = Column(String(20), default="active")
    received_at = Column(DateTime, default=datetime.utcnow)
    expired_at = Column(DateTime)
    used_at = Column(DateTime)
    points_consumed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    member = relationship("MemberProfile", back_populates="benefits")
    benefit = relationship("PointBenefit", back_populates="member_benefits")
