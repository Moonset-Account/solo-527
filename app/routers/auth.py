from fastapi import APIRouter, Request, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User, RoleEnum
from app.schemas.user import UserLogin, UserCreate, UserRead, Token
from app.services.auth_service import (
    authenticate_user, create_access_token, get_password_hash, decode_access_token,
)

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/login")
async def login(request: Request, db: AsyncSession = Depends(get_db)):
    form = await request.form()
    username = form.get("username", "")
    password = form.get("password", "")
    user = await authenticate_user(db, username, password)
    if not user:
        return Response(
            headers={"HX-Redirect": "/auth/login?error=1"},
            status_code=302,
        )
    token = create_access_token({"user_id": user.id, "role": user.role.value})
    response = Response(headers={"HX-Redirect": "/"}, status_code=302)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=28800,
        samesite="lax",
    )
    return response


@router.get("/login")
async def login_page(request: Request):
    from app.templates import templates
    error = request.query_params.get("error")
    return templates.TemplateResponse("auth/login.html", {"request": request, "error": error})


@router.get("/logout")
async def logout():
    response = Response(headers={"HX-Redirect": "/auth/login"}, status_code=302)
    response.delete_cookie("access_token")
    return response


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User | None:
    token = request.cookies.get("access_token")
    if not token:
        return None
    token_data = decode_access_token(token)
    if not token_data:
        return None
    result = await db.execute(select(User).where(User.id == token_data.user_id))
    return result.scalar_one_or_none()


async def require_login(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    user = await get_current_user(request, db)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="未登录")
    return user


async def require_admin(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    user = await require_login(request, db)
    if user.role not in (RoleEnum.admin, RoleEnum.security_officer):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="权限不足")
    return user


async def require_security_officer(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    user = await require_login(request, db)
    if user.role != RoleEnum.security_officer:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="仅安全负责人可操作")
    return user
