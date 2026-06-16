from pydantic import BaseModel
from typing import Optional, List, Generic, TypeVar
from datetime import datetime

T = TypeVar("T")


class PageParams(BaseModel):
    page: int = 1
    page_size: int = 20
    keyword: Optional[str] = None


class PageResult(Generic[T], BaseModel):
    items: List[T]
    total: int
    page: int
    page_size: int


class ResponseModel(Generic[T], BaseModel):
    code: int = 200
    message: str = "success"
    data: Optional[T] = None
