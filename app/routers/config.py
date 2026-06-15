from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SystemConfig, ConfigChangeLog
from app.schemas import SystemConfigCreate, SystemConfigUpdate, SystemConfig as ConfigSchema, ConfigChangeLog as ChangeLogSchema

router = APIRouter()


@router.get("", response_model=List[ConfigSchema])
def get_all_configs(db: Session = Depends(get_db)):
    return db.query(SystemConfig).order_by(SystemConfig.id).all()


@router.get("/logs/all", response_model=List[ChangeLogSchema])
def get_all_change_logs(db: Session = Depends(get_db)):
    return db.query(ConfigChangeLog).order_by(ConfigChangeLog.created_at.desc()).all()


@router.get("/logs/{config_key}", response_model=List[ChangeLogSchema])
def get_config_change_logs(
    config_key: str,
    db: Session = Depends(get_db)
):
    logs = db.query(ConfigChangeLog).filter(
        ConfigChangeLog.config_key == config_key
    ).order_by(ConfigChangeLog.created_at.desc()).all()
    return logs


@router.get("/{config_key}")
def get_config(config_key: str, db: Session = Depends(get_db)):
    config = db.query(SystemConfig).filter(SystemConfig.config_key == config_key).first()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")
    return config


@router.post("", response_model=ConfigSchema)
def create_config(config: SystemConfigCreate, db: Session = Depends(get_db)):
    existing = db.query(SystemConfig).filter(SystemConfig.config_key == config.config_key).first()
    if existing:
        raise HTTPException(status_code=400, detail="配置键已存在")

    db_config = SystemConfig(**config.model_dump())
    db.add(db_config)

    change_log = ConfigChangeLog(
        config_key=config.config_key,
        old_value=None,
        new_value=config.config_value,
        change_type="create"
    )
    db.add(change_log)

    db.commit()
    db.refresh(db_config)
    return db_config


@router.put("/{config_key}", response_model=ConfigSchema)
def update_config(
    config_key: str,
    config_data: SystemConfigUpdate,
    db: Session = Depends(get_db)
):
    config = db.query(SystemConfig).filter(SystemConfig.config_key == config_key).first()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")

    old_value = config.config_value
    config.config_value = config_data.config_value

    change_log = ConfigChangeLog(
        config_key=config_key,
        old_value=old_value,
        new_value=config_data.config_value,
        operator=config_data.operator,
        change_type="update"
    )
    db.add(change_log)

    db.commit()
    db.refresh(config)
    return config


@router.delete("/{config_key}")
def delete_config(config_key: str, db: Session = Depends(get_db)):
    config = db.query(SystemConfig).filter(SystemConfig.config_key == config_key).first()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")

    old_value = config.config_value
    db.delete(config)

    change_log = ConfigChangeLog(
        config_key=config_key,
        old_value=old_value,
        new_value=None,
        change_type="delete"
    )
    db.add(change_log)

    db.commit()
    return {"status": "success", "message": "配置已删除"}
