from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    username: str
    real_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    real_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str
