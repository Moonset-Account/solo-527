from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.schemas.dictionary import (
    DictionaryTypeCreate, DictionaryTypeUpdate, DictionaryTypeResponse,
    DictionaryItemCreate, DictionaryItemUpdate, DictionaryItemResponse,
    SystemConfigCreate, SystemConfigUpdate, SystemConfigResponse,
)
from app.services.dictionary_service import DictionaryService, SystemConfigService

router = APIRouter(prefix="/dictionary", tags=["字典管理"])


@router.get("/types", response_model=List[DictionaryTypeResponse])
def list_dictionary_types(
    is_active: bool = None,
    db: Session = Depends(get_db),
):
    return DictionaryService.list_types(db, is_active=is_active)


@router.post("/types", response_model=DictionaryTypeResponse)
def create_dictionary_type(
    type_in: DictionaryTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return DictionaryService.create_type(db, type_in, current_user)


@router.put("/types/{type_id}", response_model=DictionaryTypeResponse)
def update_dictionary_type(
    type_id: int,
    type_in: DictionaryTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return DictionaryService.update_type(db, type_id, type_in, current_user)


@router.delete("/types/{type_id}")
def delete_dictionary_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    DictionaryService.delete_type(db, type_id, current_user)
    return {"message": "Dictionary type deleted successfully"}


@router.get("/items", response_model=List[DictionaryItemResponse])
def list_dictionary_items(
    type_id: int = None,
    type_code: str = None,
    is_active: bool = None,
    db: Session = Depends(get_db),
):
    return DictionaryService.list_items(db, type_id=type_id, type_code=type_code, is_active=is_active)


@router.post("/items", response_model=DictionaryItemResponse)
def create_dictionary_item(
    item_in: DictionaryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return DictionaryService.create_item(db, item_in, current_user)


@router.put("/items/{item_id}", response_model=DictionaryItemResponse)
def update_dictionary_item(
    item_id: int,
    item_in: DictionaryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return DictionaryService.update_item(db, item_id, item_in, current_user)


@router.delete("/items/{item_id}")
def delete_dictionary_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    DictionaryService.delete_item(db, item_id)
    return {"message": "Dictionary item deleted successfully"}


@router.get("/configs", response_model=List[SystemConfigResponse])
def list_system_configs(
    group_name: str = None,
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return SystemConfigService.list(db, group_name=group_name, is_active=is_active)


@router.post("/configs", response_model=SystemConfigResponse)
def create_system_config(
    config_in: SystemConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return SystemConfigService.create(db, config_in, current_user)


@router.put("/configs/{config_id}", response_model=SystemConfigResponse)
def update_system_config(
    config_id: int,
    config_in: SystemConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return SystemConfigService.update(db, config_id, config_in, current_user)


@router.put("/configs/key/{config_key}", response_model=SystemConfigResponse)
def update_config_by_key(
    config_key: str,
    config_value: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return SystemConfigService.update_by_key(db, config_key, config_value, current_user)


@router.delete("/configs/{config_id}")
def delete_system_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    SystemConfigService.delete(db, config_id)
    return {"message": "System config deleted successfully"}
