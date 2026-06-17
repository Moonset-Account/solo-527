from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema, PageParams


class DictionaryBase(BaseSchema):
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool = True
    version: int = 1


class DictionaryCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = []


class DictionaryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DictionaryQuery(PageParams):
    keyword: Optional[str] = None
    code: Optional[str] = None
    is_active: Optional[bool] = None


class DictionaryItemBase(BaseSchema):
    dictionary_id: int
    label: str
    value: str
    sort_order: int = 0
    is_active: bool = True
    color: Optional[str] = None
    remark: Optional[str] = None


class DictionaryItemCreate(BaseModel):
    label: str
    value: str
    sort_order: int = 0
    color: Optional[str] = None
    remark: Optional[str] = None


class DictionaryItemUpdate(BaseModel):
    label: Optional[str] = None
    value: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    color: Optional[str] = None
    remark: Optional[str] = None


class DictionaryWithItemsResponse(DictionaryBase):
    items: List[DictionaryItemBase] = []


class ValidationRuleBase(BaseSchema):
    name: str
    code: str
    field_name: str
    rule_type: str
    rule_config: Optional[Dict[str, Any]] = None
    error_message: str
    is_active: bool = True
    description: Optional[str] = None


class ValidationRuleCreate(BaseModel):
    name: str
    code: str
    field_name: str
    rule_type: str
    rule_config: Optional[Dict[str, Any]] = None
    error_message: str
    description: Optional[str] = None


class ValidationRuleUpdate(BaseModel):
    name: Optional[str] = None
    field_name: Optional[str] = None
    rule_type: Optional[str] = None
    rule_config: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class ValidationRuleQuery(PageParams):
    keyword: Optional[str] = None
    rule_type: Optional[str] = None
    is_active: Optional[bool] = None


class ValidationRequest(BaseModel):
    field_name: str
    value: Any
