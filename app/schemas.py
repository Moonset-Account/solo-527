from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: str = "member"
    brand_id: Optional[int] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    brand_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BrandBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class BrandCreate(BrandBase):
    pass


class BrandResponse(BrandBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MemberProfileBase(BaseModel):
    nickname: Optional[str] = None
    level: Optional[str] = None
    birthday: Optional[date] = None
    baby_birthday: Optional[date] = None
    baby_gender: Optional[str] = None
    region: Optional[str] = None
    tags: Optional[List[str]] = None


class MemberProfileCreate(MemberProfileBase):
    user_id: int
    brand_id: int


class MemberProfileUpdate(MemberProfileBase):
    pass


class MemberProfileResponse(MemberProfileBase):
    id: int
    user_id: int
    brand_id: int
    member_no: str
    total_points: int
    available_points: int
    frozen_points: int
    total_spent: float
    order_count: int
    last_purchase_date: Optional[date] = None
    is_vip: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PointRecordBase(BaseModel):
    change_type: str
    points: int
    source_type: Optional[str] = None
    source_id: Optional[int] = None
    description: Optional[str] = None


class PointRecordCreate(PointRecordBase):
    member_id: int
    cost_amount: Optional[float] = 0.0


class PointRecordResponse(PointRecordBase):
    id: int
    member_id: int
    balance_after: int
    cost_amount: float
    operator_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CouponTemplateBase(BaseModel):
    name: str
    coupon_type: str
    discount_value: float
    min_order_amount: Optional[float] = 0.0
    max_discount_amount: Optional[float] = None
    description: Optional[str] = None
    valid_days: Optional[int] = 30
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    total_quantity: Optional[int] = 0
    per_user_limit: Optional[int] = 1
    is_repurchase: Optional[bool] = False
    cost_per_unit: Optional[float] = 0.0
    brand_id: Optional[int] = None


class CouponTemplateCreate(CouponTemplateBase):
    code: str
    applicable_products: Optional[List[int]] = None
    applicable_categories: Optional[List[str]] = None


class CouponTemplateUpdate(BaseModel):
    name: Optional[str] = None
    discount_value: Optional[float] = None
    min_order_amount: Optional[float] = None
    description: Optional[str] = None
    total_quantity: Optional[int] = None
    is_active: Optional[bool] = None
    cost_per_unit: Optional[float] = None
    change_summary: Optional[str] = None


class CouponTemplateResponse(CouponTemplateBase):
    id: int
    code: str
    brand_id: Optional[int] = None
    issued_quantity: int
    used_quantity: int
    is_active: bool
    version: int
    created_at: datetime

    class Config:
        from_attributes = True


class MemberCouponBase(BaseModel):
    status: Optional[str] = "unused"


class MemberCouponIssue(BaseModel):
    member_ids: List[int]
    template_id: int
    source: Optional[str] = None


class MemberCouponResponse(MemberCouponBase):
    id: int
    member_id: int
    template_id: int
    coupon_code: str
    received_at: datetime
    valid_from: date
    valid_to: date
    used_at: Optional[datetime] = None
    source: Optional[str] = None
    template: Optional[CouponTemplateResponse] = None

    class Config:
        from_attributes = True


class PointBenefitBase(BaseModel):
    name: str
    benefit_type: str
    points_required: int
    description: Optional[str] = None
    value_amount: Optional[float] = 0.0
    cost_amount: Optional[float] = 0.0
    stock: Optional[int] = 0
    per_user_limit: Optional[int] = 1
    valid_days: Optional[int] = None
    image_url: Optional[str] = None
    brand_id: Optional[int] = None


class PointBenefitCreate(PointBenefitBase):
    pass


class PointBenefitUpdate(BaseModel):
    name: Optional[str] = None
    points_required: Optional[int] = None
    description: Optional[str] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None
    cost_amount: Optional[float] = None
    change_summary: Optional[str] = None


class PointBenefitResponse(PointBenefitBase):
    id: int
    total_issued: int
    is_active: bool
    version: int
    created_at: datetime

    class Config:
        from_attributes = True


class MemberBenefitResponse(BaseModel):
    id: int
    member_id: int
    benefit_id: int
    status: str
    received_at: datetime
    expired_at: Optional[datetime] = None
    used_at: Optional[datetime] = None
    points_consumed: int
    benefit: Optional[PointBenefitResponse] = None

    class Config:
        from_attributes = True


class PointProductBase(BaseModel):
    name: str
    sku: str
    category: Optional[str] = None
    points_required: int
    original_price: Optional[float] = 0.0
    cost_price: Optional[float] = 0.0
    description: Optional[str] = None
    images: Optional[List[str]] = None
    specs: Optional[List[Dict]] = None
    stock: Optional[int] = 0
    per_user_limit: Optional[int] = 1
    sort_order: Optional[int] = 0
    is_hot: Optional[bool] = False
    is_new: Optional[bool] = False
    brand_id: Optional[int] = None


class PointProductCreate(PointProductBase):
    pass


class PointProductUpdate(BaseModel):
    name: Optional[str] = None
    points_required: Optional[int] = None
    description: Optional[str] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None
    is_hot: Optional[bool] = None
    is_new: Optional[bool] = None
    sort_order: Optional[int] = None
    cost_price: Optional[float] = None
    change_summary: Optional[str] = None


class PointProductResponse(PointProductBase):
    id: int
    total_exchanged: int
    is_active: bool
    version: int
    created_at: datetime

    class Config:
        from_attributes = True


class RedemptionOrderBase(BaseModel):
    receiver_name: Optional[str] = None
    receiver_phone: Optional[str] = None
    receiver_address: Optional[str] = None
    remark: Optional[str] = None


class RedemptionOrderCreate(RedemptionOrderBase):
    product_id: int
    quantity: Optional[int] = 1


class RedemptionOrderUpdate(BaseModel):
    status: Optional[str] = None
    logistics_company: Optional[str] = None
    tracking_no: Optional[str] = None
    remark: Optional[str] = None


class RedemptionOrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    product_name: str
    product_image: Optional[str] = None
    points_per_unit: int
    quantity: int
    points_total: int

    class Config:
        from_attributes = True


class RedemptionOrderResponse(RedemptionOrderBase):
    id: int
    order_no: str
    member_id: int
    product_id: int
    quantity: int
    points_consumed: int
    cost_amount: float
    status: str
    logistics_company: Optional[str] = None
    tracking_no: Optional[str] = None
    operator_id: Optional[int] = None
    submitted_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime
    items: Optional[List[RedemptionOrderItemResponse]] = []

    class Config:
        from_attributes = True


class CrowdSegmentBase(BaseModel):
    name: str
    code: Optional[str] = None
    segment_type: Optional[str] = "dynamic"
    description: Optional[str] = None
    filter_conditions: Optional[Dict] = None
    member_ids: Optional[List[int]] = None
    brand_id: Optional[int] = None


class CrowdSegmentCreate(CrowdSegmentBase):
    pass


class CrowdSegmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    filter_conditions: Optional[Dict] = None
    member_ids: Optional[List[int]] = None
    is_active: Optional[bool] = None
    change_summary: Optional[str] = None


class CrowdSegmentResponse(CrowdSegmentBase):
    id: int
    estimated_count: int
    actual_count: int
    is_active: bool
    version: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReachTaskBase(BaseModel):
    name: str
    code: Optional[str] = None
    task_type: str
    channels: Optional[List[str]] = None
    content_template: Optional[Dict] = None
    coupon_template_id: Optional[int] = None
    benefit_id: Optional[int] = None
    points_reward: Optional[int] = 0
    estimated_budget: Optional[float] = 0.0
    schedule_type: Optional[str] = "immediate"
    scheduled_at: Optional[datetime] = None
    remark: Optional[str] = None
    brand_id: Optional[int] = None


class ReachTaskCreate(ReachTaskBase):
    crowd_id: int


class ReachTaskUpdate(BaseModel):
    name: Optional[str] = None
    channels: Optional[List[str]] = None
    content_template: Optional[Dict] = None
    status: Optional[str] = None
    remark: Optional[str] = None
    change_summary: Optional[str] = None


class ReachTaskResponse(ReachTaskBase):
    id: int
    crowd_id: int
    status: str
    actual_cost: float
    target_count: int
    sent_count: int
    delivered_count: int
    read_count: int
    clicked_count: int
    converted_count: int
    conversion_rate: float
    is_conflict_checked: bool
    version: int
    created_by: Optional[int] = None
    created_at: datetime
    approved_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DictItemBase(BaseModel):
    dict_type: str
    dict_code: str
    dict_label: str
    dict_value: Optional[Any] = None
    sort_order: Optional[int] = 0
    description: Optional[str] = None


class DictItemCreate(DictItemBase):
    pass


class DictItemUpdate(BaseModel):
    dict_label: Optional[str] = None
    dict_value: Optional[Any] = None
    sort_order: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    change_summary: Optional[str] = None


class DictItemResponse(DictItemBase):
    id: int
    is_active: bool
    version: int
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    notification_type: str
    title: str
    content: str
    target_user_id: Optional[int] = None
    target_role: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    priority: str
    is_read: bool
    data: Optional[Dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OperationLogResponse(BaseModel):
    id: int
    operator_id: int
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    entity_name: Optional[str] = None
    ip_address: Optional[str] = None
    change_summary: Optional[str] = None
    is_conflict_action: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ChangeHistoryResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    field_name: Optional[str] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    change_summary: Optional[str] = None
    changed_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AttachmentResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NoteResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    content: str
    is_internal: bool
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NoteCreate(BaseModel):
    entity_type: str
    entity_id: int
    content: str
    is_internal: Optional[bool] = True


class CostReportResponse(BaseModel):
    id: int
    report_type: str
    report_date: str
    brand_id: Optional[int] = None
    total_points_cost: float
    total_coupon_cost: float
    total_benefit_cost: float
    total_reach_cost: float
    total_cost: float
    points_issued: int
    points_redeemed: int
    coupons_issued: int
    coupons_used: int
    redemptions_count: int
    reach_tasks_count: int
    members_reached: int
    created_at: datetime

    class Config:
        from_attributes = True
