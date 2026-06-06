from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, RoleChecker
from app import schemas, models, crud

router = APIRouter(prefix="/api/users", tags=["用户管理"])
allow_admin = RoleChecker([models.UserRole.ADMIN])
allow_admin_coordinator = RoleChecker([models.UserRole.ADMIN, models.UserRole.COORDINATOR])


@router.get("", response_model=List[schemas.UserResponse], dependencies=[Depends(allow_admin)])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = crud.user.get_multi(db, skip=skip, limit=limit)
    return users


@router.get("/{user_id}", response_model=schemas.UserResponse, dependencies=[Depends(allow_admin)])
def get_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.user.get(db, id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return db_user


@router.post("", response_model=schemas.UserResponse, dependencies=[Depends(allow_admin)])
def create_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.user.get_by_username(db, username=user_in.username)
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    if user_in.email:
        db_user = crud.user.get_by_email(db, email=user_in.email)
        if db_user:
            raise HTTPException(status_code=400, detail="邮箱已存在")
    return crud.user.create(db, obj_in=user_in)


@router.put("/{user_id}", response_model=schemas.UserResponse, dependencies=[Depends(allow_admin)])
def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db)
):
    db_user = crud.user.get(db, id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return crud.user.update(db, db_obj=db_user, obj_in=user_in)


@router.delete("/{user_id}", dependencies=[Depends(allow_admin)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.user.get(db, id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    crud.user.remove(db, id=user_id)
    return {"message": "用户已删除"}
