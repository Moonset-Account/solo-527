from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models import NoShowList, User, OperationLog
from ..schemas import NoShowListCreate, NoShowListUpdate, NoShowListResponse, OperationLogResponse
from ..auth import get_current_user, get_current_active_dispatcher, log_operation, model_to_dict

router = APIRouter(tags=["配置管理"])


@router.get("/api/no-show-list", response_model=list[NoShowListResponse])
async def get_no_show_list(
    skip: int = 0,
    limit: int = 100,
    is_blocked: Optional[bool] = None,
    visitor_phone: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    query = db.query(NoShowList)
    if is_blocked is not None:
        query = query.filter(NoShowList.is_blocked == is_blocked)
    if visitor_phone:
        query = query.filter(NoShowList.visitor_phone == visitor_phone)
    
    return query.order_by(NoShowList.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/api/no-show-list", response_model=NoShowListResponse)
async def add_to_no_show_list(
    request: Request,
    data: NoShowListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    existing = db.query(NoShowList).filter(
        NoShowList.visitor_phone == data.visitor_phone
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该手机号已在爽约名单中"
        )
    
    new_entry = NoShowList(
        **data.model_dump(),
        created_by=current_user.id
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    
    log_operation(
        db, current_user.id, "create", "no_show_list", new_entry.id,
        request=request,
        new_value=model_to_dict(new_entry)
    )
    
    return new_entry


@router.put("/api/no-show-list/{entry_id}", response_model=NoShowListResponse)
async def update_no_show_entry(
    request: Request,
    entry_id: int,
    data: NoShowListUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    entry = db.query(NoShowList).filter(NoShowList.id == entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记录不存在"
        )
    
    old_value = model_to_dict(entry)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(entry, key, value)
    
    db.commit()
    db.refresh(entry)
    
    log_operation(
        db, current_user.id, "update", "no_show_list", entry_id,
        request=request,
        old_value=old_value,
        new_value=model_to_dict(entry)
    )
    
    return entry


@router.delete("/api/no-show-list/{entry_id}")
async def remove_from_no_show_list(
    request: Request,
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    entry = db.query(NoShowList).filter(NoShowList.id == entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记录不存在"
        )
    
    old_value = model_to_dict(entry)
    db.delete(entry)
    db.commit()
    
    log_operation(
        db, current_user.id, "delete", "no_show_list", entry_id,
        request=request,
        old_value=old_value
    )
    
    return {"message": "已从爽约名单中移除"}


@router.get("/api/operation-logs", response_model=list[OperationLogResponse])
async def get_operation_logs(
    skip: int = 0,
    limit: int = 100,
    operator_id: Optional[int] = None,
    operation_type: Optional[str] = None,
    target_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    query = db.query(OperationLog)
    
    if operator_id:
        query = query.filter(OperationLog.operator_id == operator_id)
    if operation_type:
        query = query.filter(OperationLog.operation_type == operation_type)
    if target_type:
        query = query.filter(OperationLog.target_type == target_type)
    
    logs = query.order_by(OperationLog.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for log in logs:
        operator = db.query(User).filter(User.id == log.operator_id).first()
        log_dict = model_to_dict(log)
        log_dict["operator_info"] = model_to_dict(operator) if operator else None
        result.append(log_dict)
    
    return result


@router.get("/api/operation-logs/{log_id}", response_model=OperationLogResponse)
async def get_operation_log_detail(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    log = db.query(OperationLog).filter(OperationLog.id == log_id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="日志不存在"
        )
    
    operator = db.query(User).filter(User.id == log.operator_id).first()
    log_dict = model_to_dict(log)
    log_dict["operator_info"] = model_to_dict(operator) if operator else None
    
    return log_dict
