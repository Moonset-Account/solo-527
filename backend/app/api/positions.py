from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.schemas.position import PositionCreate, PositionUpdate, PositionResponse
from app.services.position_service import PositionService

router = APIRouter(prefix="/positions", tags=["职位管理"])


@router.get("", response_model=List[PositionResponse])
def list_positions(
    keyword: str = None,
    department: str = None,
    job_type: str = None,
    city: str = None,
    is_active: bool = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return PositionService.list(
        db, keyword=keyword, department=department,
        job_type=job_type, city=city, is_active=is_active,
        skip=skip, limit=limit,
    )


@router.get("/{position_id}", response_model=PositionResponse)
def get_position(
    position_id: int,
    db: Session = Depends(get_db),
):
    position = PositionService.get_by_id(db, position_id)
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    return position


@router.post("", response_model=PositionResponse)
def create_position(
    position_in: PositionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return PositionService.create(db, position_in, current_user.id)


@router.put("/{position_id}", response_model=PositionResponse)
def update_position(
    position_id: int,
    position_in: PositionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return PositionService.update(db, position_id, position_in)


@router.delete("/{position_id}")
def delete_position(
    position_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    PositionService.delete(db, position_id)
    return {"message": "Position deleted successfully"}
