from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ...database import get_db
from ...security import get_current_user, RoleChecker
from ... import crud, schemas, models
from ...services import logger, notification_service

router = APIRouter()

allow_admin_member = RoleChecker([models.UserRole.ADMIN, models.UserRole.MEMBER])


@router.get("", response_model=List[schemas.InventoryCheck])
def read_inventory_checks(
    skip: int = 0,
    limit: int = 100,
    my: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if my:
        return crud.inventory_check.get_by_creator(db, creator_id=current_user.id, skip=skip, limit=limit)
    if current_user.role == models.UserRole.ADMIN:
        return crud.inventory_check.get_multi(db, skip=skip, limit=limit)
    return crud.inventory_check.get_by_creator(db, creator_id=current_user.id, skip=skip, limit=limit)


@router.post("", response_model=schemas.InventoryCheck, dependencies=[Depends(allow_admin_member)])
def create_inventory_check(
    request: Request,
    check_in: schemas.InventoryCheckCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check = crud.inventory_check.create(db, obj_in=check_in, created_by=current_user.id)
    
    notification_service.notify_admins(
        db,
        type=models.NotificationType.INVENTORY_CHECK,
        title=f"新的盘点任务: {check.title}",
        message=f"用户 {current_user.full_name} 创建了盘点任务 {check.check_number}。",
        related_type="inventory_check",
        related_id=check.id
    )
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.CREATE,
        resource_type="inventory_check",
        resource_id=check.id,
        details=f"创建盘点任务 {check.check_number}",
        ip_address=request.client.host if request.client else None
    )
    return check


@router.get("/{check_id}", response_model=schemas.InventoryCheck)
def read_inventory_check(
    check_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check = crud.inventory_check.get(db, id=check_id)
    if not check:
        raise HTTPException(status_code=404, detail="盘点任务不存在")
    return check


@router.put("/{check_id}/start", response_model=schemas.InventoryCheck)
def start_inventory_check(
    request: Request,
    check_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_admin_member)
):
    check = crud.inventory_check.get(db, id=check_id)
    if not check:
        raise HTTPException(status_code=404, detail="盘点任务不存在")
    
    check = crud.inventory_check.start_check(db, check_id=check_id, user_id=current_user.id)
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.UPDATE,
        resource_type="inventory_check",
        resource_id=check.id,
        details=f"开始盘点 {check.check_number}",
        ip_address=request.client.host if request.client else None
    )
    return check


@router.put("/{check_id}/complete", response_model=schemas.InventoryCheck)
def complete_inventory_check(
    request: Request,
    check_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_admin_member)
):
    check = crud.inventory_check.get(db, id=check_id)
    if not check:
        raise HTTPException(status_code=404, detail="盘点任务不存在")
    
    check = crud.inventory_check.complete_check(db, check_id=check_id)
    
    notification_service.notify_admins(
        db,
        type=models.NotificationType.INVENTORY_CHECK,
        title=f"盘点完成: {check.title}",
        message=f"盘点任务 {check.check_number} 已完成，差异数: {check.discrepancies_count}。",
        related_type="inventory_check",
        related_id=check.id
    )
    
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.UPDATE,
        resource_type="inventory_check",
        resource_id=check.id,
        details=f"完成盘点 {check.check_number}, 差异数: {check.discrepancies_count}",
        ip_address=request.client.host if request.client else None
    )
    return check


@router.put("/items/{item_id}", response_model=schemas.InventoryCheckItem)
def update_inventory_item(
    request: Request,
    item_id: int,
    item_in: schemas.InventoryCheckItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(allow_admin_member)
):
    item = crud.inventory_check_item.update_item(
        db, item_id=item_id, obj_in=item_in, checked_by=current_user.id
    )
    if not item:
        raise HTTPException(status_code=404, detail="盘点项不存在")
    return item
