from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime
from ...database import get_db
from ...security import create_access_token, get_current_user
from ...config import settings
from ... import crud, schemas, models
from ...services import logger

router = APIRouter()


@router.post("/login", response_model=schemas.Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud.user.authenticate(
        db, username=form_data.username, password=form_data.password
    )
    if not user:
        logger.warning(f"登录失败: 用户名 {form_data.username} 或密码错误")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not crud.user.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户已被禁用"
        )
    
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    crud.audit_log.create_log(
        db, user_id=user.id, username=user.username,
        action=models.AuditAction.LOGIN,
        resource_type="auth",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    logger.info(f"用户登录成功: {user.username}")
    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user=schemas.User.model_validate(user)
    )


@router.get("/me", response_model=schemas.User)
def read_users_me(
    current_user: models.User = Depends(get_current_user)
):
    return current_user


@router.post("/logout")
def logout(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    crud.audit_log.create_log(
        db, user_id=current_user.id, username=current_user.username,
        action=models.AuditAction.LOGOUT,
        resource_type="auth",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    logger.info(f"用户登出: {current_user.username}")
    return {"message": "登出成功"}
