from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_db
from .. import models, schemas, crud
from ..auth import verify_password, get_password_hash, create_access_token, get_current_user
from ..config import settings
from ..utils import create_audit_log

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/login", response_model=schemas.ResponseModel[schemas.Token])
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="用户名或密码错误")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="用户已被禁用")
    access_token = create_access_token(
        data={"user_id": user.id, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    create_audit_log(
        db, action="login", entity_type="user", entity_id=user.id,
        entity_name=user.full_name, user=user, description="用户登录系统"
    )
    return schemas.ResponseModel(
        data=schemas.Token(access_token=access_token, user=schemas.UserInDB.model_validate(user))
    )


@router.post("/register", response_model=schemas.ResponseModel[schemas.UserInDB])
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="邮箱已被注册")
    user_data = user_in.model_dump()
    user_data["hashed_password"] = get_password_hash(user_data.pop("password"))
    user = crud.user.create(db, obj_in=user_data)
    return schemas.ResponseModel(data=schemas.UserInDB.model_validate(user))


@router.get("/me", response_model=schemas.ResponseModel[schemas.UserInDB])
def get_me(current_user: models.User = Depends(get_current_user)):
    return schemas.ResponseModel(data=schemas.UserInDB.model_validate(current_user))
