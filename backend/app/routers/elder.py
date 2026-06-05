import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.elder import Elder, FamilyContact, DietaryRestriction
from app.schemas.elder import (
    ElderCreate,
    ElderUpdate,
    ElderOut,
    ElderListItem,
    TempSuspendRequest,
    FamilyConfirmRequest,
)

router = APIRouter(prefix="/api/elders", tags=["elders"])


@router.get("/", response_model=list[ElderListItem])
def list_elders(
    building: Optional[str] = None,
    suspended: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Elder)
    if building:
        query = query.filter(Elder.building == building)
    if suspended is not None:
        query = query.filter(Elder.is_temp_suspended == suspended)
    return query.all()


@router.get("/{elder_id}", response_model=ElderOut)
def get_elder(elder_id: uuid.UUID, db: Session = Depends(get_db)):
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="Elder not found")
    return elder


@router.post("/", response_model=ElderOut)
def create_elder(data: ElderCreate, db: Session = Depends(get_db)):
    elder = Elder(**data.model_dump())
    db.add(elder)
    db.commit()
    db.refresh(elder)
    return elder


@router.put("/{elder_id}", response_model=ElderOut)
def update_elder(
    elder_id: uuid.UUID, data: ElderUpdate, db: Session = Depends(get_db)
):
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="Elder not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(elder, key, value)

    db.commit()
    db.refresh(elder)
    return elder


@router.put("/{elder_id}/temp-suspend", response_model=ElderOut)
def temp_suspend_elder(
    elder_id: uuid.UUID, data: TempSuspendRequest, db: Session = Depends(get_db)
):
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise HTTPException(status_code=404, detail="Elder not found")

    elder.is_temp_suspended = data.is_suspended
    elder.suspend_reason = data.reason
    elder.suspend_until = data.suspend_until

    db.commit()
    db.refresh(elder)
    return elder


@router.get("/{elder_id}/family-contacts", response_model=list)
def get_family_contacts(elder_id: uuid.UUID, db: Session = Depends(get_db)):
    contacts = (
        db.query(FamilyContact)
        .filter(FamilyContact.elder_id == elder_id)
        .all()
    )
    return contacts


@router.post("/{elder_id}/family-confirm", response_model=dict)
def family_confirm(
    elder_id: uuid.UUID, data: FamilyConfirmRequest, db: Session = Depends(get_db)
):
    from app.services.subsidy_check import confirm_subsidy_exceed

    try:
        confirmation = confirm_subsidy_exceed(
            db,
            confirmation_id=data.confirmation_id,
            confirmer_name=data.confirmer_name,
            status=data.status,
            note=None,
        )
        return {"status": "ok", "confirmation_id": str(confirmation.id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
