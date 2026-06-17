from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import BaseSchema, PageParams


class RoleBase(BaseSchema):
    name: str
    code: str
    description: Optional[str] = None


class RoleCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


class RoleResponse(RoleBase):
    pass


class PermissionBase(BaseSchema):
    name: str
    code: str
    description: Optional[str] = None


class UserBase(BaseSchema):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    is_active: bool = True


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role_ids: Optional[List[int]] = []


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    is_active: Optional[bool] = None
    role_ids: Optional[List[int]] = None


class UserPasswordUpdate(BaseModel):
    old_password: str
    new_password: str


class UserResponse(UserBase):
    roles: List[RoleResponse] = []


class UserQuery(PageParams):
    keyword: Optional[str] = None
    status: Optional[str] = None
    role_id: Optional[int] = None


class UserInfoResponse(UserBase):
    roles: List[RoleResponse] = []
    permissions: List[str] = []
