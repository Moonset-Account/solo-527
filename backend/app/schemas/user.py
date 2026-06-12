from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from ..models import UserRole


class UserBase(BaseModel):
    username: str = Field(..., max_length=64)
    email: EmailStr
    full_name: str = Field(..., max_length=64)
    role: UserRole = UserRole.SUBMITTER
    phone: Optional[str] = None
    department: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)


class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserList(BaseModel):
    total: int
    items: List[UserResponse]


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
