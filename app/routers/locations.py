from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models, crud

router = APIRouter(prefix="/api/locations", tags=["地点管理"])
allow_admin_coordinator = RoleChecker([models.UserRole.ADMIN, models.UserRole.COORDINATOR])


@router.get("", response_model=List[schemas.LocationResponse])
def get_locations(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    search: str = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user)
):
    if search:
        return crud.location.search(db, keyword=search)
    if active_only:
        return crud.location.get_active(db)
    return crud.location.get_multi(db, skip=skip, limit=limit)


@router.get("/{location_id}", response_model=schemas.LocationResponse)
def get_location(location_id: int, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    db_location = crud.location.get(db, id=location_id)
    if db_location is None:
        raise HTTPException(status_code=404, detail="地点不存在")
    return db_location


@router.post("", response_model=schemas.LocationResponse, dependencies=[Depends(allow_admin_coordinator)])
def create_location(location_in: schemas.LocationCreate, db: Session = Depends(get_db)):
    return crud.location.create(db, obj_in=location_in)


@router.put("/{location_id}", response_model=schemas.LocationResponse, dependencies=[Depends(allow_admin_coordinator)])
def update_location(location_id: int, location_in: schemas.LocationUpdate, db: Session = Depends(get_db)):
    db_location = crud.location.get(db, id=location_id)
    if db_location is None:
        raise HTTPException(status_code=404, detail="地点不存在")
    return crud.location.update(db, db_obj=db_location, obj_in=location_in)


@router.delete("/{location_id}", dependencies=[Depends(allow_admin_coordinator)])
def delete_location(location_id: int, db: Session = Depends(get_db)):
    db_location = crud.location.get(db, id=location_id)
    if db_location is None:
        raise HTTPException(status_code=404, detail="地点不存在")
    crud.location.remove(db, id=location_id)
    return {"message": "地点已删除"}
