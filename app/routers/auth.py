from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse, HTMLResponse
from app.database import get_db
from app.schemas import UserLogin, TokenResponse, UserCreate, UserResponse
from app.services import AuthService
from app.utils.security import get_current_user
from app.models import User

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    token = AuthService.login(db, UserLogin(username=form_data.username, password=form_data.password))
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token.access_token}",
        httponly=True,
        max_age=token.expires_in,
        path="/"
    )
    
    return token


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "登出成功"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/users", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="只有管理员可以创建用户")
    return AuthService.create_user(db, user_in)
