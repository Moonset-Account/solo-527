from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, create_audit_log
from app.models import (
    User, ChangeRequest, ApprovalRecord,
    RequestType, RequestStatus, ApprovalStage,
    LogAction, UserRole
)
from app.schemas.request import (
    ChangeRequestCreate, ChangeRequestUpdate, ChangeRequestResponse,
    ChangeWindowUpdate, ChangeWindowApprove,
    RollbackPlanUpdate, RollbackPlanApprove,
    ImplementationResult, ApprovalRecordResponse
)

router = APIRouter(prefix="/requests", tags=["申请管理"])


@router.get("", response_model=List[ChangeRequestResponse])
def list_requests(
    skip: int = 0,
    limit: int = 100,
    status: Optional[RequestStatus] = None,
    request_type: Optional[RequestType] = None,
    my_requests: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ChangeRequest)

    if my_requests:
        query = query.filter(ChangeRequest.requester_id == current_user.id)
    elif current_user.role == UserRole.USER:
        query = query.filter(ChangeRequest.requester_id == current_user.id)

    if status:
        query = query.filter(ChangeRequest.status == status)
    if request_type:
        query = query.filter(ChangeRequest.request_type == request_type)

    requests = query.order_by(ChangeRequest.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for req in requests:
        resp = ChangeRequestResponse.model_validate(req)
        resp.requester_name = req.requester.full_name or req.requester.username
        result.append(resp)

    return result


@router.post("", response_model=ChangeRequestResponse)
def create_request(
    request: Request,
    req_data: ChangeRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_req = ChangeRequest(
        request_type=req_data.request_type,
        title=req_data.title,
        description=req_data.description,
        requester_id=current_user.id,
        target_account=req_data.target_account,
        change_type=req_data.change_type,
        change_details=req_data.change_details,
        fault_level=req_data.fault_level,
        fault_device=req_data.fault_device
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.CREATE_REQUEST,
        resource_type="request",
        resource_id=new_req.id,
        description=f"创建{req_data.request_type.value}申请: {req_data.title}",
        ip_address=client_ip
    )

    resp = ChangeRequestResponse.model_validate(new_req)
    resp.requester_name = current_user.full_name or current_user.username
    return resp


@router.get("/{request_id}", response_model=ChangeRequestResponse)
def get_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="申请不存在"
        )

    if current_user.role == UserRole.USER and req.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权查看此申请"
        )

    resp = ChangeRequestResponse.model_validate(req)
    resp.requester_name = req.requester.full_name or req.requester.username
    for record in resp.approval_records:
        approver = db.query(User).filter(User.id == record.approver_id).first()
        if approver:
            record.approver_name = approver.full_name or approver.username

    return resp


@router.put("/{request_id}", response_model=ChangeRequestResponse)
def update_request(
    request: Request,
    request_id: int,
    req_data: ChangeRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="申请不存在"
        )

    if req.requester_id != current_user.id and current_user.role == UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此申请"
        )

    if req.status not in [RequestStatus.PENDING, RequestStatus.REJECTED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前状态不允许修改"
        )

    update_data = req_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(req, key, value)

    db.commit()
    db.refresh(req)

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.UPDATE_CONFIG,
        resource_type="request",
        resource_id=request_id,
        description=f"更新申请: {req.title}",
        ip_address=client_ip
    )

    resp = ChangeRequestResponse.model_validate(req)
    resp.requester_name = req.requester.full_name or req.requester.username
    return resp


@router.put("/{request_id}/change-window")
def update_change_window(
    request: Request,
    request_id: int,
    data: ChangeWindowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="申请不存在"
        )

    if req.requester_id != current_user.id and current_user.role == UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此申请"
        )

    if req.current_stage != ApprovalStage.CHANGE_WINDOW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前阶段不允许修改变更窗口"
        )

    req.change_window_start = data.change_window_start
    req.change_window_end = data.change_window_end
    db.commit()

    return {"message": "变更窗口已更新"}


