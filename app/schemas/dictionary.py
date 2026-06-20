from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class DictionaryCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    dict_type: str = Field(max_length=64)
    dict_key: str = Field(max_length=128)
    dict_value: str = Field(max_length=512)
    sort_order: int = 0
    is_active: bool = True
    notes: Optional[str] = None


class DictionaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    dict_type: str = Field(max_length=64)
    dict_key: str = Field(max_length=128)
    dict_value: str = Field(max_length=512)
    sort_order: int
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class DictionaryUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    dict_type: Optional[str] = Field(default=None, max_length=64)
    dict_key: Optional[str] = Field(default=None, max_length=128)
    dict_value: Optional[str] = Field(default=None, max_length=512)
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class DictionaryVersionCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    dictionary_id: str = Field(max_length=36)
    dict_type: str = Field(max_length=64)
    dict_key: str = Field(max_length=128)
    dict_value: str = Field(max_length=512)
    sort_order: int = 0
    is_active: bool = True
    notes: Optional[str] = None
    version: int
    operated_by: Optional[str] = Field(default=None, max_length=128)


class DictionaryVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    dictionary_id: str = Field(max_length=36)
    dict_type: str = Field(max_length=64)
    dict_key: str = Field(max_length=128)
    dict_value: str = Field(max_length=512)
    sort_order: int
    is_active: bool
    notes: Optional[str] = None
    version: int
    operated_by: Optional[str] = Field(default=None, max_length=128)
    created_at: datetime


class DictionaryVersionUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    dictionary_id: Optional[str] = Field(default=None, max_length=36)
    dict_type: Optional[str] = Field(default=None, max_length=64)
    dict_key: Optional[str] = Field(default=None, max_length=128)
    dict_value: Optional[str] = Field(default=None, max_length=512)
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    version: Optional[int] = None
    operated_by: Optional[str] = Field(default=None, max_length=128)
