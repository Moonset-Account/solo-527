from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app import models, schemas
from app.security import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_admin, require_teacher
)
from app.config import settings
from app.masking import encrypt_sensitive

router = APIRouter()


@router.post("/register", response_model=schemas.UserResponse)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")

    real_name_enc = encrypt_sensitive(user_in.real_name) if user_in.real_name else None

    user = models.User(
        username=user_in.username,
        hashed_password=hash_password(user_in.password),
        real_name_encrypted=real_name_enc,
        role=user_in.role,
        class_id=user_in.class_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}


@router.get("/me", response_model=schemas.UserResponse)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/classes", response_model=schemas.ClassResponse, dependencies=[Depends(require_admin)])
def create_class(class_in: schemas.ClassCreate, db: Session = Depends(get_db)):
    cls = models.Class(
        class_name=class_in.class_name,
        grade=class_in.grade,
        head_teacher_id=class_in.head_teacher_id
    )
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return cls


@router.get("/classes", response_model=list[schemas.ClassResponse])
def list_classes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Class)
    if current_user.role == models.UserRole.TEACHER:
        query = query.filter((models.Class.id == current_user.class_id) |
                             (models.Class.head_teacher_id == current_user.id))
    classes = query.all()
    result = []
    for cls in classes:
        student_count = db.query(models.User).filter(
            models.User.class_id == cls.id,
            models.User.role == models.UserRole.STUDENT
        ).count()
        resp = schemas.ClassResponse.model_validate(cls)
        resp.student_count = student_count
        result.append(resp)
    return result
