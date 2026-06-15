from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.enums import RegistrationStatus, UserRole, RefundStatus
from app.schemas.common import (
    ResponseModel, PageResult, RegistrationCreate, RegistrationReview,
    RegistrationOut, RefundRequestCreate, RefundReview, RefundRequestOut,
)
from app.dependencies import get_current_user, require_roles
from app.utils import paginate
from app.services.registration_service import RegistrationService
from app.services.refund_service import RefundService
from app.models import Event, User, Order

router = APIRouter(prefix="/business", tags=["业务流程"])

admin_required = require_roles(UserRole.ADMIN, UserRole.OPERATOR)
finance_required = require_roles(UserRole.ADMIN, UserRole.FINANCE)


@router.post("/registrations", response_model=ResponseModel[RegistrationOut])
async def create_registration(
    data: RegistrationCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await RegistrationService.create(db, data, user.id)
    return await build_registration_out(obj, db)


@router.get("/registrations/my", response_model=ResponseModel[PageResult[RegistrationOut]])
async def list_my_registrations(
    page: int = 1,
    page_size: int = 20,
    status: Optional[RegistrationStatus] = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page, page_size = paginate(page, page_size)
    items, total = await RegistrationService.list(db, status=status, user_id=user.id, page=page, page_size=page_size)
    out_items = [await build_registration_out(r, db) for r in items]
    return ResponseModel(data=PageResult(
        items=out_items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.get("/registrations", response_model=ResponseModel[PageResult[RegistrationOut]])
async def list_registrations_admin(
    page: int = 1,
    page_size: int = 20,
    status: Optional[RegistrationStatus] = None,
    event_id: Optional[int] = None,
    keyword: Optional[str] = None,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    page, page_size = paginate(page, page_size)
    items, total = await RegistrationService.list(
        db, status=status, event_id=event_id, page=page, page_size=page_size, keyword=keyword
    )
    out_items = [await build_registration_out(r, db) for r in items]
    return ResponseModel(data=PageResult(
        items=out_items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.post("/registrations/{reg_id}/review", response_model=ResponseModel[RegistrationOut])
async def review_registration(
    reg_id: int,
    data: RegistrationReview,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    obj = await RegistrationService.review(db, reg_id, data, user.id)
    return await build_registration_out(obj, db)


@router.post("/registrations/batch-review", response_model=ResponseModel)
async def batch_review_registrations(
    ids: List[int],
    data: RegistrationReview,
    user=Depends(admin_required),
    db: AsyncSession = Depends(get_db),
):
    count = await RegistrationService.batch_review(db, ids, data, user.id)
    return ResponseModel(data={"reviewed": count})


@router.post("/refunds", response_model=ResponseModel[RefundRequestOut])
async def create_refund_request(
    data: RefundRequestCreate,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await RefundService.create_request(db, data, user.id)
    return await build_refund_out(obj, db)


@router.get("/refunds/my", response_model=ResponseModel[PageResult[RefundRequestOut]])
async def list_my_refunds(
    page: int = 1,
    page_size: int = 20,
    status: Optional[RefundStatus] = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page, page_size = paginate(page, page_size)
    items, total = await RefundService.list_requests(db, status=status, user_id=user.id, page=page, page_size=page_size)
    out_items = [await build_refund_out(r, db) for r in items]
    return ResponseModel(data=PageResult(
        items=out_items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.get("/refunds", response_model=ResponseModel[PageResult[RefundRequestOut]])
async def list_refunds_admin(
    page: int = 1,
    page_size: int = 20,
    status: Optional[RefundStatus] = None,
    event_id: Optional[int] = None,
    keyword: Optional[str] = None,
    user=Depends(finance_required),
    db: AsyncSession = Depends(get_db),
):
    page, page_size = paginate(page, page_size)
    items, total = await RefundService.list_requests(
        db, status=status, event_id=event_id, page=page, page_size=page_size, keyword=keyword
    )
    out_items = [await build_refund_out(r, db) for r in items]
    return ResponseModel(data=PageResult(
        items=out_items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.get("/refunds/{refund_id}", response_model=ResponseModel[RefundRequestOut])
async def get_refund_detail(
    refund_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    obj = await RefundService.get_detail(db, refund_id)
    if obj.user_id != user.id and user.role not in (UserRole.ADMIN, UserRole.FINANCE):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="无权查看")
    return await build_refund_out(obj, db)


@router.post("/refunds/{refund_id}/review", response_model=ResponseModel[RefundRequestOut])
async def review_refund(
    refund_id: int,
    data: RefundReview,
    user=Depends(finance_required),
    db: AsyncSession = Depends(get_db),
):
    obj = await RefundService.review(db, refund_id, data, user.id)
    return await build_refund_out(obj, db)


async def build_registration_out(reg, db):
    out = RegistrationOut.model_validate(reg)
    if reg.event:
        out.event_name = reg.event.name
    if reg.user:
        out.user_name = reg.user.real_name or reg.user.username
        out.user_email = reg.user.email
        out.user_phone = reg.user.phone
    return out


async def build_refund_out(req, db):
    out = RefundRequestOut.model_validate(req)
    if req.order:
        out.order_no = req.order.order_no
        out.event_id = req.order.event_id
        if req.order.event:
            out.event_name = req.order.event.name
    if req.user_id:
        from sqlalchemy import select as sel
        ur = await db.execute(sel(User).where(User.id == req.user_id))
        u = ur.scalar_one_or_none()
        if u:
            out.user_name = u.real_name or u.username
    return out
