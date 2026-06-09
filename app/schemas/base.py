from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field, ConfigDict

T = TypeVar("T")


def generate_request_id() -> str:
    return f"req_{uuid.uuid4().hex[:16]}"


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class BaseResponse(BaseModel, Generic[T]):
    code: int = Field(0, description="响应码, 0表示成功")
    message: str = Field("ok", description="响应消息")
    data: Optional[T] = Field(None, description="响应数据")
    request_id: str = Field(default_factory=generate_request_id, description="请求ID")

    model_config = ConfigDict(from_attributes=True)


class PageResponse(BaseModel, Generic[T]):
    items: List[T] = Field(default_factory=list, description="数据列表")
    total: int = Field(0, description="总数量")
    page: int = Field(1, description="当前页码, 从1开始")
    page_size: int = Field(20, description="每页数量")
    total_pages: int = Field(0, description="总页数")

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def build(
        cls,
        items: List[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "PageResponse[T]":
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(20, ge=1, le=500, description="每页数量")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class IdResponse(BaseSchema):
    id: int = Field(..., description="ID")


class MessageResponse(BaseSchema):
    message: str = Field("ok", description="消息")
