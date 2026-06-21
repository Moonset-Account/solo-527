from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.auth import create_access_token, get_current_active_user
from app import schemas, crud

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud.crud_user.authenticate(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户已被禁用"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.User)
def read_current_user(current_user: schemas.User = Depends(get_current_active_user)):
    return current_user


@router.post("/change-password")
def change_password(
    old_password: str,
    new_password: str,
    current_user: schemas.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user = crud.crud_user.authenticate(db, username=current_user.username, password=old_password)
    if not user:
        raise HTTPException(status_code=400, detail="原密码错误")
    crud.crud_user.update(db, db_obj=user, obj_in={"password": new_password})
    return {"message": "密码修改成功"}
