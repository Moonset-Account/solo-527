from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.dictionary import DictionaryType, DictionaryItem, SystemConfig
from app.models.user import User
from app.schemas.dictionary import (
    DictionaryTypeCreate, DictionaryTypeUpdate,
    DictionaryItemCreate, DictionaryItemUpdate,
    SystemConfigCreate, SystemConfigUpdate,
)
from app.services.audit_service import AuditService
from app.models.audit import AuditAction


class DictionaryService:
    @staticmethod
    def get_type_by_id(db: Session, type_id: int) -> Optional[DictionaryType]:
        return db.query(DictionaryType).filter(DictionaryType.id == type_id).first()

    @staticmethod
    def get_type_by_code(db: Session, type_code: str) -> Optional[DictionaryType]:
        return db.query(DictionaryType).filter(DictionaryType.type_code == type_code).first()

    @staticmethod
    def list_types(db: Session, is_active: bool = None) -> List[DictionaryType]:
        query = db.query(DictionaryType)
        if is_active is not None:
            query = query.filter(DictionaryType.is_active == is_active)
        return query.order_by(DictionaryType.type_name).all()

    @staticmethod
    def create_type(db: Session, type_in: DictionaryTypeCreate, current_user: User) -> DictionaryType:
        existing = DictionaryService.get_type_by_code(db, type_in.type_code)
        if existing:
            raise HTTPException(status_code=400, detail="Dictionary type code already exists")

        db_type = DictionaryType(
            **type_in.model_dump(),
            created_by=current_user.id,
        )
        db.add(db_type)
        db.commit()
        db.refresh(db_type)

        AuditService.log(
            db, current_user, AuditAction.CREATE,
            "dictionary_type", db_type.id,
            description=f"创建字典类型: {type_in.type_name}"
        )

        return db_type

    @staticmethod
    def update_type(db: Session, type_id: int, type_in: DictionaryTypeUpdate, current_user: User) -> DictionaryType:
        db_type = DictionaryService.get_type_by_id(db, type_id)
        if not db_type:
            raise HTTPException(status_code=404, detail="Dictionary type not found")
        if db_type.is_system:
            raise HTTPException(status_code=400, detail="System dictionary type cannot be modified")

        update_data = type_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_type, field, value)

        db.commit()
        db.refresh(db_type)
        return db_type

    @staticmethod
    def delete_type(db: Session, type_id: int, current_user: User) -> bool:
        db_type = DictionaryService.get_type_by_id(db, type_id)
        if not db_type:
            raise HTTPException(status_code=404, detail="Dictionary type not found")
        if db_type.is_system:
            raise HTTPException(status_code=400, detail="System dictionary type cannot be deleted")

        db.query(DictionaryItem).filter(DictionaryItem.type_id == type_id).delete()
        db.delete(db_type)
        db.commit()
        return True

    @staticmethod
    def get_item_by_id(db: Session, item_id: int) -> Optional[DictionaryItem]:
        return db.query(DictionaryItem).filter(DictionaryItem.id == item_id).first()

    @staticmethod
    def list_items(db: Session, type_id: int = None, type_code: str = None, is_active: bool = None) -> List[DictionaryItem]:
        query = db.query(DictionaryItem)
        if type_id:
            query = query.filter(DictionaryItem.type_id == type_id)
        if type_code:
            dict_type = DictionaryService.get_type_by_code(db, type_code)
            if dict_type:
                query = query.filter(DictionaryItem.type_id == dict_type.id)
            else:
                return []
        if is_active is not None:
            query = query.filter(DictionaryItem.is_active == is_active)
        return query.order_by(DictionaryItem.sort_order, DictionaryItem.item_value).all()

    @staticmethod
    def create_item(db: Session, item_in: DictionaryItemCreate, current_user: User) -> DictionaryItem:
        db_item = DictionaryItem(**item_in.model_dump())
        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        AuditService.log(
            db, current_user, AuditAction.CREATE,
            "dictionary_item", db_item.id,
            description=f"创建字典项: {item_in.item_value}"
        )

        return db_item

    @staticmethod
    def update_item(db: Session, item_id: int, item_in: DictionaryItemUpdate, current_user: User) -> DictionaryItem:
        db_item = DictionaryService.get_item_by_id(db, item_id)
        if not db_item:
            raise HTTPException(status_code=404, detail="Dictionary item not found")

        update_data = item_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_item, field, value)

        db.commit()
        db.refresh(db_item)
        return db_item

    @staticmethod
    def delete_item(db: Session, item_id: int) -> bool:
        db_item = DictionaryService.get_item_by_id(db, item_id)
        if not db_item:
            raise HTTPException(status_code=404, detail="Dictionary item not found")
        db.delete(db_item)
        db.commit()
        return True


class SystemConfigService:
    @staticmethod
    def get_by_id(db: Session, config_id: int) -> Optional[SystemConfig]:
        return db.query(SystemConfig).filter(SystemConfig.id == config_id).first()

    @staticmethod
    def get_by_key(db: Session, config_key: str) -> Optional[SystemConfig]:
        return db.query(SystemConfig).filter(SystemConfig.config_key == config_key).first()

    @staticmethod
    def list(db: Session, group_name: str = None, is_active: bool = None) -> List[SystemConfig]:
        query = db.query(SystemConfig)
        if group_name:
            query = query.filter(SystemConfig.group_name == group_name)
        if is_active is not None:
            query = query.filter(SystemConfig.is_active == is_active)
        return query.order_by(SystemConfig.group_name, SystemConfig.config_key).all()

    @staticmethod
    def create(db: Session, config_in: SystemConfigCreate, current_user: User) -> SystemConfig:
        existing = SystemConfigService.get_by_key(db, config_in.config_key)
        if existing:
            raise HTTPException(status_code=400, detail="Config key already exists")

        db_config = SystemConfig(
            **config_in.model_dump(),
            updated_by=current_user.id,
        )
        db.add(db_config)
        db.commit()
        db.refresh(db_config)

        AuditService.log(
            db, current_user, AuditAction.CREATE,
            "system_config", db_config.id,
            description=f"创建系统配置: {config_in.config_key}"
        )

        return db_config

    @staticmethod
    def update(db: Session, config_id: int, config_in: SystemConfigUpdate, current_user: User) -> SystemConfig:
        db_config = SystemConfigService.get_by_id(db, config_id)
        if not db_config:
            raise HTTPException(status_code=404, detail="System config not found")

        update_data = config_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_config, field, value)
        db_config.updated_by = current_user.id

        db.commit()
        db.refresh(db_config)

        AuditService.log(
            db, current_user, AuditAction.UPDATE,
            "system_config", config_id,
            description=f"更新系统配置"
        )

        return db_config

    @staticmethod
    def update_by_key(db: Session, config_key: str, config_value: str, current_user: User) -> SystemConfig:
        db_config = SystemConfigService.get_by_key(db, config_key)
        if not db_config:
            raise HTTPException(status_code=404, detail="System config not found")

        old_value = db_config.config_value
        db_config.config_value = config_value
        db_config.updated_by = current_user.id
        db.commit()
        db.refresh(db_config)

        AuditService.log(
            db, current_user, AuditAction.UPDATE,
            "system_config", db_config.id,
            old_value=old_value,
            new_value=config_value,
            description=f"更新配置: {config_key}"
        )

        return db_config

    @staticmethod
    def delete(db: Session, config_id: int) -> bool:
        db_config = SystemConfigService.get_by_id(db, config_id)
        if not db_config:
            raise HTTPException(status_code=404, detail="System config not found")
        db.delete(db_config)
        db.commit()
        return True
