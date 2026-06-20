import uuid
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, and_
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_active_user, require_roles
from app.models import (
    User, PointProduct, PointProductVersion, RedemptionOrder,
    RedemptionOrderItem, MemberProfile, PointRecord, PointBenefit,
    PointBenefitVersion, MemberBenefit, UserRole, CostReport, Notification
)
from app.schemas import (
    PointProductCreate, PointProductUpdate, PointProductResponse,
    RedemptionOrderCreate, RedemptionOrderUpdate, RedemptionOrderResponse,
    PointBenefitCreate, PointBenefitUpdate, PointBenefitResponse,
    MemberBenefitResponse
)
from app.middleware import AuditMiddleware
from app.utils import serialize_model, generate_order_no, get_field_changes

router = APIRouter(tags=["积分商品与兑换"])


def _product_version_data(p: PointProduct) -> dict:
    return {
        "name": p.name,
        "category": p.category,
        "points_required": p.points_required,
        "original_price": p.original_price,
        "cost_price": p.cost_price,
        "description": p.description,
        "stock": p.stock,
        "per_user_limit": p.per_user_limit,
        "is_hot": p.is_hot,
        "is_new": p.is_new,
    }


def _benefit_version_data(b: PointBenefit) -> dict:
    return {
        "name": b.name,
        "benefit_type": b.benefit_type,
        "points_required": b.points_required,
        "value_amount": b.value_amount,
        "cost_amount": b.cost_amount,
        "stock": b.stock,
        "per_user_limit": b.per_user_limit,
        "valid_days": b.valid_days,
    }


# ============ 积分商品 ============

@router.get("/api/products", response_model=List[PointProductResponse])
async def list_products(
    keyword: Optional[str] = None,
    category: Optional[str] = None,
    is_hot: Optional[bool] = None,
    is_new: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    query = select(PointProduct).where(PointProduct.is_active == True)
    if keyword:
        query = query.where(or_(
            PointProduct.name.contains(keyword),
            PointProduct.sku.contains(keyword),
        ))
    if category:
        query = query.where(PointProduct.category == category)
    if is_hot is not None:
        query = query.where(PointProduct.is_hot == is_hot)
    if is_new is not None:
        query = query.where(PointProduct.is_new == is_new)

    query = query.order_by(PointProduct.sort_order.desc(), PointProduct.created_at.desc())
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/api/products", response_model=PointProductResponse)
async def create_product(
    data: PointProductCreate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PointProduct).where(PointProduct.sku == data.sku)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="SKU已存在")

    brand_id = data.brand_id
    if current_user.role == UserRole.BRAND_OPERATOR:
        brand_id = current_user.brand_id

    product = PointProduct(
        **data.model_dump(exclude_unset=True),
        brand_id=brand_id,
        created_by=current_user.id,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)

    version = PointProductVersion(
        product_id=product.id,
        version=1,
        name=product.name,
        data=_product_version_data(product),
        change_summary="初始创建",
        changed_by=current_user.id,
    )
    db.add(version)
    await db.commit()

    await AuditMiddleware.log_operation(
        user=current_user,
        action="create_point_product",
        entity_type="point_product",
        entity_id=product.id,
        entity_name=product.name,
        new_data=serialize_model(product),
        request=request,
    )

    return product


