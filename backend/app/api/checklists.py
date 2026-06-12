from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import date
from ..core.database import get_db
from ..core.security import get_current_user, require_roles
from ..schemas.checklist import (
    ChecklistCreate, ChecklistUpdate, ChecklistResponse, ChecklistList,
    SubmissionCreate, SubmissionUpdate, SubmissionResponse, SubmissionList,
    ChecklistAnswerCreate, ChecklistAnswerUpdate, ChecklistAnswerResponse,
    SubmissionAnswerBatchUpdate, ChecklistItemResponse,
)
from ..models import (
    Checklist, ChecklistItem, ChecklistSubmission, ChecklistAnswer, User,
    ChecklistStatus, AnswerStatus, UserRole, ComplianceGap,
)

router = APIRouter()


def _seed_sample_checklist(db: Session):
    if db.query(Checklist).count() > 0:
        return
    sample = Checklist(
        name="数据合规通用检查清单（V2.1）",
        description="用于日常数据处理合同的合规性基础检查",
        contract_version="V2.1",
        category="数据合规",
        is_active=True,
        created_by=1,
    )
    db.add(sample)
    db.flush()
    items_data = [
        ("数据处理范围", "是否明确约定了数据处理的目的、方式和范围？", "需附数据处理清单或DPA附件", "high"),
        ("数据处理范围", "是否限定了数据最小化原则？", "查看合同条款", "medium"),
        ("合法性基础", "是否约定了数据处理的合法性基础（同意/合同/公共利益等）？", "需明确具体基础类型", "high"),
        ("合法性基础", "处理特殊类型数据是否取得单独明示同意？", "敏感个人数据需提供同意证明", "critical"),
        ("数据主体权利", "是否约定了数据主体权利响应机制（查询/更正/删除/可携带）？", "权利响应SLA说明", "medium"),
        ("数据主体权利", "是否约定了投诉处理流程和时限？", "处理流程文本", "low"),
        ("安全措施", "是否约定了数据安全技术和组织措施？", "加密、访问控制、审计等", "high"),
        ("安全措施", "是否约定了数据泄露事件通知时限？", "通常要求72小时内通知", "critical"),
        ("跨境传输", "涉及跨境传输是否约定了合法路径？", "标准合同/认证/安全评估", "high"),
        ("跨境传输", "是否明确了接收方所在国家或地区的数据保护水平？", "提供评估报告", "medium"),
        ("合同终止", "是否约定了合同终止后的数据删除或返还义务？", "删除时限和验证方式", "high"),
        ("合同终止", "是否约定了审计和检查权利？", "审计频率和范围", "medium"),
    ]
    for idx, (sec, q, evidence, risk) in enumerate(items_data):
        item = ChecklistItem(
            checklist_id=sample.id,
            item_order=idx + 1,
            section=sec,
            question=q,
            description=q,
            required_evidence=evidence,
            default_risk_level=risk,
            is_required=True,
        )
        db.add(item)
    db.commit()


@router.get("/templates", response_model=ChecklistList)
def list_templates(
    keyword: Optional[str] = None,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _seed_sample_checklist(db)
    q = db.query(Checklist)
    if keyword:
        kw = f"%{keyword}%"
        q = q.filter(or_(Checklist.name.like(kw), Checklist.description.like(kw)))
    if category:
        q = q.filter(Checklist.category == category)
    if is_active is not None:
        q = q.filter(Checklist.is_active == is_active)
    total = q.count()
    items = q.order_by(Checklist.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ChecklistList(total=total, items=[ChecklistResponse.model_validate(c) for c in items])


@router.get("/templates/{tid}", response_model=ChecklistResponse)
def get_template(tid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    c = db.query(Checklist).filter(Checklist.id == tid).first()
    if not c:
        raise HTTPException(status_code=404, detail="检查清单模板不存在")
    return ChecklistResponse.model_validate(c)


@router.post("/templates", response_model=ChecklistResponse)
def create_template(
    req: ChecklistCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_roles(UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER)),
):
    c = Checklist(
        name=req.name,
        description=req.description,
        contract_version=req.contract_version,
        category=req.category,
        is_active=req.is_active,
        created_by=current.id,
    )
    db.add(c)
    db.flush()
    for it in req.items:
        db.add(ChecklistItem(checklist_id=c.id, **it.model_dump()))
    db.commit()
    db.refresh(c)
    return ChecklistResponse.model_validate(c)


@router.patch("/templates/{tid}", response_model=ChecklistResponse)
def update_template(
    tid: int,
    req: ChecklistUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER)),
):
    c = db.query(Checklist).filter(Checklist.id == tid).first()
    if not c:
        raise HTTPException(status_code=404, detail="检查清单模板不存在")
    data = req.model_dump(exclude_unset=True)
    items = data.pop("items", None)
    for k, v in data.items():
        setattr(c, k, v)
    if items is not None:
        db.query(ChecklistItem).filter(ChecklistItem.checklist_id == c.id).delete()
        for it in items:
            db.add(ChecklistItem(checklist_id=c.id, **it))
    db.commit()
    db.refresh(c)
    return ChecklistResponse.model_validate(c)


