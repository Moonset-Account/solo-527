from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.user import User, Role, Permission
from app.schemas.user import UserCreate, UserUpdate, UserQuery, RoleCreate, RoleUpdate
from app.core.security import get_password_hash, verify_password
from app.schemas.common import PageResult


class UserService:
    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id, User.is_deleted == False).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username, User.is_deleted == False).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email, User.is_deleted == False).first()

    @staticmethod
    def get_users(db: Session, query: UserQuery) -> PageResult:
        q = db.query(User).filter(User.is_deleted == False)

        if query.keyword:
            keyword = f"%{query.keyword}%"
            q = q.filter(or_(User.username.like(keyword), User.email.like(keyword), User.full_name.like(keyword)))

        if query.status == "active":
            q = q.filter(User.is_active == True)
        elif query.status == "inactive":
            q = q.filter(User.is_active == False)

        if query.role_id:
            q = q.filter(User.roles.any(Role.id == query.role_id))

        total = q.count()
        items = q.order_by(User.id.desc()).offset((query.page - 1) * query.page_size).limit(query.page_size).all()

        return PageResult(total=total, page=query.page, page_size=query.page_size, items=items)

    @staticmethod
    def create_user(db: Session, user_in: UserCreate, created_by: Optional[int] = None) -> User:
        db_user = User(
            username=user_in.username,
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            phone=user_in.phone,
            created_by=created_by,
        )

        if user_in.role_ids:
            roles = db.query(Role).filter(Role.id.in_(user_in.role_ids)).all()
            db_user.roles = roles

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_user(db: Session, user_id: int, user_in: UserUpdate, updated_by: Optional[int] = None) -> Optional[User]:
        db_user = UserService.get_user(db, user_id)
        if not db_user:
            return None

        update_data = user_in.model_dump(exclude_unset=True)

        if "role_ids" in update_data:
            role_ids = update_data.pop("role_ids")
            roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
            db_user.roles = roles

        for field, value in update_data.items():
            setattr(db_user, field, value)

        db_user.updated_by = updated_by
        db_user.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete_user(db: Session, user_id: int, updated_by: Optional[int] = None) -> bool:
        db_user = UserService.get_user(db, user_id)
        if not db_user:
            return False
        db_user.is_deleted = True
        db_user.updated_by = updated_by
        db_user.updated_at = datetime.utcnow()
        db.commit()
        return True

    @staticmethod
    def authenticate(db: Session, username: str, password: str) -> Optional[User]:
        user = UserService.get_user_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def update_password(db: Session, user_id: int, old_password: str, new_password: str) -> bool:
        user = UserService.get_user(db, user_id)
        if not user:
            return False
        if not verify_password(old_password, user.hashed_password):
            return False
        user.hashed_password = get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        db.commit()
        return True

    @staticmethod
    def get_user_permissions(db: Session, user_id: int) -> List[str]:
        user = UserService.get_user(db, user_id)
        if not user:
            return []
        permissions = set()
        for role in user.roles:
            for perm in role.permissions:
                permissions.add(perm.code)
        return list(permissions)

    @staticmethod
    def get_roles(db: Session) -> List[Role]:
        return db.query(Role).filter(Role.is_deleted == False).all()

    @staticmethod
    def create_role(db: Session, role_in: RoleCreate, created_by: Optional[int] = None) -> Role:
        db_role = Role(
            name=role_in.name,
            code=role_in.code,
            description=role_in.description,
            created_by=created_by,
        )
        if role_in.permission_ids:
            perms = db.query(Permission).filter(Permission.id.in_(role_in.permission_ids)).all()
            db_role.permissions = perms
        db.add(db_role)
        db.commit()
        db.refresh(db_role)
        return db_role

    @staticmethod
    def update_role(db: Session, role_id: int, role_in: RoleUpdate, updated_by: Optional[int] = None) -> Optional[Role]:
        db_role = db.query(Role).filter(Role.id == role_id, Role.is_deleted == False).first()
        if not db_role:
            return None

        update_data = role_in.model_dump(exclude_unset=True)
        if "permission_ids" in update_data:
            perm_ids = update_data.pop("permission_ids")
            perms = db.query(Permission).filter(Permission.id.in_(perm_ids)).all()
            db_role.permissions = perms

        for field, value in update_data.items():
            setattr(db_role, field, value)

        db_role.updated_by = updated_by
        db_role.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_role)
        return db_role

    @staticmethod
    def init_roles_and_permissions(db: Session) -> None:
        permissions = [
            {"name": "用户管理", "code": "user:manage"},
            {"name": "角色管理", "code": "role:manage"},
            {"name": "租约查询", "code": "lease:view"},
            {"name": "租约管理", "code": "lease:manage"},
            {"name": "账单查询", "code": "bill:view"},
            {"name": "账单管理", "code": "bill:manage"},
            {"name": "账单生成", "code": "bill:generate"},
            {"name": "账单导出", "code": "bill:export"},
            {"name": "异常单查看", "code": "exception:view"},
            {"name": "异常单处理", "code": "exception:handle"},
            {"name": "字典配置", "code": "dictionary:manage"},
            {"name": "校验规则配置", "code": "validation:manage"},
            {"name": "操作日志查看", "code": "log:view"},
            {"name": "顾问跟进", "code": "followup:manage"},
            {"name": "业主结算", "code": "owner:settle"},
        ]

        existing_codes = {p.code for p in db.query(Permission).all()}

        for perm_data in permissions:
            if perm_data["code"] not in existing_codes:
                db_perm = Permission(**perm_data)
                db.add(db_perm)

        db.commit()

        roles = [
            {
                "name": "管理员",
                "code": "admin",
                "description": "系统管理员，拥有全部权限",
                "permission_codes": [p["code"] for p in permissions],
            },
            {
                "name": "财务专员",
                "code": "finance",
                "description": "财务专员，负责账单查询与结算",
                "permission_codes": ["lease:view", "bill:view", "bill:export", "followup:manage", "owner:settle"],
            },
            {
                "name": "顾问",
                "code": "consultant",
                "description": "顾问，负责租约跟进",
                "permission_codes": ["lease:view", "followup:manage"],
            },
            {
                "name": "租客客服",
                "code": "customer_service",
                "description": "租客客服，处理异常单",
                "permission_codes": ["lease:view", "bill:view", "exception:view", "exception:handle"],
            },
        ]

        for role_data in roles:
            existing_role = db.query(Role).filter(Role.code == role_data["code"]).first()
            if not existing_role:
                perms = db.query(Permission).filter(Permission.code.in_(role_data["permission_codes"])).all()
                db_role = Role(
                    name=role_data["name"],
                    code=role_data["code"],
                    description=role_data["description"],
                    permissions=perms,
                )
                db.add(db_role)

        db.commit()

    @staticmethod
    def init_admin_user(db: Session) -> None:
        admin = UserService.get_user_by_username(db, "admin")
        if not admin:
            admin_role = db.query(Role).filter(Role.code == "admin").first()
            if admin_role:
                admin_user = User(
                    username="admin",
                    email="admin@example.com",
                    hashed_password=get_password_hash("admin123"),
                    full_name="系统管理员",
                    is_active=True,
                    roles=[admin_role],
                )
                db.add(admin_user)
                db.commit()
