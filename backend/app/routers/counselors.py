from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Counselor, User
from ..schemas import CounselorCreate, CounselorUpdate, CounselorResponse
from ..auth import get_current_user, get_current_active_dispatcher, log_operation, model_to_dict
from typing import Optional

router = APIRouter(prefix="/api/counselors", tags=["咨询师管理"])


@router.get("", response_model=list[CounselorResponse])
async def get_counselors(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    query = db.query(Counselor)
    if is_active is not None:
        query = query.filter(Counselor.is_active == is_active)
    counselors = query.offset(skip).limit(limit).all()
    return counselors


@router.get("/{counselor_id}", response_model=CounselorResponse)
async def get_counselor(
    counselor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    counselor = db.query(Counselor).filter(Counselor.id == counselor_id).first()
    if not counselor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="咨询师不存在"
        )
    return counselor


@router.post("", response_model=CounselorResponse)
async def create_counselor(
    request: Request,
    counselor_data: CounselorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    new_counselor = Counselor(**counselor_data.model_dump())
    db.add(new_counselor)
    db.commit()
    db.refresh(new_counselor)
    
    log_operation(
        db, current_user.id, "create", "counselor", new_counselor.id,
        request=request,
        new_value=model_to_dict(new_counselor)
    )
    
    return new_counselor


@router.put("/{counselor_id}", response_model=CounselorResponse)
async def update_counselor(
    request: Request,
    counselor_id: int,
    counselor_data: CounselorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    counselor = db.query(Counselor).filter(Counselor.id == counselor_id).first()
    if not counselor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="咨询师不存在"
        )
    
    old_value = model_to_dict(counselor)
    
    update_data = counselor_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(counselor, key, value)
    
    db.commit()
    db.refresh(counselor)
    
    log_operation(
        db, current_user.id, "update", "counselor", counselor_id,
        request=request,
        old_value=old_value,
        new_value=model_to_dict(counselor)
    )
    
    return counselor


@router.delete("/{counselor_id}")
async def delete_counselor(
    request: Request,
    counselor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_dispatcher)
):
    counselor = db.query(Counselor).filter(Counselor.id == counselor_id).first()
    if not counselor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="咨询师不存在"
        )
    
    old_value = model_to_dict(counselor)
    counselor.is_active = False
    db.commit()
    
    log_operation(
        db, current_user.id, "delete", "counselor", counselor_id,
        request=request,
        old_value=old_value,
        new_value={"is_active": False}
    )
    
    return {"message": "咨询师已停用"}
