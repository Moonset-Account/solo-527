from sqlalchemy import Column, Integer, String, Boolean, DateTime, Table, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import BaseModel


user_roles = Table(
    "user_roles",
    BaseModel.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
)


role_permissions = Table(
    "role_permissions",
    BaseModel.metadata,
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id"), primary_key=True),
)


class User(BaseModel):
    __tablename__ = "users"

    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    email = Column(String(100), unique=True, index=True, nullable=False, comment="邮箱")
    hashed_password = Column(String(255), nullable=False, comment="密码哈希")
    full_name = Column(String(50), nullable=True, comment="真实姓名")
    phone = Column(String(20), nullable=True, comment="手机号")
    avatar = Column(String(255), nullable=True, comment="头像")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否启用")
    last_login_at = Column(DateTime, nullable=True, comment="最后登录时间")

    roles = relationship("Role", secondary=user_roles, back_populates="users")
    follow_up_records = relationship("FollowUpRecord", back_populates="user")
    created_exception_orders = relationship("ExceptionOrder", foreign_keys="ExceptionOrder.created_by", back_populates="creator")
    assigned_exception_orders = relationship("ExceptionOrder", foreign_keys="ExceptionOrder.assigned_to", back_populates="assignee")


class Role(BaseModel):
    __tablename__ = "roles"

    name = Column(String(50), unique=True, nullable=False, comment="角色名称")
    code = Column(String(50), unique=True, nullable=False, comment="角色编码")
    description = Column(String(255), nullable=True, comment="角色描述")

    users = relationship("User", secondary=user_roles, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")


class Permission(BaseModel):
    __tablename__ = "permissions"

    name = Column(String(50), unique=True, nullable=False, comment="权限名称")
    code = Column(String(100), unique=True, nullable=False, comment="权限编码")
    description = Column(String(255), nullable=True, comment="权限描述")

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")
