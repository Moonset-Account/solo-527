from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from datetime import timedelta

from app.database import get_db
from app.models import User
from app.enums import UserRole
from app.schemas.common import (
    UserCreate, UserUpdate, UserOut, LoginResponse, ChangePassword,
    ResponseModel, PageResult,
)
from app.utils import (
    verify_password, create_access_token, hash_password,
    paginate, calc_offset,
)
from app.config import settings
from app.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/login", response_model=ResponseModel[LoginResponse])
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(or_(
            User.username == form_data.username,
            User.email == form_data.username,
        ))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被停用")
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
    )
    return ResponseModel(data=LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    ))


@router.post("/logout")
async def logout(response: Response, user: User = Depends(get_current_user)):
    response.delete_cookie("access_token")
    return ResponseModel(message="退出成功")


@router.get("/me", response_model=ResponseModel[UserOut])
async def get_me(user: User = Depends(get_current_user)):
    return ResponseModel(data=UserOut.model_validate(user))


@router.post("/change-password", response_model=ResponseModel)
async def change_password(
    data: ChangePassword,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="原密码错误")
    user.hashed_password = hash_password(data.new_password)
    await db.commit()
    return ResponseModel(message="密码修改成功")


@router.post("/users", response_model=ResponseModel[UserOut])
async def create_user(
    data: UserCreate,
    user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User.id).where(or_(
        User.username == data.username,
        User.email == data.email,
    )))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="用户名或邮箱已存在")
    new_user = User(
        **data.model_dump(exclude={"password"}),
        hashed_password=hash_password(data.password),
        created_by=user.id,
        updated_by=user.id,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return ResponseModel(data=UserOut.model_validate(new_user))


@router.get("/users", response_model=ResponseModel[PageResult[UserOut]])
async def list_users(
    page: int = 1,
    page_size: int = 20,
    role: UserRole = None,
    keyword: str = None,
    user: User = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATOR)),
    db: AsyncSession = Depends(get_db),
):
    page, page_size = paginate(page, page_size)
    offset = calc_offset(page, page_size)
    query = select(User)
    count_q = select(func.count(User.id))
    conditions = []
    if role:
        conditions.append(User.role == role)
    if keyword:
        conditions.append(or_(
            User.username.ilike(f"%{keyword}%"),
            User.email.ilike(f"%{keyword}%"),
            User.real_name.ilike(f"%{keyword}%"),
            User.phone.ilike(f"%{keyword}%"),
        ))
    if conditions:
        from sqlalchemy import and_
        query = query.where(and_(*conditions))
        count_q = count_q.where(and_(*conditions))
    total = (await db.execute(count_q)).scalar() or 0
    query = query.order_by(User.id.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    items = [UserOut.model_validate(u) for u in result.scalars().all()]
    return ResponseModel(data=PageResult(
        items=items, total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    ))


@router.put("/users/{user_id}", response_model=ResponseModel[UserOut])
async def update_user(
    user_id: int,
    data: UserUpdate,
    user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="用户不存在")
    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    for k, v in update_data.items():
        if v is not None and hasattr(target, k):
            setattr(target, k, v)
    target.updated_by = user.id
    await db.commit()
    await db.refresh(target)
    return ResponseModel(data=UserOut.model_validate(target))