@router.get("/submissions", response_model=SubmissionList)
def list_submissions(
    status: Optional[ChecklistStatus] = None,
    risk_level: Optional[str] = None,
    submitter_id: Optional[int] = None,
    deadline_from: Optional[date] = None,
    deadline_to: Optional[date] = None,
    keyword: Optional[str] = None,
    mine: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _seed_sample_checklist(db)
    q = db.query(ChecklistSubmission)
    if mine:
        q = q.filter(ChecklistSubmission.submitter_id == current.id)
    if status:
        q = q.filter(ChecklistSubmission.status == status)
    if risk_level:
        q = q.filter(ChecklistSubmission.risk_level == risk_level)
    if submitter_id:
        q = q.filter(ChecklistSubmission.submitter_id == submitter_id)
    if deadline_from:
        q = q.filter(ChecklistSubmission.deadline >= deadline_from)
    if deadline_to:
        q = q.filter(ChecklistSubmission.deadline <= deadline_to)
    if keyword:
        kw = f"%{keyword}%"
        q = q.filter(or_(ChecklistSubmission.contract_name.like(kw), ChecklistSubmission.counterparty.like(kw)))
    total = q.count()
    items = q.order_by(ChecklistSubmission.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return SubmissionList(total=total, items=[SubmissionResponse.model_validate(s) for s in items])


@router.get("/submissions/{sid}", response_model=SubmissionResponse)
def get_submission(sid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    s = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == sid).first()
    if not s:
        raise HTTPException(status_code=404, detail="提交记录不存在")
    resp = SubmissionResponse.model_validate(s)
    for a in resp.answers:
        item = db.query(ChecklistItem).filter(ChecklistItem.id == a.item_id).first()
        if item:
            a.item = ChecklistItemResponse.model_validate(item)
    return resp


@router.post("/submissions", response_model=SubmissionResponse)
def create_submission(
    req: SubmissionCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    template = db.query(Checklist).filter(Checklist.id == req.checklist_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="检查清单模板不存在")
    s = ChecklistSubmission(
        checklist_id=req.checklist_id,
        submitter_id=current.id,
        contract_name=req.contract_name,
        contract_version=req.contract_version,
        counterparty=req.counterparty,
        contract_amount=req.contract_amount,
        deadline=req.deadline,
        risk_level=req.risk_level,
        status=ChecklistStatus.DRAFT,
    )
    db.add(s)
    db.flush()
    item_ids_from_req = {a.item_id for a in req.answers}
    template_items = {it.id: it for it in template.items}
    for ans in req.answers:
        if ans.item_id in template_items:
            db.add(ChecklistAnswer(submission_id=s.id, **ans.model_dump()))
    for tid, tpl_item in template_items.items():
        if tid not in item_ids_from_req and tpl_item.is_required:
            db.add(ChecklistAnswer(
                submission_id=s.id,
                item_id=tid,
                status=AnswerStatus.PENDING,
            ))
    db.commit()
    db.refresh(s)
    return SubmissionResponse.model_validate(s)


@router.patch("/submissions/{sid}", response_model=SubmissionResponse)
def update_submission(
    sid: int,
    req: SubmissionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    s = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == sid).first()
    if not s:
        raise HTTPException(status_code=404, detail="提交记录不存在")
    data = req.model_dump(exclude_unset=True)
    old_status = s.status
    for k, v in data.items():
        setattr(s, k, v)
    if "status" in data and old_status != ChecklistStatus.SUBMITTED and data["status"] == ChecklistStatus.SUBMITTED:
        s.submitted_at = __import__("datetime").datetime.utcnow()
    db.commit()
    db.refresh(s)
    return SubmissionResponse.model_validate(s)


@router.post("/submissions/{sid}/answers/batch")
def batch_update_answers(
    sid: int,
    req: SubmissionAnswerBatchUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    s = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == sid).first()
    if not s:
        raise HTTPException(status_code=404, detail="提交记录不存在")
    answers_by_item = {a.item_id: a for a in s.answers}
    for ans_dto in req.answers:
        existing = answers_by_item.get(ans_dto.item_id)
        if existing:
            for k, v in ans_dto.model_dump(exclude_unset=True).items():
                setattr(existing, k, v)
    non_compliant_count = sum(1 for a in s.answers if a.status in (AnswerStatus.NON_COMPLIANT, AnswerStatus.PARTIAL))
    pending_count = sum(1 for a in s.answers if a.status == AnswerStatus.PENDING)
    total = max(len(s.answers), 1)
    s.overall_score = round(100 * (1 - (non_compliant_count + pending_count * 0.3) / total), 2)
    db.commit()
    return {"updated": len(req.answers), "overall_score": s.overall_score}


@router.post("/submissions/{sid}/submit", response_model=SubmissionResponse)
def submit_for_review(sid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    s = db.query(ChecklistSubmission).filter(ChecklistSubmission.id == sid).first()
    if not s:
        raise HTTPException(status_code=404, detail="提交记录不存在")
    s.status = ChecklistStatus.SUBMITTED
    s.submitted_at = __import__("datetime").datetime.utcnow()
    db.commit()
    db.refresh(s)
    return SubmissionResponse.model_validate(s)


@router.get("/submissions/{sid}/gaps")
def list_submission_gaps(sid: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from ..models import ComplianceGap
    gaps = db.query(ComplianceGap).filter(ComplianceGap.submission_id == sid).order_by(ComplianceGap.created_at.desc()).all()
    return {"total": len(gaps), "items": [
        {
            "id": g.id,
            "description": g.description,
            "severity": g.severity.value,
            "status": g.status.value,
            "remediation_plan": g.remediation_plan,
            "remediation_deadline": g.remediation_deadline.isoformat() if g.remediation_deadline else None,
            "created_at": g.created_at.isoformat() if g.created_at else None,
            "item_id": g.item_id,
        }
        for g in gaps
    ]}