@router.post("/{request_id}/approve-change-window")
def approve_change_window(
    request: Request,
    request_id: int,
    data: ChangeWindowApprove,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    req = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="申请不存在"
        )

    if req.current_stage != ApprovalStage.CHANGE_WINDOW:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前阶段不是变更窗口审批"
        )

    if req.change_window_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="变更窗口已审批"
        )

    if not req.change_window_start or not req.change_window_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先设置变更窗口时间"
        )

    req.change_window_approved = data.approved
    req.change_window_approver_id = current_user.id
    req.change_window_comment = data.comment

    approval_record = ApprovalRecord(
        request_id=request_id,
        approver_id=current_user.id,
        stage=ApprovalStage.CHANGE_WINDOW,
        action="approve" if data.approved else "reject",
        comment=data.comment
    )
    db.add(approval_record)

    if data.approved:
        req.current_stage = ApprovalStage.ROLLBACK_PLAN
        req.status = RequestStatus.IN_PROGRESS
    else:
        req.status = RequestStatus.REJECTED

    db.commit()

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.APPROVE_REQUEST if data.approved else LogAction.REJECT_REQUEST,
        resource_type="request",
        resource_id=request_id,
        description=f"{'通过' if data.approved else '拒绝'}变更窗口审批: {req.title}",
        ip_address=client_ip
    )

    return {"message": "审批已提交", "approved": data.approved}


@router.put("/{request_id}/rollback-plan")
def update_rollback_plan(
    request: Request,
    request_id: int,
    data: RollbackPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="申请不存在"
        )

    if req.requester_id != current_user.id and current_user.role == UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权修改此申请"
        )

    if req.current_stage != ApprovalStage.ROLLBACK_PLAN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前阶段不允许修改回滚方案"
        )

    if not req.change_window_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先通过变更窗口审批"
        )

    req.rollback_plan = data.rollback_plan
    db.commit()

    return {"message": "回滚方案已更新"}


@router.post("/{request_id}/approve-rollback-plan")
def approve_rollback_plan(
    request: Request,
    request_id: int,
    data: RollbackPlanApprove,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    req = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="申请不存在"
        )

    if req.current_stage != ApprovalStage.ROLLBACK_PLAN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前阶段不是回滚方案审批"
        )

    if req.rollback_plan_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="回滚方案已审批"
        )

    if not req.rollback_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先提交回滚方案"
        )

    req.rollback_plan_approved = data.approved
    req.rollback_plan_approver_id = current_user.id
    req.rollback_plan_comment = data.comment

    approval_record = ApprovalRecord(
        request_id=request_id,
        approver_id=current_user.id,
        stage=ApprovalStage.ROLLBACK_PLAN,
        action="approve" if data.approved else "reject",
        comment=data.comment
    )
    db.add(approval_record)

    if data.approved:
        req.current_stage = ApprovalStage.IMPLEMENTATION
    else:
        req.current_stage = ApprovalStage.ROLLBACK_PLAN
        req.status = RequestStatus.REJECTED

    db.commit()

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.APPROVE_REQUEST if data.approved else LogAction.REJECT_REQUEST,
        resource_type="request",
        resource_id=request_id,
        description=f"{'通过' if data.approved else '拒绝'}回滚方案审批: {req.title}",
        ip_address=client_ip
    )

    return {"message": "审批已提交", "approved": data.approved}


@router.post("/{request_id}/implementation")
def submit_implementation_result(
    request: Request,
    request_id: int,
    data: ImplementationResult,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    req = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="申请不存在"
        )

    if req.current_stage != ApprovalStage.IMPLEMENTATION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前阶段不允许提交实施结果"
        )

    req.implementation_result = data.implementation_result
    req.is_rolled_back = data.is_rolled_back
    req.rollback_reason = data.rollback_reason

    if data.is_rolled_back:
        req.status = RequestStatus.ROLLED_BACK
    else:
        req.status = RequestStatus.COMPLETED

    db.commit()

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.UPDATE_CONFIG,
        resource_type="request",
        resource_id=request_id,
        description=f"提交实施结果: {req.title}, 状态: {'已回滚' if data.is_rolled_back else '已完成'}",
        ip_address=client_ip
    )

    return {"message": "实施结果已提交"}


@router.get("/{request_id}/approvals", response_model=List[ApprovalRecordResponse])
def get_approval_history(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="申请不存在"
        )

    if current_user.role == UserRole.USER and req.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权查看此申请"
        )

    records = db.query(ApprovalRecord).filter(ApprovalRecord.request_id == request_id).order_by(ApprovalRecord.created_at.desc()).all()
    result = []
    for record in records:
        resp = ApprovalRecordResponse.model_validate(record)
        approver = db.query(User).filter(User.id == record.approver_id).first()
        if approver:
            resp.approver_name = approver.full_name or approver.username
        result.append(resp)

    return result
