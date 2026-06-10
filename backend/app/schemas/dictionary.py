from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class DictionaryTypeBase(BaseModel):
    type_code: str
    type_name: str
    description: Optional[str] = None
    is_system: bool = False
    is_active: bool = True


class DictionaryTypeCreate(DictionaryTypeBase):
    pass


class DictionaryTypeUpdate(BaseModel):
    type_name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DictionaryTypeResponse(DictionaryTypeBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DictionaryItemBase(BaseModel):
    type_id: int
    item_code: str
    item_value: str
    item_label: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    remark: Optional[str] = None
    extra_data: Optional[str] = None


class DictionaryItemCreate(DictionaryItemBase):
    pass


class DictionaryItemUpdate(BaseModel):
    item_value: Optional[str] = None
    item_label: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    remark: Optional[str] = None
    extra_data: Optional[str] = None


class DictionaryItemResponse(DictionaryItemBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SystemConfigBase(BaseModel):
    config_key: str
    config_value: Optional[str] = None
    config_label: Optional[str] = None
    config_type: str = "string"
    description: Optional[str] = None
    group_name: Optional[str] = None
    is_active: bool = True


class SystemConfigCreate(SystemConfigBase):
    pass


class SystemConfigUpdate(BaseModel):
    config_value: Optional[str] = None
    config_label: Optional[str] = None
    config_type: Optional[str] = None
    description: Optional[str] = None
    group_name: Optional[str] = None
    is_active: Optional[bool] = None


class SystemConfigResponse(SystemConfigBase):
    id: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
