from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas import (
    DictTypeResponse,
    DictTypeCreate,
    DictItemResponse,
    DictItemCreate,
    SystemConfigResponse,
    SystemConfigCreate,
    SystemConfigUpdate
)
from app.services.auth import RoleChecker, get_current_user
from app.services.config_service import (
    get_dict_types,
    get_dict_type,
    create_dict_type,
    get_dict_items,
    get_dict_items_by_code,
    create_dict_item,
    update_dict_item,
    delete_dict_item,
    get_all_configs,
    get_configs_by_group,
    create_config,
    update_config,
    get_config_value
)
from app.models import User

router = APIRouter(prefix="", tags=["系统配置"])


@router.get("/dict-types", response_model=List[DictTypeResponse])
def list_dict_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_dict_types(db)


@router.post("/dict-types", response_model=DictTypeResponse)
def create_new_dict_type(
    dict_type: DictTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    return create_dict_type(db, dict_type)


@router.get("/dict-types/{dict_code}/items", response_model=List[DictItemResponse])
def list_dict_items(
    dict_code: str,
    db: Session = Depends(get_db)
):
    return get_dict_items_by_code(db, dict_code)


@router.post("/dict-items", response_model=DictItemResponse)
def create_new_dict_item(
    item: DictItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    return create_dict_item(db, item)


@router.put("/dict-items/{item_id}", response_model=DictItemResponse)
def update_dict_item_by_id(
    item_id: int,
    item_data: DictItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    item = update_dict_item(db, item_id, item_data.model_dump())
    if not item:
        raise HTTPException(status_code=404, detail="Dict item not found")
    return item


@router.delete("/dict-items/{item_id}")
def delete_dict_item_by_id(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    success = delete_dict_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dict item not found")
    return {"message": "Dict item deleted successfully"}


@router.get("/configs", response_model=List[SystemConfigResponse])
def list_configs(
    group: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if group:
        return get_configs_by_group(db, group)
    return get_all_configs(db)


@router.post("/configs", response_model=SystemConfigResponse)
def create_new_config(
    config: SystemConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    return create_config(db, config)


@router.put("/configs/{config_id}", response_model=SystemConfigResponse)
def update_config_by_id(
    config_id: int,
    config_update: SystemConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    config = update_config(db, config_id, config_update)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return config


@router.get("/configs/{config_key}/value")
def get_config_value_by_key(
    config_key: str,
    db: Session = Depends(get_db)
):
    value = get_config_value(db, config_key)
    return {"key": config_key, "value": value}
