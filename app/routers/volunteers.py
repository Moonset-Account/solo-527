from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models, crud

router = APIRouter(prefix="/api/volunteers", tags=["志愿者管理"])
allow_admin_coordinator = RoleChecker([models.UserRole.ADMIN, models.UserRole.COORDINATOR])


@router.get("", response_model=List[schemas.VolunteerResponse])
def get_volunteers(
    skip: int = 0,
    limit: int = 100,
    available_only: bool = False,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    if available_only:
        return crud.volunteer.get_available(db)
    return crud.volunteer.get_multi(db, skip=skip, limit=limit)


@router.get("/{volunteer_id}", response_model=schemas.VolunteerResponse)
def get_volunteer(volunteer_id: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    db_volunteer = crud.volunteer.get(db, id=volunteer_id)
    if db_volunteer is None:
        raise HTTPException(status_code=404, detail="志愿者不存在")
    return db_volunteer


@router.post("", response_model=schemas.VolunteerResponse, dependencies=[Depends(allow_admin_coordinator)])
def create_volunteer(volunteer_in: schemas.VolunteerCreate, db: Session = Depends(get_db)):
    return crud.volunteer.create(db, obj_in=volunteer_in)


@router.put("/{volunteer_id}", response_model=schemas.VolunteerResponse, dependencies=[Depends(allow_admin_coordinator)])
def update_volunteer(volunteer_id: int, volunteer_in: schemas.VolunteerUpdate, db: Session = Depends(get_db)):
    db_volunteer = crud.volunteer.get(db, id=volunteer_id)
    if db_volunteer is None:
        raise HTTPException(status_code=404, detail="志愿者不存在")
    return crud.volunteer.update(db, db_obj=db_volunteer, obj_in=volunteer_in)


@router.delete("/{volunteer_id}", dependencies=[Depends(allow_admin_coordinator)])
def delete_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    db_volunteer = crud.volunteer.get(db, id=volunteer_id)
    if db_volunteer is None:
        raise HTTPException(status_code=404, detail="志愿者不存在")
    crud.volunteer.remove(db, id=volunteer_id)
    return {"message": "志愿者已删除"}
