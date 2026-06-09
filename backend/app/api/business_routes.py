from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.business import (
    SmsTemplateCreate, SmsTemplateUpdate, SmsTemplateResponse,
    SmsSendRequest, SmsSendResponse,
    CallbackCreate, CallbackUpdate, CallbackResponse,
    CallbackListGenerateRequest,
    ManualFeedbackCreate, ManualFeedbackUpdate, ManualFeedbackResponse,
    BatchFeedbackRequest, BatchFeedbackResponse,
    DashboardResponse,
)
from app.services.business_service import SmsStrategyService, CallbackService
from app.services.feedback_service import FeedbackService
from app.services.model_service import DashboardService
from app.models.user import User

router = APIRouter(tags=["业务运营"])


sms_router = APIRouter(prefix="/sms", tags=["短信策略"])


@sms_router.get("/templates", response_model=list[SmsTemplateResponse])
def list_sms_templates(
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return SmsStrategyService.list_templates(db, is_active=is_active)


@sms_router.post("/templates", response_model=SmsTemplateResponse)
def create_sms_template(
    data: SmsTemplateCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin"])),
):
    return SmsStrategyService.create_template(db, data)


@sms_router.put("/templates/{tpl_id}", response_model=SmsTemplateResponse)
def update_sms_template(
    tpl_id: int, data: SmsTemplateUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin"])),
):
    from app.models.sms import SmsTemplate
    tpl = db.query(SmsTemplate).filter(SmsTemplate.id == tpl_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="短信模板不存在")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tpl, field, value)
    db.commit()
    db.refresh(tpl)
    return tpl


@sms_router.post("/send", response_model=SmsSendResponse)
def send_sms(
    request: SmsSendRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin", "operator"])),
):
    return SmsStrategyService.send_sms(db, request)


@sms_router.post("/auto-send")
def auto_send_sms(
    batch_id: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin", "operator"])),
):
    sent = SmsStrategyService.auto_send_strategy(db, batch_id)
    return {"success": True, "sent_by_level": sent, "total": sum(sent.values())}


callback_router = APIRouter(prefix="/callbacks", tags=["人工回访"])


@callback_router.post("/generate")
def generate_callback_list(
    request: CallbackListGenerateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin", "operator"])),
):
    return CallbackService.generate_callback_list(db, request)


@callback_router.get("", response_model=list)
def list_callbacks(
    skip: int = 0, limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return CallbackService.list_callbacks(
        db, skip=skip, limit=limit, status=status,
        priority=priority, assigned_to=assigned_to
    )


@callback_router.put("/{cb_id}")
def update_callback(
    cb_id: int, data: CallbackUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin", "operator"])),
):
    cb = CallbackService.update_callback(db, cb_id, data)
    if not cb:
        raise HTTPException(status_code=404, detail="回访记录不存在")
    return {"success": True, "message": "回访记录已更新"}


feedback_router = APIRouter(prefix="/feedback", tags=["人工反馈闭环"])


@feedback_router.post("", response_model=ManualFeedbackResponse)
def create_feedback(
    data: ManualFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "operator"])),
):
    fb = FeedbackService.create_feedback(db, data, current_user.id)
    if not fb:
        raise HTTPException(status_code=400, detail="创建反馈失败")
    return fb


@feedback_router.post("/batch", response_model=BatchFeedbackResponse)
def batch_create_feedback(
    request: BatchFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "operator"])),
):
    return FeedbackService.batch_create_feedback(db, request, current_user.id)


@feedback_router.post("/confirm")
def batch_confirm_feedback(
    feedback_ids: List[int],
    comment: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    count = FeedbackService.batch_confirm(db, feedback_ids, current_user.id, comment)
    return {"success": True, "confirmed_count": count}


@feedback_router.get("", response_model=list)
def list_feedback(
    skip: int = 0, limit: int = 100,
    review_status: Optional[str] = None,
    feedback_type: Optional[str] = None,
    is_error_sample: Optional[bool] = None,
    error_type: Optional[str] = None,
    operator_id: Optional[int] = None,
    batch_id: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return FeedbackService.list_feedback(
        db, skip=skip, limit=limit, review_status=review_status,
        feedback_type=feedback_type, is_error_sample=is_error_sample,
        error_type=error_type, operator_id=operator_id, batch_id=batch_id
    )


@feedback_router.put("/{fb_id}", response_model=ManualFeedbackResponse)
def update_feedback(
    fb_id: int, data: ManualFeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "operator"])),
):
    fb = FeedbackService.update_feedback(db, fb_id, data, current_user.id)
    if not fb:
        raise HTTPException(status_code=404, detail="反馈记录不存在")
    return fb


@feedback_router.get("/error-samples")
def get_error_samples(
    skip: int = 0, limit: int = 100,
    error_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return FeedbackService.get_error_samples(
        db, skip=skip, limit=limit, error_type=error_type
    )


@feedback_router.get("/error-statistics")
def get_error_statistics(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return FeedbackService.get_error_statistics(db)


dashboard_router = APIRouter(prefix="/dashboard", tags=["效果看板"])


@dashboard_router.get("", response_model=DashboardResponse)
def get_dashboard(
    days: int = 30,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return DashboardService.get_dashboard(db, days=days)


router.include_router(sms_router)
router.include_router(callback_router)
router.include_router(feedback_router)
router.include_router(dashboard_router)
