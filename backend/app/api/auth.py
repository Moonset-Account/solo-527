from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import create_access_token, verify_password, hash_password
from ..schemas.user import LoginRequest, TokenResponse, UserCreate, UserResponse
from ..models import User, UserRole

router = APIRouter()


def _ensure_admin_and_seed(db: Session):
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@qinghe.com",
            hashed_password=hash_password("admin123"),
            full_name="系统管理员",
            role=UserRole.ADMIN,
            department="合规部",
        )
        db.add(admin)
    manager = db.query(User).filter(User.username == "manager").first()
    if not manager:
        manager = User(
            username="manager",
            email="manager@qinghe.com",
            hashed_password=hash_password("manager123"),
            full_name="合规经理-李明",
            role=UserRole.COMPLIANCE_MANAGER,
            department="合规部",
        )
        db.add(manager)
    lawyer = db.query(User).filter(User.username == "lawyer").first()
    if not lawyer:
        lawyer = User(
            username="lawyer",
            email="lawyer@qinghe.com",
            hashed_password=hash_password("lawyer123"),
            full_name="律师-王芳",
            role=UserRole.LAWYER,
            department="法务部",
        )
        db.add(lawyer)
    reviewer = db.query(User).filter(User.username == "reviewer").first()
    if not reviewer:
        reviewer = User(
            username="reviewer",
            email="reviewer@qinghe.com",
            hashed_password=hash_password("reviewer123"),
            full_name="复核人-张伟",
            role=UserRole.REVIEWER,
            department="合规部",
        )
        db.add(reviewer)
    submitter = db.query(User).filter(User.username == "submitter").first()
    if not submitter:
        submitter = User(
            username="submitter",
            email="submitter@qinghe.com",
            hashed_password=hash_password("submitter123"),
            full_name="提交人-赵磊",
            role=UserRole.SUBMITTER,
            department="业务一部",
        )
        db.add(submitter)
    db.commit()


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    _ensure_admin_and_seed(db)
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账户已被禁用")
    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/register", response_model=UserResponse)
def register(req: UserCreate, db: Session = Depends(get_db)):
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
