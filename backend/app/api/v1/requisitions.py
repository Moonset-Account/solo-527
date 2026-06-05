from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from ...database import get_db
from ...security import get_current_user, RoleChecker
from ... import crud, schemas, models
from ...services import logger, notification_service

router = APIRouter()

allow_all = RoleChecker([models.UserRole.ADMIN, models.UserRole.MEMBER, models.UserRole.EXTERNAL])
allow_admin_member = RoleChecker([models.UserRole.ADMIN, models.UserRole.MEMBER])


@router.get("", response_model=List[schemas.Requisition])
def read_requisitions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[models.RequisitionStatus] = None,
    my: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if my:
        return crud.requisition.get_by_applicant(db, applicant_id=current_user.id, skip=skip, limit=limit)
    if current_user.role == models.UserRole.ADMIN:
        if status:
            return crud.requisition.get_multi_by_filter(db, filters={"status": status}, skip=skip, limit=limit)
        return crud.requisition.get_multi(db, skip=skip, limit=limit)
    return crud.requisition.get_by_applicant(db, applicant_id=current_user.id, skip=skip, limit=limit)


@router.get("/pending-approval", response_model=List[schemas.Requisition])
def get_pending_approval(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_admin_member)
):
    return crud.requisition.get_pending_approval(db, skip=skip, limit=limit)


@router.get("/pending-confirmation", response_model=List[schemas.Requisition])
def get_pending_confirmation(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.requisition.get_pending_confirmation(db, user_id=current_user.id, skip=skip, limit=limit)


@router.post("", response_model=schemas.Requisition, dependencies=[Depends(allow_all)])
def create_requisition(
    request: Request,
    requisition_in: schemas.RequisitionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    requisition = crud.requisition.create(db, obj_in=requisition_in, created_by=current_user.id)
    
    notification_service.notify_admins(
        db,
        type=models.NotificationType.REQUISITION_CREATED,
        title=f"新的领用申请: {requisition.title}",
        message=f"用户 {current_user.full_name} 提交了领用申请 {requisition.requisition_number}，请审批。",
        related_type="requisition",
        related_id=requisition.id
    )
    
    if requisition.requires_double_confirm:
        notification_service.notify_admins(
            db,
            type=models.NotificationType.CONFIRMATION_REQUIRED,
            title=f"高危试剂领用需要双人确认: {requisition.title}",
            message=f"领用申请 {requisition.requisition_number} 包含高危试剂，需要双人确认。",
            related_type="requisition",
            related_id=requisition.id
        )
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.CREATE,
        resource_type="requisition",
        resource_id=requisition.id,
        details=f"创建领用申请 {requisition.requisition_number}",
        ip_address=request.client.host if request.client else None
    )
    return requisition


@router.get("/{requisition_id}", response_model=schemas.Requisition)
def read_requisition(
    requisition_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    requisition = crud.requisition.get(db, id=requisition_id)
    if not requisition:
        raise HTTPException(status_code=404, detail="领用申请不存在")
    
    if current_user.role not in [models.UserRole.ADMIN] and requisition.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权查看")
    
    return requisition


@router.put("/{requisition_id}/confirm", response_model=schemas.Requisition)
def confirm_requisition(
    request: Request,
    requisition_id: int,
    confirm_data: schemas.RequisitionConfirm,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_admin_member)
):
    requisition = crud.requisition.get(db, id=requisition_id)
    if not requisition:
        raise HTTPException(status_code=404, detail="领用申请不存在")
    
    if not requisition.requires_double_confirm:
        raise HTTPException(status_code=400, detail="此申请不需要双人确认")
    
    if requisition.applicant_id == current_user.id:
        raise HTTPException(status_code=400, detail="申请人不能确认自己的申请")
    
    is_first = requisition.first_confirmer_id is None
    if not is_first and requisition.first_confirmer_id == current_user.id:
        raise HTTPException(status_code=400, detail="不能重复确认")
    
    if confirm_data.confirm:
        requisition = crud.requisition.confirm(
            db, requisition_id=requisition_id, confirmer_id=current_user.id, is_first=is_first
        )
        
        crud.audit_log.create_log(
            db, user_id=current_user.id, username=current_user.username,
            action=models.AuditAction.CONFIRM,
            resource_type="requisition",
            resource_id=requisition.id,
            details=f"{'第一' if is_first else '第二'}确认领用申请 {requisition.requisition_number}",
            ip_address=request.client.host if request.client else None
        )
    else:
        requisition.status = models.RequisitionStatus.REJECTED
        requisition.rejection_reason = confirm_data.remarks or "双人确认不通过"
        db.commit()
        db.refresh(requisition)
    
    return requisition


@router.put("/{requisition_id}/approve", response_model=schemas.Requisition)
def approve_requisition(
    request: Request,
    requisition_id: int,
    approve_data: schemas.RequisitionApprove,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_admin_member)
):
    requisition = crud.requisition.get(db, id=requisition_id)
    if not requisition:
        raise HTTPException(status_code=404, detail="领用申请不存在")
    
    if requisition.status not in [models.RequisitionStatus.PENDING, models.RequisitionStatus.APPROVED]:
        raise HTTPException(status_code=400, detail="当前状态不允许审批")
    
    if requisition.requires_double_confirm:
        if not (requisition.first_confirmer_id and requisition.second_confirmer_id):
            raise HTTPException(status_code=400, detail="需要先完成双人确认")
    
    if approve_data.approve:
        requisition = crud.requisition.approve(
            db, requisition_id=requisition_id, approver_id=current_user.id
        )
        
        notification_service.create_notification(
            db,
            user_id=requisition.applicant_id,
            type=models.NotificationType.REQUISITION_APPROVED,
            title=f"领用申请已批准: {requisition.title}",
            message=f"您的领用申请 {requisition.requisition_number} 已批准。",
            related_type="requisition",
            related_id=requisition.id
        )
        
        action = models.AuditAction.APPROVE
        details = f"批准领用申请 {requisition.requisition_number}"
    else:
        requisition = crud.requisition.reject(
            db, requisition_id=requisition_id, approver_id=current_user.id,
            reason=approve_data.rejection_reason or "审批不通过"
        )
        
        notification_service.create_notification(
            db,
            user_id=requisition.applicant_id,
            type=models.NotificationType.REQUISITION_REJECTED,
            title=f"领用申请被驳回: {requisition.title}",
            message=f"您的领用申请 {requisition.requisition_number} 被驳回。原因: {approve_data.rejection_reason}",
            related_type="requisition",
            related_id=requisition.id
        )
        
        action = models.AuditAction.REJECT
        details = f"驳回领用申请 {requisition.requisition_number}"
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=action,
        resource_type="requisition",
        resource_id=requisition.id,
        details=details,
        ip_address=request.client.host if request.client else None
    )
    
    return requisition