@router.get("/api/products/{product_id}", response_model=PointProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PointProduct).where(PointProduct.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    return product


@router.put("/api/products/{product_id}", response_model=PointProductResponse)
async def update_product(
    product_id: int,
    data: PointProductUpdate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PointProduct).where(PointProduct.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在")
    if current_user.role == UserRole.BRAND_OPERATOR and product.brand_id != current_user.brand_id:
        raise HTTPException(status_code=403, detail="无权限修改")

    old_data = serialize_model(product)
    update_data = data.model_dump(exclude_unset=True, exclude={"change_summary"})
    for field, value in update_data.items():
        setattr(product, field, value)

    product.version += 1
    version = PointProductVersion(
        product_id=product.id,
        version=product.version,
        name=product.name,
        data=_product_version_data(product),
        change_summary=data.change_summary or "修改商品",
        changed_by=current_user.id,
    )
    db.add(version)
    await db.commit()
    await db.refresh(product)

    await AuditMiddleware.log_operation(
        user=current_user,
        action="update_point_product",
        entity_type="point_product",
        entity_id=product.id,
        entity_name=product.name,
        old_data=old_data,
        new_data=serialize_model(product),
        request=request,
    )

    return product


# ============ 积分权益 ============

@router.get("/api/benefits", response_model=List[PointBenefitResponse])
async def list_benefits(
    benefit_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    query = select(PointBenefit).where(PointBenefit.is_active == True)
    if benefit_type:
        query = query.where(PointBenefit.benefit_type == benefit_type)
    query = query.order_by(PointBenefit.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/api/benefits", response_model=PointBenefitResponse)
async def create_benefit(
    data: PointBenefitCreate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    brand_id = data.brand_id
    if current_user.role == UserRole.BRAND_OPERATOR:
        brand_id = current_user.brand_id

    benefit = PointBenefit(
        **data.model_dump(exclude_unset=True),
        brand_id=brand_id,
        created_by=current_user.id,
    )
    db.add(benefit)
    await db.commit()
    await db.refresh(benefit)

    version = PointBenefitVersion(
        benefit_id=benefit.id,
        version=1,
        name=benefit.name,
        data=_benefit_version_data(benefit),
        change_summary="初始创建",
        changed_by=current_user.id,
    )
    db.add(version)
    await db.commit()

    await AuditMiddleware.log_operation(
        user=current_user,
        action="create_point_benefit",
        entity_type="point_benefit",
        entity_id=benefit.id,
        entity_name=benefit.name,
        new_data=serialize_model(benefit),
        request=request,
    )

    return benefit


@router.put("/api/benefits/{benefit_id}", response_model=PointBenefitResponse)
async def update_benefit(
    benefit_id: int,
    data: PointBenefitUpdate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PointBenefit).where(PointBenefit.id == benefit_id)
    )
    benefit = result.scalar_one_or_none()
    if not benefit:
        raise HTTPException(status_code=404, detail="权益不存在")
    if current_user.role == UserRole.BRAND_OPERATOR and benefit.brand_id != current_user.brand_id:
        raise HTTPException(status_code=403, detail="无权限修改")

    old_data = serialize_model(benefit)
    update_data = data.model_dump(exclude_unset=True, exclude={"change_summary"})
    for field, value in update_data.items():
        setattr(benefit, field, value)

    benefit.version += 1
    version = PointBenefitVersion(
        benefit_id=benefit.id,
        version=benefit.version,
        name=benefit.name,
        data=_benefit_version_data(benefit),
        change_summary=data.change_summary or "修改权益",
        changed_by=current_user.id,
    )
    db.add(version)
    await db.commit()
    await db.refresh(benefit)

    await AuditMiddleware.log_operation(
        user=current_user,
        action="update_point_benefit",
        entity_type="point_benefit",
        entity_id=benefit.id,
        entity_name=benefit.name,
        old_data=old_data,
        new_data=serialize_model(benefit),
        request=request,
    )

    return benefit


@router.get("/api/my-benefits", response_model=List[MemberBenefitResponse])
async def get_my_benefits(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MemberProfile.id).where(MemberProfile.user_id == current_user.id)
    )
    member_id = result.scalar_one_or_none()
    if not member_id:
        return []

    query = select(MemberBenefit).where(MemberBenefit.member_id == member_id)
    if status:
        query = query.where(MemberBenefit.status == status)
    query = query.order_by(desc(MemberBenefit.received_at))

    result = await db.execute(query)
    benefits = result.scalars().all()
    for b in benefits:
        await db.refresh(b, ["benefit"])
    return benefits


# ============ 兑换订单 ============

@router.post("/api/redemptions", response_model=RedemptionOrderResponse)
async def create_redemption(
    data: RedemptionOrderCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != UserRole.MEMBER:
        raise HTTPException(status_code=400, detail="仅会员可兑换商品")

    result = await db.execute(
        select(MemberProfile).where(MemberProfile.user_id == current_user.id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="会员资料不存在")

    result = await db.execute(
        select(PointProduct).where(PointProduct.id == data.product_id, PointProduct.is_active == True)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="商品不存在或已下架")

    quantity = data.quantity or 1
    total_points = product.points_required * quantity

    if member.available_points < total_points:
        raise HTTPException(status_code=400, detail="积分不足")
    if product.stock < quantity:
        raise HTTPException(status_code=400, detail="库存不足")

    existing_count_result = await db.execute(
        select(RedemptionOrder).where(
            RedemptionOrder.member_id == member.id,
            RedemptionOrder.product_id == data.product_id,
            RedemptionOrder.status.notin_(["cancelled"]),
        )
    )
    existing_count = len(existing_count_result.scalars().all())
    if product.per_user_limit > 0 and existing_count + quantity > product.per_user_limit:
        raise HTTPException(status_code=400, detail="超出每人限购数量")

    order_no = generate_order_no("RED")
    cost_amount = product.cost_price * quantity

    order = RedemptionOrder(
        order_no=order_no,
        member_id=member.id,
        product_id=data.product_id,
        quantity=quantity,
        points_consumed=total_points,
        cost_amount=cost_amount,
        status="submitted",
        receiver_name=data.receiver_name,
        receiver_phone=data.receiver_phone,
        receiver_address=data.receiver_address,
        remark=data.remark,
        submitted_at=datetime.utcnow(),
    )
    db.add(order)
    await db.flush()

    item = RedemptionOrderItem(
        order_id=order.id,
        product_id=product.id,
        product_name=product.name,
        product_image=(product.images or [None])[0] if product.images else None,
        points_per_unit=product.points_required,
        quantity=quantity,
        points_total=total_points,
    )
    db.add(item)

    member.available_points -= total_points
    member.frozen_points += total_points
    product.stock -= quantity
    product.total_exchanged += quantity

    point_record = PointRecord(
        member_id=member.id,
        change_type="redeem",
        points=-total_points,
        balance_after=member.available_points,
        source_type="redemption_order",
        source_id=order.id,
        cost_amount=cost_amount,
        description=f"兑换商品：{product.name}",
    )
    db.add(point_record)

    await db.commit()
    await db.refresh(order)

    return order


@router.get("/api/redemptions", response_model=List[RedemptionOrderResponse])
async def list_redemptions(
    status: Optional[str] = None,
    member_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(RedemptionOrder)

    if current_user.role == UserRole.MEMBER:
        result = await db.execute(
            select(MemberProfile.id).where(MemberProfile.user_id == current_user.id)
        )
        mem_id = result.scalar_one_or_none()
        if mem_id:
            query = query.where(RedemptionOrder.member_id == mem_id)
    else:
        if member_id:
            query = query.where(RedemptionOrder.member_id == member_id)
        if current_user.role == UserRole.BRAND_OPERATOR and current_user.brand_id:
            query = query.join(MemberProfile).where(MemberProfile.brand_id == current_user.brand_id)

    if status:
        query = query.where(RedemptionOrder.status == status)

    query = query.order_by(desc(RedemptionOrder.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().all()

    for order in orders:
        await db.refresh(order, ["items"])
    return orders


@router.get("/api/redemptions/{order_id}", response_model=RedemptionOrderResponse)
async def get_redemption(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RedemptionOrder).where(RedemptionOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="兑换订单不存在")

    if current_user.role == UserRole.MEMBER:
        mem_result = await db.execute(
            select(MemberProfile.id).where(MemberProfile.user_id == current_user.id)
        )
        mem_id = mem_result.scalar_one_or_none()
        if mem_id != order.member_id:
            raise HTTPException(status_code=403, detail="无权限查看")
    elif current_user.role == UserRole.BRAND_OPERATOR:
        mem_result = await db.execute(
            select(MemberProfile).where(MemberProfile.id == order.member_id)
        )
        member = mem_result.scalar_one_or_none()
        if member and member.brand_id != current_user.brand_id:
            raise HTTPException(status_code=403, detail="无权限查看")

    await db.refresh(order, ["items"])
    return order


@router.put("/api/redemptions/{order_id}", response_model=RedemptionOrderResponse)
async def update_redemption(
    order_id: int,
    data: RedemptionOrderUpdate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RedemptionOrder).where(RedemptionOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="兑换订单不存在")

    if current_user.role == UserRole.BRAND_OPERATOR and current_user.brand_id:
        mem_result = await db.execute(
            select(MemberProfile).where(MemberProfile.id == order.member_id)
        )
        member = mem_result.scalar_one_or_none()
        if member and member.brand_id != current_user.brand_id:
            raise HTTPException(status_code=403, detail="无权限操作")

    old_data = serialize_model(order)
    old_status = order.status
    update_data = data.model_dump(exclude_unset=True)

    if "status" in update_data:
        new_status = update_data["status"]
        now = datetime.utcnow()
        if new_status == "processed":
            order.processed_at = now
        elif new_status == "shipped":
            order.shipped_at = now
        elif new_status == "completed":
            order.completed_at = now
            mem_result = await db.execute(
                select(MemberProfile).where(MemberProfile.id == order.member_id)
            )
            member = mem_result.scalar_one_or_none()
            if member and member.frozen_points >= order.points_consumed:
                member.frozen_points -= order.points_consumed
        elif new_status == "cancelled":
            order.cancelled_at = now
            mem_result = await db.execute(
                select(MemberProfile).where(MemberProfile.id == order.member_id)
            )
            member = mem_result.scalar_one_or_none()
            prod_result = await db.execute(
                select(PointProduct).where(PointProduct.id == order.product_id)
            )
            product = prod_result.scalar_one_or_none()
            if member:
                refund_points = order.points_consumed
                if member.frozen_points >= refund_points:
                    member.frozen_points -= refund_points
                member.available_points += refund_points
                record = PointRecord(
                    member_id=member.id,
                    change_type="refund",
                    points=refund_points,
                    balance_after=member.available_points,
                    source_type="redemption_order",
                    source_id=order.id,
                    description=f"取消订单退回积分：{order.order_no}",
                )
                db.add(record)
            if product:
                product.stock += order.quantity

    for field, value in update_data.items():
        if field != "status":
            setattr(order, field, value)

    order.operator_id = current_user.id
    await db.commit()
    await db.refresh(order)
    await db.refresh(order, ["items"])

    await AuditMiddleware.log_operation(
        user=current_user,
        action="update_redemption_order",
        entity_type="redemption_order",
        entity_id=order.id,
        entity_name=order.order_no,
        old_data=old_data,
        new_data=serialize_model(order),
        request=request,
        is_conflict=("status" in update_data and update_data["status"] in ["completed", "cancelled"]),
    )

    return order
