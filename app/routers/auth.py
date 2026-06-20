from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Form
from fastapi.responses import RedirectResponse, JSONResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_current_active_user, decode_token
)
from app.config import settings
from app.models import User, Brand, MemberProfile, UserRole
from app.schemas import UserLogin, UserCreate, UserResponse, Token

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/login")
async def login(
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    content_type = request.headers.get("content-type", "")
    username: Optional[str] = None
    password: Optional[str] = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("username")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的JSON格式",
            )
    elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不支持的Content-Type",
        )

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名和密码不能为空",
        )

    result = await db.execute(
        select(User).where(User.username == username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        error_html = f'<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">用户名或密码错误</div>'
        if "application/json" in content_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误",
            )
        return HTMLResponse(content=error_html, status_code=401)

    if not user.is_active:
        error_html = f'<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">账号已被禁用</div>'
        if "application/json" in content_type:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="账号已被禁用",
            )
        return HTMLResponse(content=error_html, status_code=403)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "username": user.username},
        expires_delta=access_token_expires,
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
    )
    response.set_cookie(
        key="current_user",
        value=user.username,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=False,
        samesite="lax",
    )

    if user.role == UserRole.MEMBER:
        redirect_url = "/mall"
    else:
        redirect_url = "/admin/dashboard"

    if "application/json" in content_type:
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "redirect_url": redirect_url,
            "role": user.role,
        }
    else:
        response.headers["HX-Redirect"] = redirect_url
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "redirect_url": redirect_url,
            "role": user.role,
        }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("current_user")
    return {"message": "退出成功"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where((User.username == user_data.username) | (User.email == user_data.email))
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名或邮箱已存在",
        )

    user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        phone=user_data.phone,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        brand_id=user_data.brand_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    if user.role == UserRole.MEMBER:
        result = await db.execute(select(Brand).where(Brand.is_active == True).limit(1))
        default_brand = result.scalar_one_or_none()
        brand_id = user_data.brand_id or (default_brand.id if default_brand else None)

        if brand_id:
            member = MemberProfile(
                user_id=user.id,
                brand_id=brand_id,
                member_no=f"M{user.id:08d}",
                nickname=user_data.full_name or user_data.username,
            )
            db.add(member)
            await db.commit()

    return user