@router.put("/{requisition_id}/pick-up", response_model=schemas.Requisition)
def pick_up_requisition(
    request: Request,
    requisition_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_admin_member)
):
    requisition = crud.requisition.get(db, id=requisition_id)
    if not requisition:
        raise HTTPException(status_code=404, detail="领用申请不存在")
    
    if requisition.status != models.RequisitionStatus.APPROVED:
        raise HTTPException(status_code=400, detail="只有已批准的申请可以领用")
    
    requisition = crud.requisition.pick_up(db, requisition_id=requisition_id, picked_by=current_user.id)
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.PICK_UP,
        resource_type="requisition",
        resource_id=requisition.id,
        details=f"领用 {requisition.requisition_number}",
        ip_address=request.client.host if request.client else None
    )
    return requisition


@router.put("/{requisition_id}/return", response_model=schemas.Requisition)
def return_requisition(
    request: Request,
    requisition_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_admin_member)
):
    requisition = crud.requisition.get(db, id=requisition_id)
    if not requisition:
        raise HTTPException(status_code=404, detail="领用申请不存在")
    
    if requisition.status != models.RequisitionStatus.PICKED_UP:
        raise HTTPException(status_code=400, detail="只有已领用的申请可以归还")
    
    requisition = crud.requisition.return_req(db, requisition_id=requisition_id)
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.RETURN,
        resource_type="requisition",
        resource_id=requisition.id,
        details=f"归还 {requisition.requisition_number}",
        ip_address=request.client.host if request.client else None
    )
    return requisition


@router.put("/{requisition_id}", response_model=schemas.Requisition, dependencies=[Depends(allow_admin_member)])
def update_requisition(
    request: Request,
    requisition_id: int,
    requisition_in: schemas.RequisitionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    requisition = crud.requisition.get(db, id=requisition_id)
    if not requisition:
        raise HTTPException(status_code=404, detail="领用申请不存在")
    
    if requisition.status not in [models.RequisitionStatus.DRAFT, models.RequisitionStatus.PENDING]:
        raise HTTPException(status_code=400, detail="当前状态不允许修改")
    
    requisition = crud.requisition.update(db, db_obj=requisition, obj_in=requisition_in)
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.UPDATE,
        resource_type="requisition",
        resource_id=requisition.id,
        details=f"更新领用申请 {requisition.requisition_number}",
        ip_address=request.client.host if request.client else None
    )
    return requisition
