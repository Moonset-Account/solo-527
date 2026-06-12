from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..core.security import get_current_user, require_roles
from ..schemas.user import UserCreate, UserUpdate, UserResponse, UserList
from ..models import User, UserRole
from ..core.security import hash_password

router = APIRouter()


@router.get("", response_model=UserList)
def list_users(
    role: Optional[UserRole] = None,
    keyword: Optional[str] = Query(None, description="按姓名/用户名/邮箱搜索"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER)),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if keyword:
        kw = f"%{keyword}%"
        q = q.filter((User.full_name.like(kw)) | (User.username.like(kw)) | (User.email.like(kw)))
    total = q.count()
    items = q.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return UserList(total=total, items=[UserResponse.model_validate(u) for u in items])


@router.get("/me", response_model=UserResponse)
def get_me(current: User = Depends(get_current_user)):
    return UserResponse.model_validate(current)


@router.get("/by-role", response_model=list[UserResponse])
def users_by_role(role: UserRole, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    items = db.query(User).filter(User.role == role, User.is_active == True).order_by(User.full_name).all()
    return [UserResponse.model_validate(u) for u in items]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return UserResponse.model_validate(user)


@router.post("", response_model=UserResponse)
def create_user(req: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.ADMIN))):
    exists = db.query(User).filter((User.username == req.username) | (User.email == req.email)).first()
    if exists:
        raise HTTPException(status_code=400, detail="用户名或邮箱已存在")
    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role=req.role,
        phone=req.phone,
        department=req.department,
        is_active=req.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    req: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    data = req.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        data["hashed_password"] = hash_password(data.pop("password"))
    for k, v in data.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)
