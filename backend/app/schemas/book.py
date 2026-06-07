from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BookBase(BaseModel):
    isbn: str = Field(..., max_length=20)
    title: str = Field(..., max_length=200)
    author: Optional[str] = Field(None, max_length=100)
    publisher: Optional[str] = Field(None, max_length=100)
    publish_date: Optional[str] = Field(None, max_length=20)
    is_set: bool = False
    set_count: int = 1
    category: Optional[str] = Field(None, max_length=50)
    cover_image: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    
    suggested_price_new: Optional[float] = None
    suggested_price_like_new: Optional[float] = None
    suggested_price_good: Optional[float] = None
    suggested_price_fair: Optional[float] = None
    suggested_price_poor: Optional[float] = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    publish_date: Optional[str] = None
    is_set: Optional[bool] = None
    set_count: Optional[int] = None
    category: Optional[str] = None
    cover_image: Optional[str] = None
    description: Optional[str] = None


class BookPriceUpdate(BaseModel):
    condition: str
    new_price: float
    operator: str
    change_reason: Optional[str] = None


class Book(BookBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
