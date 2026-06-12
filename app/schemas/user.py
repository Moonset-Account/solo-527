from pydantic import BaseModel, EmailStr
from app.models.user import RoleEnum
from datetime import datetime


class UserLogin(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    password: str
    display_name: str
    email: str
    role: RoleEnum = RoleEnum.requester


class UserRead(BaseModel):
    id: int
    username: str
    display_name: str
    email: str
    role: RoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int | None = None
    role: RoleEnum | None = None
