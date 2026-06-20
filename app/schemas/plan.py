from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PlanCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(max_length=128)
    code: str = Field(max_length=64)
    price: float = 0
    call_limit: int = 0
    rate_limit: int = 0
    is_active: bool = True
    notes: Optional[str] = None


class PlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    name: str = Field(max_length=128)
    code: str = Field(max_length=64)
    price: float
    call_limit: int
    rate_limit: int
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PlanUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(default=None, max_length=128)
    code: Optional[str] = Field(default=None, max_length=64)
    price: Optional[float] = None
    call_limit: Optional[int] = None
    rate_limit: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class PlanRuleCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan_id: str = Field(max_length=36)
    rule_key: str = Field(max_length=128)
    rule_name: str = Field(max_length=256)
    rule_value: str = Field(max_length=512)
    is_active: bool = True
    notes: Optional[str] = None


class PlanRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    plan_id: str = Field(max_length=36)
    rule_key: str = Field(max_length=128)
    rule_name: str = Field(max_length=256)
    rule_value: str = Field(max_length=512)
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PlanRuleUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan_id: Optional[str] = Field(default=None, max_length=36)
    rule_key: Optional[str] = Field(default=None, max_length=128)
    rule_name: Optional[str] = Field(default=None, max_length=256)
    rule_value: Optional[str] = Field(default=None, max_length=512)
    is_active: Optional[bool] = None
    notes: Optional[str] = None
