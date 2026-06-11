from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional, List
from datetime import datetime

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = None
    data: Optional[T] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class NoteCreate(BaseModel):
    related_id: int
    related_type: str
    content: str


class NoteResponse(BaseModel):
    id: int
    content: str
    created_by: int
    created_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
