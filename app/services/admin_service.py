from datetime import datetime
from typing import List, Optional
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from fastapi import HTTPException
from ..models import User
from ..schemas import UserCreate, UserUpdate, UserRole, PaginationResult
from ..auth import get_password_hash


class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def init_test_users(self) -> None:
        test_users = [
            {
                "username": "admin",
                "name": "系统管理员",
                "role": UserRole.ADMIN,
                "password": "test123",
                "email": "admin@example.com",
                "phone": "13800000001",
                "is_test_account": False
            },
            {
                "username": "photographer",
                "name": "张摄影师",
                "role": UserRole.PHOTOGRAPHER,
                "password": "test123",
                "email": "photographer@example.com",
                "phone": "13800000002",
                "is_test_account": False
            },
            {
                "username": "videolead",
                "name": "王视频负责人",
                "role": UserRole.VIDEO_LEAD,
                "password": "test123",
                "email": "videolead@example.com",
                "phone": "13800000004",
                "is_test_account": False
            }
        ]
        
        for user_data in test_users:
            existing = self.db.query(User).filter(User.username == user_data["username"]).first()
            if not existing:
                user = User(
                    username=user_data["username"],
                    name=user_data["name"],
                    role=user_data["role"],
                    hashed_password=get_password_hash(user_data["password"]),
                    email=user_data["email"],
                    phone=user_data["phone"],
                    is_test_account=user_data["is_test_account"],
                    is_active=True
                )
                self.db.add(user)
        
        self.db.commit()

    def create_user(self, user_data: UserCreate, current_user: User) -> User:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="只有管理员可以创建用户")
        
        existing = self.db.query(User).filter(User.username == user_data.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="用户名已存在")
        
        user = User(
            **user_data.model_dump(exclude={"password"}),
            hashed_password=get_password_hash(user_data.password)
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_user(self, user_id: int, current_user: User) -> Optional[User]:
        if current_user.role != "admin" and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="无权查看此用户")
        
        return self.db.query(User).filter(User.id == user_id).first()

    def list_users(
        self, current_user: User,
        role: Optional[UserRole] = None,
        is_test_account: Optional[bool] = None,
        keyword: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> PaginationResult[User]:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="只有管理员可以查看用户列表")
        
        query = self.db.query(User)
        
        if role:
            query = query.filter(User.role == role)
        if is_test_account is not None:
            query = query.filter(User.is_test_account == is_test_account)
        if keyword:
            query = query.filter(
                or_(
                    User.username.ilike(f"%{keyword}%"),
                    User.name.ilike(f"%{keyword}%"),
                    User.email.ilike(f"%{keyword}%")
                )
            )
        
        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()
        
        return PaginationResult(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )

    def update_user(
        self, user_id: int, update_data: UserUpdate, current_user: User
    ) -> User:
        if current_user.role != "admin" and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="无权修改此用户")
        
        if current_user.role != "admin" and update_data.role:
            raise HTTPException(status_code=403, detail="只有管理员可以修改角色")
        
        if current_user.role != "admin" and update_data.is_test_account is not None:
            raise HTTPException(status_code=403, detail="只有管理员可以标记测试账号")
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def toggle_test_account(
        self, user_id: int, is_test_account: bool, current_user: User
    ) -> User:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="只有管理员可以标记测试账号")
        
        if current_user.id == user_id:
            raise HTTPException(status_code=400, detail="不能修改自己的测试账号标记")
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        user.is_test_account = is_test_account
        
        from ..models import Order
        self.db.query(Order).filter(
            Order.photographer_id == user_id
        ).update({"is_test_data": is_test_account})
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user_id: int, current_user: User) -> None:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="只有管理员可以删除用户")
        
        if current_user.id == user_id:
            raise HTTPException(status_code=400, detail="不能删除自己")
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        self.db.delete(user)
        self.db.commit()

    def get_test_accounts(self, current_user: User) -> List[User]:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="只有管理员可以查看测试账号")
        
        return self.db.query(User).filter(
            User.is_test_account == True
        ).order_by(User.created_at.desc()).all()

    def get_test_data_stats(self, current_user: User) -> dict:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="只有管理员可以查看测试数据统计")
        
        test_users = self.db.query(User).filter(User.is_test_account == True).count()
        
        from ..models import Order
        test_orders = self.db.query(Order).filter(Order.is_test_data == True).count()
        
        total_users = self.db.query(User).count()
        total_orders = self.db.query(Order).count()
        
        return {
            "test_users": test_users,
            "test_orders": test_orders,
            "total_users": total_users,
            "total_orders": total_orders,
            "test_user_ratio": round(test_users / total_users * 100, 2) if total_users > 0 else 0,
            "test_order_ratio": round(test_orders / total_orders * 100, 2) if total_orders > 0 else 0
        }

    def reset_password(
        self, user_id: int, new_password: str, current_user: User
    ) -> None:
        if current_user.role != "admin" and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="无权重置密码")
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        user.hashed_password = get_password_hash(new_password)
        self.db.commit()

    def update_last_login(self, user_id: int) -> None:
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.last_login_at = datetime.now()
            self.db.commit()
