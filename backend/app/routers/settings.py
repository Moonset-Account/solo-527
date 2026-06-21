from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_active_user, require_role
from app import schemas, crud, models

router = APIRouter(prefix="/settings", tags=["系统设置"])


@router.get("/", response_model=List[schemas.SystemSetting])
def read_settings(
    module: Optional[models.ModuleType] = None,
    enabled_only: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    if module:
        return crud.crud_setting.get_by_module(db, module=module, enabled_only=enabled_only)
    filters = {}
    if enabled_only:
        filters["is_enabled"] = True
    return crud.crud_setting.get_multi(db, filters=filters)


@router.get("/module/{module}", response_model=dict)
def get_module_settings(
    module: models.ModuleType,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    settings = crud.crud_setting.get_by_module(db, module=module, enabled_only=True)
    result = {}
    for s in settings:
        value = s.value
        if s.value_type == "boolean":
            value = value.lower() == "true" if isinstance(value, str) else bool(value)
        elif s.value_type == "number":
            value = float(value) if value else 0
        elif s.value_type == "integer":
            value = int(value) if value else 0
        result[s.key] = value
    return result


@router.get("/all-enabled", response_model=dict)
def get_all_enabled_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.crud_setting.get_all_enabled(db)


@router.get("/module/{module}/enabled")
def is_module_enabled(
    module: models.ModuleType,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return {"module": module, "enabled": crud.crud_setting.is_module_enabled(db, module=module)}


@router.get("/{setting_id}", response_model=schemas.SystemSetting)
def read_setting(
    setting_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN, models.UserRole.SUPERVISOR))
):
    setting = crud.crud_setting.get(db, id=setting_id)
    if not setting:
        raise HTTPException(status_code=404, detail="设置不存在")
    return setting


@router.post("/", response_model=schemas.SystemSetting)
def create_setting(
    setting_in: schemas.SystemSettingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN))
):
    existing = crud.crud_setting.get_by_key(db, module=setting_in.module, key=setting_in.key)
    if existing:
        raise HTTPException(status_code=400, detail="该模块下已存在相同的配置键")
    return crud.crud_setting.create(db, obj_in=setting_in)


@router.put("/{setting_id}", response_model=schemas.SystemSetting)
def update_setting(
    setting_id: int,
    setting_in: schemas.SystemSettingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN))
):
    setting = crud.crud_setting.get(db, id=setting_id)
    if not setting:
        raise HTTPException(status_code=404, detail="设置不存在")
    return crud.crud_setting.update(db, db_obj=setting, obj_in=setting_in)


@router.put("/module/{module}/key/{key}")
def set_setting_value(
    module: models.ModuleType,
    key: str,
    value: str,
    value_type: str = "string",
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN))
):
    setting = crud.crud_setting.set_value(
        db, module=module, key=key, value=value, value_type=value_type, description=description
    )
    return {"module": module, "key": key, "value": value, "value_type": value_type}


@router.post("/module/{module}/toggle")
def toggle_module(
    module: models.ModuleType,
    enabled: bool,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN))
):
    setting = crud.crud_setting.set_value(
        db, module=module, key="enabled", value=str(enabled).lower(),
        value_type="boolean", description=f"{module.value}模块启停"
    )
    return {"module": module, "enabled": enabled}


@router.post("/init-defaults")
def init_default_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.ADMIN))
):
    defaults = [
        (models.ModuleType.INVENTORY, "enabled", "true", "boolean", "库存管理模块"),
        (models.ModuleType.INVENTORY, "low_stock_threshold", "10", "number", "低库存预警阈值"),
        (models.ModuleType.INVENTORY, "auto_check_alerts", "true", "boolean", "自动检查库存预警"),
        (models.ModuleType.INSPECTION, "enabled", "true", "boolean", "巡店管理模块"),
        (models.ModuleType.INSPECTION, "default_score_threshold", "80", "number", "合格分数阈值"),
        (models.ModuleType.INSPECTION, "auto_create_rectification", "true", "boolean", "不合格项自动创建整改"),
        (models.ModuleType.RECTIFICATION, "enabled", "true", "boolean", "整改管理模块"),
        (models.ModuleType.RECTIFICATION, "default_deadline_days", "7", "integer", "整改默认期限(天)"),
        (models.ModuleType.CASH_FLOW, "enabled", "true", "boolean", "现金流水模块"),
        (models.ModuleType.BATCH, "enabled", "true", "boolean", "烘焙批次模块"),
        (models.ModuleType.LOSS, "enabled", "true", "boolean", "报损管理模块"),
        (models.ModuleType.LOSS, "require_handler", "true", "boolean", "报损需要处理人"),
        (models.ModuleType.LABOR_COST, "enabled", "true", "boolean", "人力成本模块"),
        (models.ModuleType.LABOR_COST, "default_hourly_rate", "20", "number", "默认时薪"),
        (models.ModuleType.LABOR_COST, "default_overtime_rate", "30", "number", "默认加班时薪"),
    ]

    created = []
    for module, key, value, value_type, description in defaults:
        existing = crud.crud_setting.get_by_key(db, module=module, key=key)
        if not existing:
            setting = crud.crud_setting.create(db, obj_in=schemas.SystemSettingCreate(
                module=module, key=key, value=value, value_type=value_type, description=description
            ))
            created.append(setting)
    return {"created": len(created), "settings": created}
