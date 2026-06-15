from typing import List, Optional
from sqlalchemy.orm import Session

from app.models import DictType, DictItem, SystemConfig
from app.schemas import DictTypeCreate, DictItemCreate, SystemConfigCreate, SystemConfigUpdate


def get_dict_types(db: Session, skip: int = 0, limit: int = 100) -> List[DictType]:
    return db.query(DictType).order_by(DictType.id.asc()).offset(skip).limit(limit).all()


def get_dict_type(db: Session, type_id: int) -> Optional[DictType]:
    return db.query(DictType).filter(DictType.id == type_id).first()


def get_dict_type_by_code(db: Session, dict_code: str) -> Optional[DictType]:
    return db.query(DictType).filter(DictType.dict_code == dict_code).first()


def create_dict_type(db: Session, dict_type: DictTypeCreate) -> DictType:
    db_type = DictType(**dict_type.model_dump())
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type


def get_dict_items(db: Session, dict_type_id: int) -> List[DictItem]:
    return (
        db.query(DictItem)
        .filter(DictItem.dict_type_id == dict_type_id)
        .order_by(DictItem.sort_order.asc(), DictItem.id.asc())
        .all()
    )


def get_dict_items_by_code(db: Session, dict_code: str) -> List[DictItem]:
    dict_type = get_dict_type_by_code(db, dict_code)
    if not dict_type:
        return []
    return get_dict_items(db, dict_type.id)


def create_dict_item(db: Session, item: DictItemCreate) -> DictItem:
    db_item = DictItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_dict_item(db: Session, item_id: int, item_data: dict) -> Optional[DictItem]:
    db_item = db.query(DictItem).filter(DictItem.id == item_id).first()
    if not db_item:
        return None
    for field, value in item_data.items():
        setattr(db_item, field, value)
    db.commit()
    db.refresh(db_item)
    return db_item


def delete_dict_item(db: Session, item_id: int) -> bool:
    db_item = db.query(DictItem).filter(DictItem.id == item_id).first()
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True


def get_config_value(db: Session, config_key: str, default: str = None) -> Optional[str]:
    config = db.query(SystemConfig).filter(SystemConfig.config_key == config_key).first()
    return config.config_value if config else default


def get_configs_by_group(db: Session, config_group: str) -> List[SystemConfig]:
    return (
        db.query(SystemConfig)
        .filter(SystemConfig.config_group == config_group)
        .order_by(SystemConfig.id.asc())
        .all()
    )


def get_all_configs(db: Session, skip: int = 0, limit: int = 200) -> List[SystemConfig]:
    return db.query(SystemConfig).order_by(SystemConfig.config_group.asc(), SystemConfig.id.asc()).offset(skip).limit(limit).all()


def create_config(db: Session, config: SystemConfigCreate) -> SystemConfig:
    db_config = SystemConfig(**config.model_dump())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


def update_config(db: Session, config_id: int, config_update: SystemConfigUpdate) -> Optional[SystemConfig]:
    db_config = db.query(SystemConfig).filter(SystemConfig.id == config_id).first()
    if not db_config:
        return None
    update_data = config_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_config, field, value)
    db.commit()
    db.refresh(db_config)
    return db_config


def get_all_configs_dict(db: Session) -> dict:
    configs = get_all_configs(db)
    return {c.config_key: c.config_value for c in configs}
